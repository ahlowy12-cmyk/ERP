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
import { MivsRepository } from './mivs.repository';
import { MIVDocument, MIVModelName } from './entities/miv.model';

@Injectable()
export class MivsService {
  constructor(
    @InjectModel(MIVModelName) private readonly mivModel: Model<MIVDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly numberingService: NumberingService,
    private readonly inventoryEngineService: InventoryEngineService,
    private readonly auditLogService: AuditLogService,
    private readonly _Repository: MivsRepository,
  ) {}

  async create(createDto: any, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const mivNumber = await this.numberingService.generateMIVNumber(session);

      const miv = new this.mivModel({
        ...createDto,
        mivNumber,
        status: 'Draft',
        createdBy: userId,
      });

      await miv.save({ session });

      await this.auditLogService.log({
        userId,
        action: 'CREATE',
        entity: 'MIV',
        entityId: miv._id,
        details: `Created MIV ${mivNumber}`,
      });

      await session.commitTransaction();
      return { message: 'MIV created successfully', data: miv };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(query?: any) {
    return this.mivModel
      .find(query || {})
      .populate('warehouseId')
      .populate('departmentId')
      .exec();
  }

  async findOne(id: string) {
    const miv = await this.mivModel
      .findById(id)
      .populate('warehouseId departmentId items.itemId');
    if (!miv) throw new NotFoundException('MIV not found');
    return { data: miv };
  }

  async approve(id: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const miv = await this.mivModel.findById(id).session(session);
      if (!miv) throw new NotFoundException('MIV not found');
      if (miv.status !== 'Draft')
        throw new BadRequestException('Only Draft MIVs can be approved');

      miv.status = 'Approved';
      miv.approvedBy = userId;
      miv.approvedAt = new Date();
      await miv.save({ session });

      // تشغيل محرك المخزون لخصم الكميات (يرمي خطأ إذا لم يكفِ الرصيد)
      await this.inventoryEngineService.processMIV(miv, session);

      await this.auditLogService.log({
        userId,
        action: 'APPROVE',
        entity: 'MIV',
        entityId: miv._id,
        details: `Approved MIV ${miv.mivNumber} and deducted from inventory`,
      });

      await session.commitTransaction();
      return { message: 'MIV approved successfully and inventory updated' };
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

  async createAutoFromPR(
    purchaseRequest: any,
    mivItemsToCreate: any[],
    session?: any,
  ) {
    const mivNumber = await this.numberingService.generateMIVNumber(session);

    let warehouseId: Types.ObjectId;
    try {
      const warehouse = await this.connection.model('Warehouse').findOne({ isDeleted: false }).session(session).exec();
      warehouseId = warehouse ? (warehouse._id as Types.ObjectId) : new Types.ObjectId();
    } catch {
      warehouseId = new Types.ObjectId();
    }

    const items: any[] = [];
    for (const item of mivItemsToCreate) {
      let itemId: Types.ObjectId | undefined;
      try {
        const dbItem = await this.connection.model('InventoryItem').findOne({ itemCode: item.itemCode }).session(session).exec();
        if (dbItem) itemId = dbItem._id as Types.ObjectId;
      } catch {}

      items.push({
        itemId: itemId || new Types.ObjectId(),
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.fulfillFromStock || item.quantity,
        uom: item.uom,
      });
    }

    let requestedById: Types.ObjectId;
    try {
      if (Types.ObjectId.isValid(purchaseRequest.requestedBy)) {
        requestedById = new Types.ObjectId(purchaseRequest.requestedBy);
      } else {
        const user = await this.connection.model('User').findOne().session(session).exec();
        requestedById = user ? (user._id as Types.ObjectId) : new Types.ObjectId();
      }
    } catch {
      requestedById = new Types.ObjectId();
    }

    const miv = new this.mivModel({
      documentNumber: mivNumber,
      warehouseId,
      requestedBy: requestedById,
      status: 'Draft',
      items,
      remarks: `Auto-generated from PR ${purchaseRequest.requestNumber || purchaseRequest.documentNumber}`,
    });

    await miv.save({ session });
    return miv;
  }
}
