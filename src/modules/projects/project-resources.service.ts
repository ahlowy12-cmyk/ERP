import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EquipmentAssignmentModelName } from './equipment-assignments/entities/equipment-assignment.model';
import { MaterialConsumptionModelName } from './material-consumptions/entities/material-consumption.model';
import { LaborRecordModelName } from './labor-records/entities/labor-record.model';
import { EquipmentTransferModelName } from './equipment-transfers/entities/equipment-transfer.model';
import { ProjectModelName } from './entities/project.model';
import { EquipmentModelName } from '../assets/equipment/entities/equipment.model';

@Injectable()
export class ProjectResourcesService {
  private readonly logger = new Logger(ProjectResourcesService.name);

  constructor(
    @InjectModel(ProjectModelName) private projectModel: Model<any>,
    @InjectModel(EquipmentModelName) private equipmentModel: Model<any>,
    @InjectModel(EquipmentAssignmentModelName) private eqAssignModel: Model<any>,
    @InjectModel(MaterialConsumptionModelName) private matConsModel: Model<any>,
    @InjectModel(LaborRecordModelName) private laborModel: Model<any>,
    @InjectModel(EquipmentTransferModelName) private transferModel: Model<any>,
  ) {}

  // ─── Helper: resolve project by code ──────────────────────────────────────
  private async resolveProject(code: string) {
    const project = await this.projectModel.findOne({ code: code.toUpperCase() }).lean();
    if (!project) throw new NotFoundException(`Project "${code}" not found`);
    return project;
  }

