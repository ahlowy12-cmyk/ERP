import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InspectionRequestsRepository } from './inspection-requests.repository';
import { NcrsRepository } from './ncrs.repository';
import { NumberingService } from 'src/shared/services/numbering.service';
import { MrvsService } from 'src/modules/inventory/mrvs/mrvs.service';
import { PurchaseOrdersService } from 'src/modules/procurement/purchase-orders/purchase-orders.service';
import { SubmitInspectionDto } from './dto/submit-inspection.dto';
import { CreateNcrDto } from './dto/create-ncr.dto';
@Injectable()
export class InspectionService {
  constructor(
    private readonly _InspectionRepository: InspectionRequestsRepository,
    private readonly _NcrsRepository: NcrsRepository,
    private readonly _NumberingService: NumberingService,
    private readonly _MrvsService: MrvsService,
    private readonly _PurchaseOrdersService: PurchaseOrdersService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // 1. تسليم نتيجة الفحص
  async submitInspection(id: string, data: SubmitInspectionDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const inspection = await this._InspectionRepository.findOne({
        filter: { _id: id },
        options: { session },
      });
      if (!inspection)
        throw new NotFoundException('Inspection Request not found');
      if (inspection.status !== 'Pending')
        throw new BadRequestException('Inspection already processed');

      // تحديث بيانات المفتش والكميات
      inspection.inspectorName = data.inspectorName;
      inspection.inspectionDate = new Date(data.inspectionDate);
      inspection.status = data.status; // Accepted | Rejected | Conditional
      inspection.notes = data.notes;
      inspection.items = data.items as any; // Assuming items are of the correct type

      await inspection.save({ session });

      // تطبيق القاعدة البرمجية (Business Rule) بناءً على الحالة
      if (
        inspection.status === 'Accepted' ||
        inspection.status === 'Conditional'
      ) {
        if (
          inspection.status === 'Accepted' ||
          inspection.status === 'Conditional'
        ) {
          // ✅ جلب بيانات أمر الشراء لتمريرها
          const poResult = await this._PurchaseOrdersService.getPoDetails(
            inspection.poId?.toString() || '',
          );

          // ✅ إنشاء MRV تلقائياً
          await this._MrvsService.createAutoFromInspection(
            inspection,
            poResult.data,
            session,
          );
        }
      }

      if (inspection.status === 'Rejected') {
        // إذا كان الفحص مرفوضاً، نترك للمستخدم خيار رفع NCR يدوياً أو ننشئه كمسودة
        // يمكن رفع NCR من خلال endpoint منفصلة
      }

      await session.commitTransaction();
      return {
        message: `Inspection submitted with status: ${inspection.status}`,
        data: inspection,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Failed to submit inspection: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }

  // 2. إنشاء تقرير عدم مطابقة (NCR)
  async createNcr(inspectionId: string, data: CreateNcrDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const inspection = await this._InspectionRepository.findOne({
        filter: { _id: inspectionId },
        options: { session },
      });
      if (!inspection)
        throw new NotFoundException('Inspection Request not found');

      // هنا تفترض إضافة دالة generateNcrNumber في NumberingService مستقبلاً
      const ncrNumber = await this._NumberingService.generateMIVNumber(); // Placeholder للتجربة حتى تحديث NumberingService بـ NCR
      const realNcrNumber = ncrNumber.replace('MIV', 'NCR');

      const ncr = await this._NcrsRepository.create(
        {
          ...data,
          ncrNumber: realNcrNumber,
          inspectionRequestId: inspection._id,
          poNumber: inspection.poNumber,
          vendorName: inspection.vendorName,
          issueDate: new Date(),
          status: 'Open',
        },
        { session },
      );

      // ربط الـ NCR بالفحص
      inspection.ncrId = ncr._id as any;
      await inspection.save({ session });

      await session.commitTransaction();
      return { message: 'NCR created successfully', data: ncr };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Failed to create NCR: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }

  // 3. إغلاق تقرير عدم المطابقة (NCR)
  async resolveNcr(ncrId: string, resolvedBy: string) {
    const ncr = await this._NcrsRepository.findOneAndUpdate(
      { _id: ncrId },
      {
        status: 'Closed',
        resolvedDate: new Date(),
        resolvedBy,
      },
    );
    if (!ncr) throw new NotFoundException('NCR not found');
    return { message: 'NCR resolved', data: ncr };
  }

  // جلب كل طلبات الفحص
  async findAllInspections(page: number = 1, limit: number = 20) {
    return await this._InspectionRepository.findAll({
      paginate: { page, limit },
      sort: { createdAt: -1 },
    });
  }

  // جلب تفاصيل طلب فحص محدد
  async findOneInspection(id: string) {
    const inspection = await this._InspectionRepository.findOne({
      filter: { _id: id },
    });
    if (!inspection)
      throw new NotFoundException('Inspection Request not found');
    return { data: inspection };
  }

  // جلب كل تقارير عدم المطابقة (NCRs)
  async findAllNcrs(page: number = 1, limit: number = 20) {
    return await this._NcrsRepository.findAll({
      paginate: { page, limit },
      sort: { issueDate: -1 },
    });
  }
}
