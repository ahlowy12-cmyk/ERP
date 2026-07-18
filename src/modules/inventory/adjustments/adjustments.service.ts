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
import { AdjustmentsRepository } from './adjustments.repository';
import { StockAdjustmentModelName, StockAdjustmentDocument } from './entities/adjustment.model';

@Injectable()
export class AdjustmentsService {
  constructor(
    @InjectModel(StockAdjustmentModelName) private readonly adjustmentModel: Model<StockAdjustmentDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly numberingService: NumberingService,
    private readonly inventoryEngineService: InventoryEngineService,
    private readonly auditLogService: AuditLogService,
    private readonly _AdjustmentsRepository: AdjustmentsRepository,
  ) {}

  async create(createDto: any, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const adjNumber = await this.numberingService.generateADJNumber(session);

      const adjustment = new this.adjustmentModel({
        ...createDto,
        adjNumber,
        status: 'Draft',
        createdBy: userId,
      });

      await adjustment.save({ session });

      await this.auditLogService.log({
        userId,
        action: 'CREATE',
        entity: 'Adjustment',
        entityId: adjustment._id,
        details: `Created Adjustment ${adjNumber}`,
      });

      await session.commitTransaction();
      return { message: 'Adjustment created successfully', data: adjustment };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(query?: any) {
    return this.adjustmentModel.find(query || {}).populate('warehouseId').exec();
  }

  async findOne(id: string) {
    const adjustment = await this.adjustmentModel
      .findById(id)
      .populate('warehouseId items.itemId');
    if (!adjustment) throw new NotFoundException('Adjustment not found');
    return { data: adjustment };
  }

  async approve(id: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const adjustment = await this.adjustmentModel
        .findById(id)
        .session(session);
      if (!adjustment) throw new NotFoundException('Adjustment not found');
      if (adjustment.status !== 'Draft')
        throw new BadRequestException('Only Draft Adjustments can be approved');

      adjustment.status = 'Approved';
      adjustment.approvedBy = userId;
      adjustment.approvedAt = new Date();
      await adjustment.save({ session });

      // محرك المخزون: يعالج الزيادة (Addition) والنقص (Deduction) بناءً على نوع الحركة لكل صنف
      await this.inventoryEngineService.processAdjustment(adjustment, session);

      await this.auditLogService.log({
        userId,
        action: 'APPROVE',
        entity: 'Adjustment',
        entityId: adjustment._id,
        details: `Approved Adjustment ${adjustment.adjNumber}`,
      });

      await session.commitTransaction();
      return {
        message: 'Adjustment approved successfully and inventory synchronized',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(id: string, dto: any, userId: string) {
    return this._AdjustmentsRepository.findOneAndUpdate(
      { _id: id },
      { $set: dto },
    );
  }

  async remove(id: string, userId: string) {
    return this._AdjustmentsRepository.softDelete({ _id: id });
  }
}
