import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { NumberingService } from 'src/shared/services/numbering.service';
import { InventoryEngineService } from 'src/shared/services/inventory-engine.service';
import { AuditLogService } from 'src/shared/audit-logs/audit-logs.service';
import { TransfersRepository } from './transfers.repository';

@Injectable()
export class TransfersService {
  constructor(
    @InjectModel('Transfer') private readonly transferModel: Model<any>,
    @InjectConnection() private readonly connection: Connection,
    private readonly numberingService: NumberingService,
    private readonly inventoryEngineService: InventoryEngineService,
    private readonly auditLogService: AuditLogService,
    private readonly _Repository: TransfersRepository,
  ) {}

  async create(createDto: any, userId: string) {
    if (createDto.fromWarehouseId === createDto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouses cannot be the same',
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const trnNumber = await this.numberingService.generateTRNNumber(session);

      const transfer = new this.transferModel({
        ...createDto,
        trnNumber,
        status: 'Draft',
        createdBy: userId,
      });

      await transfer.save({ session });

      await this.auditLogService.log({
        userId,
        action: 'CREATE',
        entity: 'Transfer',
        entityId: transfer._id,
        details: `Created Transfer ${trnNumber}`,
      });

      await session.commitTransaction();
      return { message: 'Transfer created successfully', data: transfer };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(query?: any) {
    return this.transferModel
      .find(query || {})
      .populate('fromWarehouseId toWarehouseId')
      .exec();
  }

  async findOne(id: string) {
    const transfer = await this.transferModel
      .findById(id)
      .populate('fromWarehouseId toWarehouseId items.itemId');
    if (!transfer) throw new NotFoundException('Transfer not found');
    return { data: transfer };
  }

  async approve(id: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const transfer = await this.transferModel.findById(id).session(session);
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'Draft')
        throw new BadRequestException('Only Draft Transfers can be approved');

      transfer.status = 'Approved';
      transfer.approvedBy = userId;
      transfer.approvedAt = new Date();
      await transfer.save({ session });

      // محرك المخزون: يخصم من المستودع الأول ويضيف للمستودع الثاني
      await this.inventoryEngineService.processTransfer(transfer, session);

      await this.auditLogService.log({
        userId,
        action: 'APPROVE',
        entity: 'Transfer',
        entityId: transfer._id,
        details: `Approved Transfer ${transfer.trnNumber}`,
      });

      await session.commitTransaction();
      return { message: 'Transfer approved successfully' };
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
}
