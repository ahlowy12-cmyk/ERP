import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { NumberingService } from 'src/shared/services/numbering.service';
import { InventoryEngineService } from 'src/shared/services/inventory-engine.service';
import { AuditLogService } from 'src/shared/audit-logs/audit-logs.service';
import { MrvsRepository } from './mrvs.repository';
import { InventoryItemRepository } from 'src/DB/repositories/inventory-item.repository';
import { MRVModelName, MRVDocument } from './entities/mrv.model';

@Injectable()
export class MrvsService {
  constructor(
    @InjectModel(MRVModelName) private readonly mrvModel: Model<MRVDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly numberingService: NumberingService,
    private readonly inventoryEngineService: InventoryEngineService,
    private readonly auditLogService: AuditLogService,
    private readonly _Repository: MrvsRepository,
    private readonly _InventoryItemRepository: InventoryItemRepository,
  ) {}

  async create(createDto: any, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const mrvNumber = await this.numberingService.generateMRVNumber(session);

      const mrv = new this.mrvModel({
        ...createDto,
        mrvNumber,
        status: 'Draft',
        createdBy: userId,
      });

      await mrv.save({ session });

      await this.auditLogService.log({
        userId,
        action: 'CREATE',
        entity: 'MRV',
        entityId: mrv._id,
        details: `Created MRV ${mrvNumber}`,
      });

      await session.commitTransaction();
      return { message: 'MRV created successfully', data: mrv };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(query?: any) {
    return this.mrvModel
      .find(query || {})
      .populate('warehouseId')
      .populate('supplierId')
      .exec();
  }

  async findOne(id: string) {
    const mrv = await this.mrvModel
      .findById(id)
      .populate('warehouseId supplierId items.itemId');
    if (!mrv) throw new NotFoundException('MRV not found');
    return { data: mrv };
  }

  async approve(id: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const mrv = await this.mrvModel.findById(id).session(session);
      if (!mrv) throw new NotFoundException('MRV not found');
      if (mrv.status !== 'Draft')
        throw new BadRequestException('Only Draft MRVs can be approved');

      // 1. تحديث الحالة
      mrv.status = 'Approved';
      mrv.approvedBy = userId;
      mrv.approvedAt = new Date();
      await mrv.save({ session });

      // 2. تشغيل محرك المخزون لإضافة الكميات وتحديث متوسط التكلفة
      await this.inventoryEngineService.processMRV(mrv, session);

      // 3. تسجيل التدقيق
      await this.auditLogService.log({
        userId,
        action: 'APPROVE',
        entity: 'MRV',
        entityId: mrv._id,
        details: `Approved MRV ${mrv.mrvNumber} and updated inventory`,
      });

      await session.commitTransaction();
      return { message: 'MRV approved successfully and inventory updated' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  async update(id: string, dto: any, userId: string) {
    return this._Repository.findOneAndUpdate({ _id: id }, { $set: dto });
  }

  async remove(id: string, userId: string) {
    return this._Repository.softDelete({ _id: id });
  }

  async createAutoFromInspection(
    inspection: any,
    poDetails: any,
    session?: any,
  ) {
    const mrvNumber = await this.numberingService.generateMRVNumber(session);

    // Map items and resolve itemIds
    const items: any[] = [];
    for (const item of inspection.items) {
      const dbItem = await this._InventoryItemRepository.findOne({
        itemCode: item.itemCode,
      });
      items.push({
        itemId: dbItem ? dbItem._id : new Types.ObjectId(),
        expectedQuantity: item.quantityOrdered,
        receivedQuantity: item.quantityReceived,
        acceptedQuantity: item.quantityAccepted,
        rejectedQuantity: item.quantityRejected,
        notes: item.status,
      });
    }

    const mrv = new this.mrvModel({
      mrvNumber,
      poId: inspection.poId,
      vendorId: poDetails.vendorId || new Types.ObjectId(),
      receivedDate: new Date(),
      deliveryNoteNumber: inspection.requestNumber,
      status: 'Inspected',
      items,
      receivedById: poDetails.createdBy || new Types.ObjectId(),
    });

    await mrv.save({ session });
    return mrv;
  }
}
