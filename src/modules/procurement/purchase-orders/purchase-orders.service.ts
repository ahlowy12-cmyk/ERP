import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { NumberingService } from 'src/shared/services/numbering.service';
import { QueryOptions } from 'mongoose';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly _PORepository: PurchaseOrdersRepository,
    private readonly _NumberingService: NumberingService,
  ) {}

  // تُستدعى هذه الدالة تلقائياً من RfqsService عند الترسية (Award)
  async createAutoFromQuotation(
    rfq: any,
    quotation: any,
    session?: QueryOptions['session'],
  ) {
    try {
      // 1. توليد الأرقام
      // ملحوظة: في نظامك يتم توليد PO-YYYY-PR_SEQ-RFQ_SEQ-QTN_SEQ-SEQ
      // للتبسيط وللحفاظ على الأداء سنستخدم NumberingService لتوليد تسلسل PO
      // يمكنك تعديل NumberingService لاحقاً ليدمج كل هذه الأرقام إذا لزم الأمر

      const prParts = rfq.rootProcurementNumber.split('-'); // PR-2026-0001
      const prYear = prParts[1];
      const rfqSeqParts = rfq.rfqNumber.split('-');
      const rfqSeq = rfqSeqParts[rfqSeqParts.length - 1]; // 0001

      const poSeq = await this._NumberingService.generatePONumber(session); // دالة افتراضية سنضيفها لـ NumberingService
      const documentNumber = `PO-${prYear}-${prParts[2]}-${rfqSeq}-${quotation.quotationSequence}-${poSeq}`;
      const poNumber = `PO-${prYear}-${poSeq}`;

      // 2. إعداد مصفوفة الأصناف
      const poItems = quotation.items.map((item: any, index: number) => ({
        itemCode: item.itemCode || 'N/A',
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        uom: item.uom,
        totalPrice: item.totalPrice,
        sortOrder: index + 1,
      }));

      // 3. تهيئة سير الاعتماد (Workflow Initialization)
      const approvalWorkflow = [
        { stepOrder: 1, role: 'Procurement Manager', status: 'Pending' },
        { stepOrder: 2, role: 'Finance Director', status: 'Pending' },
        { stepOrder: 3, role: 'CEO', status: 'Pending' },
      ];

      // 4. الحفظ في قاعدة البيانات
      const po = await this._PORepository.create(
        {
          poNumber,
          documentNumber,
          procurementChain: `${rfq.procurementChain}-${quotation.quotationSequence}-${poSeq}`,
          rootProcurementNumber: rfq.rootProcurementNumber,
          chainId: rfq.chainId,
          parentDocumentId: rfq._id,
          parentDocumentNumber: rfq.rfqNumber,
          rfqId: rfq._id,
          rfqNumber: rfq.rfqNumber,
          quotationNumber: quotation.quotationNumber,

          vendorId: quotation.vendorId,
          vendorName: quotation.vendorName,
          vendorContact: quotation.vendorContactPerson,

          deliveryDate:
            quotation.validityDate ||
            new Date(new Date().setDate(new Date().getDate() + 14)),
          costCenter: rfq.costCenter || 'N/A',
          paymentTerms: quotation.paymentTerms || 'N/A',
          status: 'Pending Approval',

          subtotal: quotation.subtotal || quotation.totalAmount,
          taxPercent: quotation.taxPercent,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,

          chargeType: rfq.chargeType,
          projectId: rfq.projectId,
          projectName: rfq.projectName,
          assetId: rfq.assetId,
          assetName: rfq.assetName,

          items: poItems,
          approvalWorkflow,
        },
        { session },
      );

      return po;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to auto-create PO: ${error.message}`,
      );
    }
  }

  // الموافقة على خطوة في سير الاعتماد
  async approveStep(
    poId: string,
    role: string,
    approverName: string,
    comments?: string,
  ) {
    const po = await this._PORepository.findOne({ filter: { _id: poId } });
    if (!po) throw new NotFoundException('Purchase Order not found');

    const stepIndex = po.approvalWorkflow.findIndex(
      (step) => step.role === role,
    );
    if (stepIndex === -1)
      throw new BadRequestException('Invalid approval role for this PO');
    if (po.approvalWorkflow[stepIndex].status === 'Approved')
      throw new BadRequestException('Step already approved');

    // التأكد من أن الخطوة السابقة تم الموافقة عليها (إذا لم تكن الخطوة الأولى)
    if (
      stepIndex > 0 &&
      po.approvalWorkflow[stepIndex - 1].status !== 'Approved'
    ) {
      throw new BadRequestException(
        'Previous approval steps must be completed first',
      );
    }

    // تحديث الخطوة
    po.approvalWorkflow[stepIndex].status = 'Approved';
    po.approvalWorkflow[stepIndex].approverName = approverName;
    po.approvalWorkflow[stepIndex].actionDate = new Date();
    po.approvalWorkflow[stepIndex].comments = comments;

    // التحقق مما إذا كانت هذه هي الخطوة الأخيرة
    const allApproved = po.approvalWorkflow.every(
      (step) => step.status === 'Approved',
    );
    if (allApproved) {
      po.status = 'Approved'; // تطبيق القاعدة المنطقية
    }

    await po.save();
    return { message: 'PO approval step recorded successfully', data: po };
  }

  async getPoDetails(poId: string) {
    const po = await this._PORepository.findOne({ filter: { _id: poId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return { data: po };
  }

  // إنشاء PO يدوي (بدون المرور بـ RFQ)
  async createManual(data: any, session?: QueryOptions['session']) {
    const poSeq = await this._NumberingService.generatePONumber(session); // يحتاج لإضافة الدالة في NumberingService
    const poNumber = `PO-${new Date().getFullYear()}-${poSeq}`;

    const approvalWorkflow = [
      { stepOrder: 1, role: 'Procurement Manager', status: 'Pending' },
      { stepOrder: 2, role: 'Finance Director', status: 'Pending' },
      { stepOrder: 3, role: 'CEO', status: 'Pending' },
    ];

    const po = await this._PORepository.create(
      {
        ...data,
        poNumber,
        documentNumber: poNumber,
        procurementChain: poSeq,
        rootProcurementNumber: poNumber,
        status: 'Draft',
        approvalWorkflow,
      },
      { session },
    );

    return { message: 'Manual PO created successfully', data: po };
  }

  // جلب كافة أوامر الشراء
  async findAll(page: number = 1, limit: number = 20) {
    return await this._PORepository.findAll({
      paginate: { page, limit },
      sort: { createdAt: -1 },
    });
  }

  // إضافة دالة رفع العقد
  async uploadContract(
    poId: string,
    file: Express.Multer.File,
    contractNumber?: string,
    contractTitle?: string,
  ) {
    const po = await this._PORepository.findOne({ filter: { _id: poId } });
    if (!po) throw new NotFoundException('Purchase Order not found');

    // 💡 افتراض استخدام خدمة رفع (مثلاً Cloudinary أو AWS S3) قمت ببرمجتها مسبقاً
    // const uploadResult = await this._FileUploadService.uploadFile(file);
    const fakeFileUrl = `https://storage.petroflow.com/contracts/po-${poId}.pdf`; // Placeholder

    po.contractFileUrl = fakeFileUrl; // تأكد من إضافة هذا الحقل للـ Schema
    if (contractNumber) po.contractNumber = contractNumber;
    if (contractTitle) po.contractTitle = contractTitle;

    await po.save();
    return {
      message: 'Contract uploaded successfully',
      data: { contractFileUrl: fakeFileUrl },
    };
  }
}