  // ─── Helper: add to project consumed value ─────────────────────────────────
  private async addConsumedValue(projectId: string, amount: number) {
    await this.projectModel.findByIdAndUpdate(projectId, {
      $inc: { consumedValue: amount },
    });
    const proj = await this.projectModel.findById(projectId);
    if (proj) {
      proj.remainingValue = proj.budgetValue - proj.consumedValue;
      proj.progressPercent = proj.budgetValue > 0
        ? Math.min(100, Math.round((proj.consumedValue / proj.budgetValue) * 100))
        : 0;
      await proj.save();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. EQUIPMENT ASSIGNMENTS
  // ══════════════════════════════════════════════════════════════════════════
  async getEquipmentAssignments(projectCode: string) {
    const project = await this.resolveProject(projectCode);
    return this.eqAssignModel.find({ projectId: project._id }).sort({ createdAt: -1 }).lean();
  }

  async createEquipmentAssignment(projectCode: string, dto: any, userId: string) {
    const project = await this.resolveProject(projectCode);

    // Fetch equipment details
    const eq = await this.equipmentModel.findById(dto.equipmentId).lean();
    if (!eq) throw new NotFoundException(`Equipment "${dto.equipmentId}" not found`);

    const record = await this.eqAssignModel.create({
      projectId: project._id,
      projectCode: project.code,
      costCenterCode: project.costCenterCode,
      equipmentId: new Types.ObjectId(dto.equipmentId),
      equipmentName: (eq as any).equipmentName,
      equipmentCode: (eq as any).equipmentCode,
      serialNumber: (eq as any).serialNumber,
      siteName: dto.siteName || project.siteName || '',
      assignedDate: new Date(dto.assignedDate),
      status: 'Assigned',
      dailyRate: dto.dailyRate || 0,
      createdBy: new Types.ObjectId(userId),
    });

    // Update equipment status
    await this.equipmentModel.findByIdAndUpdate(dto.equipmentId, {
      $set: {
        status: 'Active',
        projectAssignment: project.code,
        projectId: project._id,
        location: dto.siteName || project.siteName,
      },
    });

    this.logger.log(`Equipment ${(eq as any).equipmentCode} assigned to ${project.code}`);
    return record;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MATERIAL CONSUMPTIONS
  // ══════════════════════════════════════════════════════════════════════════
  async getMaterialConsumptions(projectCode: string) {
    const project = await this.resolveProject(projectCode);
    return this.matConsModel.find({ projectId: project._id }).sort({ issueDate: -1 }).lean();
  }

  async createMaterialConsumption(projectCode: string, dto: any, userId: string) {
    const project = await this.resolveProject(projectCode);

    const cost = +(dto.consumedQuantity * (dto.unitPrice || 0)).toFixed(2);

    const record = await this.matConsModel.create({
      projectId: project._id,
      projectCode: project.code,
      costCenterCode: project.costCenterCode,
      materialCode: dto.materialCode,
      materialName: dto.materialName || dto.materialCode,
      warehouse: dto.warehouse || '',
      issuedQuantity: dto.issuedQuantity,
      consumedQuantity: dto.consumedQuantity,
      unit: dto.unit || 'unit',
      unitPrice: dto.unitPrice || 0,
      cost,
      docRef: dto.docRef || null,
      issueDate: new Date(dto.issueDate),
      notes: dto.notes || null,
      createdBy: new Types.ObjectId(userId),
    });

    // ⚡ Update project consumed value
    if (cost > 0) await this.addConsumedValue(String(project._id), cost);

    this.logger.log(`Material consumption ${dto.materialCode} → ${project.code}, cost: ${cost}`);
    return record;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. LABOR RECORDS
  // ══════════════════════════════════════════════════════════════════════════
  async getLaborRecords(projectCode: string) {
    const project = await this.resolveProject(projectCode);
    return this.laborModel.find({ projectId: project._id }).sort({ date: -1 }).lean();
  }

  async createLaborRecord(projectCode: string, dto: any, userId: string) {
    const project = await this.resolveProject(projectCode);

    const totalCost = +((dto.regularHours * dto.hourlyRate) + (dto.overtimeHours * dto.overtimeRate)).toFixed(2);

    const record = await this.laborModel.create({
      projectId: project._id,
      projectCode: project.code,
      costCenterCode: project.costCenterCode,
      employeeId: dto.employeeId ? new Types.ObjectId(dto.employeeId) : null,
      employeeName: dto.employeeName,
      role: dto.role || '',
      date: new Date(dto.date),
      regularHours: dto.regularHours,
      overtimeHours: dto.overtimeHours || 0,
      hourlyRate: dto.hourlyRate,
      overtimeRate: dto.overtimeRate || 0,
      totalCost,
      notes: dto.notes || null,
      createdBy: new Types.ObjectId(userId),
    });

    // ⚡ Update project consumed value
    if (totalCost > 0) await this.addConsumedValue(String(project._id), totalCost);

    this.logger.log(`Labor ${dto.employeeName} → ${project.code}, cost: ${totalCost}`);
    return record;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. EQUIPMENT TRANSFERS
  // ══════════════════════════════════════════════════════════════════════════
  async getEquipmentTransfers(projectCode: string) {
    const project = await this.resolveProject(projectCode);
    return this.transferModel.find({ projectId: project._id }).sort({ createdAt: -1 }).lean();
  }

  async createEquipmentTransfer(projectCode: string, dto: any, userId: string) {
    const project = await this.resolveProject(projectCode);

    const eq = dto.equipmentId
      ? await this.equipmentModel.findById(dto.equipmentId).lean()
      : null;

    const record = await this.transferModel.create({
      projectId: project._id,
      projectCode: project.code,
      costCenterCode: project.costCenterCode,
      equipmentId: dto.equipmentId ? new Types.ObjectId(dto.equipmentId) : null,
      equipmentName: eq ? (eq as any).equipmentName : dto.equipmentName || '',
      equipmentCode: eq ? (eq as any).equipmentCode : '',
      fromLocation: dto.fromLocation,
      toLocation: dto.toLocation,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      transportationHours: dto.transportationHours || 0,
      transportationCost: dto.transportationCost || 0,
      reason: dto.reason || null,
      status: 'Pending',
      createdBy: new Types.ObjectId(userId),
    });

    // ⚡ Add transfer cost to project
    const cost = dto.transportationCost || 0;
    if (cost > 0) await this.addConsumedValue(String(project._id), cost);

    return record;
  }

  async updateTransferStatus(id: string, status: string) {
    const transfer = await this.transferModel.findByIdAndUpdate(
      id, { $set: { status, ...(status === 'Completed' ? { endDate: new Date() } : {}) } },
      { new: true },
    ).lean();
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }
}
