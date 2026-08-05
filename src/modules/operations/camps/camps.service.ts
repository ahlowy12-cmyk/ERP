import {
  Injectable, NotFoundException, BadRequestException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CampModelName, CampAllocationModelName } from './entities/camp.model';

@Injectable()
export class CampsService {
  private readonly logger = new Logger(CampsService.name);

  constructor(
    @InjectModel(CampModelName) private campModel: Model<any>,
    @InjectModel(CampAllocationModelName) private allocationModel: Model<any>,
  ) {}

  // ── CAMPS ─────────────────────────────────────────────────────────────────
  async getCamps(query: { projectCode?: string; status?: string }) {
    const filter: any = {};
    if (query.projectCode) filter.projectCode = query.projectCode;
    if (query.status)      filter.status      = query.status;
    return this.campModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async createCamp(dto: any, userId: string) {
    const exists = await this.campModel.findOne({ campCode: dto.campCode });
    if (exists) throw new ConflictException(`Camp code "${dto.campCode}" already exists`);
    const camp = await this.campModel.create({
      ...dto,
      occupiedBeds: 0,
      availableBeds: dto.totalBeds,
      createdBy: new Types.ObjectId(userId),
    });
    this.logger.log(`Camp created: ${camp.campCode}`);
    return camp;
  }

  async getCamp(id: string) {
    const c = await this.campModel.findById(id).lean();
    if (!c) throw new NotFoundException('Camp not found');
    return c;
  }

  // ── ALLOCATIONS ───────────────────────────────────────────────────────────
  async getAllocations(campId?: string, projectCode?: string) {
    const filter: any = {};
    if (campId)      filter.campId      = new Types.ObjectId(campId);
    if (projectCode) filter.projectCode = projectCode;
    return this.allocationModel.find(filter).sort({ checkInDate: -1 }).lean();
  }

  async createAllocation(dto: any, userId: string) {
    const camp = await this.campModel.findById(dto.campId);
    if (!camp) throw new NotFoundException(`Camp "${dto.campId}" not found`);

    if (camp.availableBeds <= 0) {
      throw new BadRequestException(
        `Camp "${camp.campCode}" is full. Total: ${camp.totalBeds}, Occupied: ${camp.occupiedBeds}`,
      );
    }

    const allocation = await this.allocationModel.create({
      campId: new Types.ObjectId(dto.campId),
      campCode: camp.campCode,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      projectCode: dto.projectCode || null,
      occupantName: dto.occupantName,
      employeeId: dto.employeeId || null,
      role: dto.role || '',
      bedNumber: dto.bedNumber || null,
      checkInDate: new Date(dto.checkInDate),
      status: 'Active',
      notes: dto.notes || null,
      createdBy: new Types.ObjectId(userId),
    });

    // ⚡ Update bed counts atomically
    await this.campModel.findByIdAndUpdate(dto.campId, {
      $inc: { occupiedBeds: 1, availableBeds: -1 },
    });

    this.logger.log(`Allocation: ${dto.occupantName} → ${camp.campCode}`);
    return allocation;
  }

  async releaseAllocation(id: string) {
    const alloc = await this.allocationModel.findById(id);
    if (!alloc) throw new NotFoundException('Allocation not found');
    if (alloc.status === 'Released') throw new BadRequestException('Already released');

    await this.allocationModel.findByIdAndUpdate(id, {
      $set: { status: 'Released', checkOutDate: new Date() },
    });

    // ⚡ Update bed counts atomically
    await this.campModel.findByIdAndUpdate(alloc.campId, {
      $inc: { occupiedBeds: -1, availableBeds: 1 },
    });

    this.logger.log(`Allocation released: ${alloc.occupantName} from camp ${alloc.campCode}`);
    return { message: 'Allocation released successfully' };
  }
}
