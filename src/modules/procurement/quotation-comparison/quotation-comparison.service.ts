import { Injectable, NotFoundException } from '@nestjs/common';
import { RfqsRepository } from '../rfqs/rfqs.repository';
import { QuotationsRepository } from '../rfqs/quotations.repository';
import { PurchaseRequestRepository } from '../purchase-requests/purchase-requests.repository';

@Injectable()
export class QuotationComparisonService {
  constructor(
    private readonly _RfqsRepository: RfqsRepository,
    private readonly _QuotationsRepository: QuotationsRepository,
    private readonly _PRRepository: PurchaseRequestRepository,
  ) {}

  // جلب كافة طلبات عروض الأسعار (RFQs) التي تحتوي على ردود لعرضها في الشاشة الرئيسية
  async getAllComparisons(page: number = 1, limit: number = 20) {
    // نجلب فقط الـ RFQs التي ليست مسودة (Draft) ولها عروض أسعار
    return await this._RfqsRepository.findAll({
      filter: {
        status: {
          $in: ['Partially Responded', 'Fully Responded', 'Awarded', 'Closed'],
        },
      },
      paginate: { page, limit },
      sort: { createdAt: -1 },
    });
  }

  // جلب المقارنة التفصيلية لطلب عرض سعر محدد (Side-by-side comparison)
  async getComparisonDetails(rfqId: string) {
    // 1. جلب بيانات الـ RFQ
    const rfq = await this._RfqsRepository.findOne({ filter: { _id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    // 2. جلب بيانات طلب الشراء الأساسي (PR)
    const pr = await this._PRRepository.findOne({
      filter: { _id: rfq.purchaseRequestId },
    });

    // 3. جلب كافة عروض الأسعار (Quotations) المقدمة لهذا الـ RFQ
    const quotationsResult = await this._QuotationsRepository.findAll({
      filter: { rfqId: rfq._id },
      sort: { totalAmount: 1 }, // ترتيب تصاعدي حسب السعر الأقل ليكون هو الأول
    });

    const quotations = quotationsResult || [];

    // 4. تحديد "أفضل سعر" برمجياً (تحديث الحقل isBestPrice ديناميكياً للعرض)
    if (quotations.length > 0) {
      // بما أن المصفوفة مرتبة، فالعنصر الأول هو الأرخص
      quotations[0].isBestPrice = true;
      for (let i = 1; i < quotations.length; i++) {
        quotations[i].isBestPrice = false;
      }
    }

    // 5. بناء الاستجابة المتطابقة مع متطلبات الفرونت إند
    return {
      rfq: {
        id: rfq._id,
        rfqNumber: rfq.rfqNumber,
        title: rfq.title,
        status: rfq.status,
        deadlineDate: rfq.deadlineDate,
      },
      pr: pr
        ? {
            id: pr._id,
            requestNumber: pr.requestNumber,
            department: pr.department,
            requestedBy: pr.requestedBy,
          }
        : null,
      quotations: quotations.map((q: any) => ({
        id: q._id,
        quotationNumber: q.quotationNumber,
        vendorId: q.vendorId,
        vendorName: q.vendorName,
        totalAmount: q.totalAmount,
        deliveryWeeks: q.deliveryWeeks,
        isBestPrice: q.isBestPrice,
        isRecommended: q.isRecommended,
        status: q.status,
        items: q.items, // إرسال تفاصيل الأصناف للمقارنة الدقيقة
      })),
    };
  }
}
