import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FuelTankModelName, FuelReceiptModelName, FuelIssueModelName,
} from './entities/fuel.model';

@Injectable()
export class FuelService {
  private readonly logger = new Logger(FuelService.name);

  constructor(
    @InjectModel(FuelTankModelName) private tankModel: Model<any>,
    @InjectModel(FuelReceiptModelName) private receiptModel: Model<any>,
    @InjectModel(FuelIssueModelName) private issueModel: Model<any>,
  ) {}

  // ── TANKS ─────────────────────────────────────────────────────────────────
  async getTanks(query: { projectCode?: string; fuelType?: string; status?: string }) {
    const filter: any = {};
    if (query.projectCode) filter.projectCode = query.projectCode;
    if (query.fuelType)    filter.fuelType    = query.fuelType;
    if (query.status)      filter.status      = query.status;
    return this.tankModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async createTank(dto: any, userId: string) {
    const tank = await this.tankModel.create({
      ...dto,
      currentLevelLiters: dto.currentLevelLiters ?? 0,
      createdBy: new Types.ObjectId(userId),
    });
    this.logger.log(`Fuel tank created: ${tank.tankCode}`);
    return tank;
  }

  async getTank(id: string) {
    const t = await this.tankModel.findById(id).lean();
    if (!t) throw new NotFoundException('Fuel tank not found');
    return t;
  }

  // ── RECEIPTS (Add fuel to tank) ───────────────────────────────────────────
  async createReceipt(dto: any, userId: string) {
    const tank = await this.tankModel.findById(dto.tankId);
    if (!tank) throw new NotFoundException(`Tank "${dto.tankId}" not found`);

    const newLevel = tank.currentLevelLiters + dto.quantityLiters;
    if (newLevel > tank.capacityLiters) {
      throw new BadRequestException(
        `Receipt of ${dto.quantityLiters}L would exceed tank capacity of ${tank.capacityLiters}L. ` +
        `Current level: ${tank.currentLevelLiters}L, Available: ${tank.capacityLiters - tank.currentLevelLiters}L`,
      );
    }

    const totalCost = +(dto.quantityLiters * (dto.unitCost || 0)).toFixed(2);

    const receipt = await this.receiptModel.create({
      tankId: new Types.ObjectId(dto.tankId),
      tankCode: tank.tankCode,
      quantityLiters: dto.quantityLiters,
      unitCost: dto.unitCost || 0,
      totalCost,
      supplierName: dto.supplierName || '',
      deliveryDate: new Date(dto.deliveryDate),
      receivedBy: dto.receivedBy || '',
      invoiceNumber: dto.invoiceNumber || null,
      notes: dto.notes || null,
      createdBy: new Types.ObjectId(userId),
    });

    // ⚡ Update tank level and unit cost
    await this.tankModel.findByIdAndUpdate(dto.tankId, {
      $set: {
        currentLevelLiters: newLevel,
        lastRefillDate: new Date(dto.deliveryDate),
        unitCost: dto.unitCost || tank.unitCost,
      },
    });

    this.logger.log(`Fuel receipt: +${dto.quantityLiters}L → ${tank.tankCode} (now ${newLevel}L)`);
    return receipt;
  }

  async getReceipts(tankId?: string) {
    const filter: any = {};
    if (tankId) filter.tankId = new Types.ObjectId(tankId);
    return this.receiptModel.find(filter).sort({ deliveryDate: -1 }).lean();
  }

  // ── ISSUES (Dispense fuel from tank) ─────────────────────────────────────
  async createIssue(dto: any, userId: string) {
    const tank = await this.tankModel.findById(dto.tankId);
    if (!tank) throw new NotFoundException(`Tank "${dto.tankId}" not found`);

    // ⚡ Tank Level Constraint
    if (dto.quantityLiters > tank.currentLevelLiters) {
      throw new BadRequestException(
        `Insufficient fuel. Requested: ${dto.quantityLiters}L, ` +
        `Available: ${tank.currentLevelLiters}L in tank "${tank.tankCode}"`,
      );
    }

    const newLevel = +(tank.currentLevelLiters - dto.quantityLiters).toFixed(2);
    const unitCost  = tank.unitCost || 0;
    const totalCost = +(dto.quantityLiters * unitCost).toFixed(2);

    const issue = await this.issueModel.create({
      tankId: new Types.ObjectId(dto.tankId),
      tankCode: tank.tankCode,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      projectCode: dto.projectCode || null,
      costCenterCode: dto.costCenterCode || null,
      quantityLiters: dto.quantityLiters,
      issuedTo: dto.issuedTo || '',
      issuedToId: dto.issuedToId || null,
      issuedToName: dto.issuedToName || '',
      issueDate: new Date(dto.issueDate),
      issuedBy: dto.issuedBy || '',
      runningHours: dto.runningHours ?? null,
      unitCost,
      totalCost,
      notes: dto.notes || null,
      createdBy: new Types.ObjectId(userId),
    });

    // ⚡ Atomic deduction from tank
    await this.tankModel.findByIdAndUpdate(dto.tankId, {
      $set: { currentLevelLiters: newLevel },
    });

    this.logger.log(`Fuel issued: ${dto.quantityLiters}L from ${tank.tankCode} → ${dto.issuedToName} (${newLevel}L remaining)`);
    return issue;
  }

  async getIssues(query: { tankId?: string; projectCode?: string; costCenterCode?: string }) {
    const filter: any = {};
    if (query.tankId)         filter.tankId         = new Types.ObjectId(query.tankId);
    if (query.projectCode)    filter.projectCode    = query.projectCode;
    if (query.costCenterCode) filter.costCenterCode = query.costCenterCode;
    return this.issueModel.find(filter).sort({ issueDate: -1 }).lean();
  }
}
