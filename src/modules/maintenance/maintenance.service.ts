import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PMScheduleModelName, WorkOrderModelName } from './entities/maintenance.model';
import { EquipmentModelName } from '../assets/equipment/entities/equipment.model';
import { AssetHistoryModelName } from '../assets/entities/assets.model';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectModel(EquipmentModelName)    private equipmentModel: Model<any>,
    @InjectModel(PMScheduleModelName)   private pmModel:        Model<any>,
    @InjectModel(WorkOrderModelName)    private woModel:        Model<any>,
    @InjectModel(AssetHistoryModelName) private historyModel:   Model<any>,
  ) {}

  // ─── Internal: WO Number Generator ────────────────────────────────────────
  private async nextWONumber(type: 'Preventive' | 'Breakdown' | 'Calibration'): Promise<string> {
    const prefix = type === 'Preventive' ? 'WO-PM'
                 : type === 'Breakdown'  ? 'WO-BD'
                 : 'WO-CAL';
    const year = new Date().getFullYear();
    const fullPrefix = `${prefix}-${year}-`;
    const MAX_RETRIES = 5;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const last = await this.woModel
        .findOne({ woNumber: { $regex: `^${fullPrefix}` } })
        .sort({ woNumber: -1 })
        .lean();

      const lastSeq = last
        ? parseInt(String((last as any).woNumber).split('-').pop() ?? '0', 10)
        : 0;
      const candidate = `${fullPrefix}${String(lastSeq + 1).padStart(4, '0')}`;

      const existing = await this.woModel.findOne({ woNumber: candidate }).lean();
      if (!existing) return candidate;

      this.logger.warn(`WO number collision: ${candidate} (attempt ${attempt})`);
    }
    return `${fullPrefix}${Date.now().toString().slice(-4)}`;
  }

  // ─── Internal: Log history ─────────────────────────────────────────────
  private async logHistory(data: {
    assetId: string | Types.ObjectId;
    equipmentCode: string;
    oldValue: string;
    newValue: string;
    changedBy: string;
    notes?: string;
  }) {
    await this.historyModel.create({
      assetId: new Types.ObjectId(String(data.assetId)),
      equipmentCode: data.equipmentCode,
      changeType: 'Maintenance',
      oldValue: data.oldValue,
      newValue: data.newValue,
      changedBy: data.changedBy,
      notes: data.notes ?? null,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PM SCHEDULES
  // ══════════════════════════════════════════════════════════════════════════

  async listPMSchedules(query: {
    assetId?: string;
    status?: string;
    dueBefore?: string;
  }) {
    const filter: any = {};
    if (query.assetId)   filter.assetId = new Types.ObjectId(query.assetId);
    if (query.status)    filter.status  = query.status;
    if (query.dueBefore) filter.nextDueDate = { $lte: new Date(query.dueBefore) };

    const data = await this.pmModel.find(filter).sort({ nextDueDate: 1 }).lean();
    return { data };
  }

  async createPMSchedule(dto: {
    assetId: string;
    pmCode: string;
    taskDescription: string;
    frequencyDays: number;
    nextDueDate: string;
    status?: string;
  }, userId: string) {
    const eq = await this.equipmentModel.findById(dto.assetId).lean();
    if (!eq) throw new NotFoundException(`Equipment "${dto.assetId}" not found`);

    const existing = await this.pmModel.findOne({ pmCode: dto.pmCode }).lean();
    if (existing) throw new BadRequestException(`PM Schedule code "${dto.pmCode}" already exists`);

    const pm = await this.pmModel.create({
      assetId: new Types.ObjectId(dto.assetId),
      assetNumber: (eq as any).assetNumber,
      equipmentName: (eq as any).equipmentName,
      pmCode: dto.pmCode,
      taskDescription: dto.taskDescription,
      frequencyDays: dto.frequencyDays,
      nextDueDate: new Date(dto.nextDueDate),
      status: dto.status ?? 'Active',
      createdBy: new Types.ObjectId(userId),
    });

    return { message: 'PM Schedule created successfully', data: pm };
  }

  async updatePMSchedule(id: string, dto: {
    status?: string;
    frequencyDays?: number;
    nextDueDate?: string;
    taskDescription?: string;
  }) {
    const pm = await this.pmModel.findById(id);
    if (!pm) throw new NotFoundException(`PM Schedule "${id}" not found`);

    if (dto.status)          pm.status          = dto.status;
    if (dto.frequencyDays)   pm.frequencyDays   = dto.frequencyDays;
    if (dto.nextDueDate)     pm.nextDueDate      = new Date(dto.nextDueDate);
    if (dto.taskDescription) pm.taskDescription  = dto.taskDescription;

    await pm.save();
    return { message: 'PM Schedule updated', data: pm };
  }

  async triggerPM(id: string, dto: { assignedToTechnician?: string }, userId: string) {
    const pm = await this.pmModel.findById(id);
    if (!pm) throw new NotFoundException(`PM Schedule "${id}" not found`);
    if (pm.status === 'Paused') throw new BadRequestException('PM Schedule is paused');

    const eq = await this.equipmentModel.findById(pm.assetId).lean();
    if (!eq) throw new NotFoundException('Equipment not found for this PM');

    const woNumber = await this.nextWONumber('Preventive');
    const today = new Date();

    // 1. Create Work Order
    const wo = await this.woModel.create({
      woNumber,
      assetId: pm.assetId,
      assetNumber: (eq as any).assetNumber,
      equipmentName: (eq as any).equipmentName,
      type: 'Preventive',
      priority: 'Medium',
      issueDescription: `Scheduled PM: ${pm.taskDescription}`,
      assignedToTechnician: dto.assignedToTechnician ?? null,
      pmScheduleId: pm._id,
      createdDate: today,
      status: 'Open',
      createdBy: new Types.ObjectId(userId),
    });

    // 2. Update PM schedule dates
    pm.lastDoneDate = today;
    pm.nextDueDate  = new Date(today.getTime() + pm.frequencyDays * 24 * 60 * 60 * 1000);
    await pm.save();

    // 3. Set equipment to Maintenance
    const oldStatus = (eq as any).status;
    await this.equipmentModel.findByIdAndUpdate(pm.assetId, {
      $set: { status: 'Maintenance', lastMaintenanceDate: today, nextMaintenanceDate: pm.nextDueDate },
    });

    // 4. Log history
    await this.logHistory({
      assetId: String(pm.assetId),
      equipmentCode: (eq as any).equipmentCode,
      oldValue: oldStatus,
      newValue: 'Maintenance',
      changedBy: 'PM System',
      notes: `PM triggered: ${pm.pmCode}. WO: ${woNumber}`,
    });

    this.logger.log(`✅ PM triggered for ${(eq as any).equipmentCode}: WO ${woNumber}`);
    return {
      message: 'PM Work Order created successfully',
      workOrder: wo,
      updatedSchedule: pm,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WORK ORDERS
  // ══════════════════════════════════════════════════════════════════════════

  async listWorkOrders(query: {
    status?: string;
    type?: string;
    priority?: string;
    assetId?: string;
  }) {
    const filter: any = {};
    if (query.status)   filter.status   = query.status;
    if (query.type)     filter.type     = query.type;
    if (query.priority) filter.priority = query.priority;
    if (query.assetId)  filter.assetId  = new Types.ObjectId(query.assetId);

    const data = await this.woModel.find(filter).sort({ createdDate: -1 }).lean();
    return { data };
  }

  async createWorkOrder(dto: {
    assetId: string;
    type: string;
    priority?: string;
    issueDescription: string;
    assignedToTechnician?: string;
  }, userId: string) {
    const eq = await this.equipmentModel.findById(dto.assetId).lean();
    if (!eq) throw new NotFoundException(`Equipment "${dto.assetId}" not found`);

    const type = dto.type as 'Preventive' | 'Breakdown' | 'Calibration';
    const woNumber = await this.nextWONumber(type);

    const wo = await this.woModel.create({
      woNumber,
      assetId: new Types.ObjectId(dto.assetId),
      assetNumber: (eq as any).assetNumber,
      equipmentName: (eq as any).equipmentName,
      type,
      priority: dto.priority ?? 'Medium',
      issueDescription: dto.issueDescription,
      assignedToTechnician: dto.assignedToTechnician ?? null,
      createdDate: new Date(),
      status: 'Open',
      createdBy: new Types.ObjectId(userId),
    });

    // Auto-set Maintenance status for Breakdown or Emergency
    if (type === 'Breakdown' || dto.priority === 'Emergency') {
      await this.equipmentModel.findByIdAndUpdate(dto.assetId, {
        $set: { status: 'Maintenance' },
      });
    }

    this.logger.log(`✅ Work Order ${woNumber} created for ${(eq as any).equipmentCode}`);
    return { message: 'Work Order created successfully', data: wo };
  }

  async updateWorkOrderStatus(id: string, dto: {
    status: string;
    sparePartsUsed?: { itemCode: string; itemName: string; quantity: number; unitPrice: number }[];
    laborHoursCost?: number;
  }, userId: string) {
    const wo = await this.woModel.findById(id);
    if (!wo) throw new NotFoundException(`Work Order "${id}" not found`);

    const allowedTransitions: Record<string, string[]> = {
      Open:        ['In Progress', 'Cancelled'],
      'In Progress': ['Completed', 'Cancelled'],
    };

    const allowed = allowedTransitions[wo.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition Work Order from "${wo.status}" to "${dto.status}"`,
      );
    }

    const today = new Date();

    if (dto.status === 'In Progress') {
      wo.startDate = today;
    }

    if (dto.status === 'Completed') {
      wo.completedDate = today;
      if (dto.sparePartsUsed) wo.sparePartsUsed = dto.sparePartsUsed;
      if (dto.laborHoursCost !== undefined) wo.laborHoursCost = dto.laborHoursCost;

      // Restore equipment to Active
      await this.equipmentModel.findByIdAndUpdate(wo.assetId, {
        $set: { status: 'Active', lastMaintenanceDate: today },
      });
    }

    wo.status = dto.status;
    await wo.save();

    this.logger.log(`✅ Work Order ${wo.woNumber} → ${dto.status}`);
    return { message: 'Work Order status updated', data: wo };
  }
}
