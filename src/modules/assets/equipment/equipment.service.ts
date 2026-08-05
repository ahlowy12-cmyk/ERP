import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EquipmentModelName } from './entities/equipment.model';
import {
  CreateEquipmentDto,
  UpdateEquipmentStatusDto,
} from './dto/equipment.dto';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    @InjectModel(EquipmentModelName) private equipmentModel: Model<any>,
  ) {}

  // ─── Get All (with pagination + filters) ──────────────────────────────────
  async findAll(query: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, category, status, page = 1, limit = 20 } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { equipmentCode: { $regex: search, $options: 'i' } },
        { equipmentName: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { assetNumber: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, totalItems] = await Promise.all([
      this.equipmentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()
        .exec(),
      this.equipmentModel.countDocuments(filter),
    ]);

    return {
      items,
      totalItems,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
    };
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, active, standby, maintenance, outOfService] =
      await Promise.all([
        this.equipmentModel.countDocuments(),
        this.equipmentModel.countDocuments({ status: 'Active' }),
        this.equipmentModel.countDocuments({ status: 'Standby' }),
        this.equipmentModel.countDocuments({ status: 'Maintenance' }),
        this.equipmentModel.countDocuments({ status: 'Out Of Service' }),
      ]);

    return { total, active, standby, maintenance, outOfService };
  }

  // ─── Get One ───────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const eq = await this.equipmentModel.findById(id).lean().exec();
    if (!eq) throw new NotFoundException('Equipment not found');
    return eq;
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateEquipmentDto, userId: string) {
    // Check unique fields
    const existing = await this.equipmentModel.findOne({
      $or: [
        { equipmentCode: dto.equipmentCode },
        { serialNumber: dto.serialNumber },
        { assetNumber: dto.assetNumber },
      ],
    });

    if (existing) {
      if (existing.equipmentCode === dto.equipmentCode)
        throw new ConflictException(
          `Equipment code "${dto.equipmentCode}" already exists`,
        );
      if (existing.serialNumber === dto.serialNumber)
        throw new ConflictException(
          `Serial number "${dto.serialNumber}" already exists`,
        );
      if (existing.assetNumber === dto.assetNumber)
        throw new ConflictException(
          `Asset number "${dto.assetNumber}" already exists`,
        );
    }

    const eq = await this.equipmentModel.create({
      ...dto,
      createdBy: userId,
    });

    this.logger.log(`Equipment created: ${eq.equipmentCode} by ${userId}`);
    return eq;
  }

  // ─── Update Status ─────────────────────────────────────────────────────────
  async updateStatus(
    id: string,
    dto: UpdateEquipmentStatusDto,
    userId: string,
  ) {
    const eq = await this.equipmentModel.findById(id);
    if (!eq) throw new NotFoundException('Equipment not found');

    // Guard: cannot deactivate if assigned to active project without releasing
    if (
      dto.status === 'Out Of Service' &&
      eq.projectAssignment &&
      eq.status === 'Active'
    ) {
      throw new BadRequestException(
        'Cannot set to Out Of Service while assigned to an active project. Release from project first.',
      );
    }

    const update: any = { status: dto.status };
    if (dto.location !== undefined) update.location = dto.location;
    if (dto.projectAssignment !== undefined)
      update.projectAssignment = dto.projectAssignment;

    const updated = await this.equipmentModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .lean()
      .exec();

    this.logger.log(
      `Equipment ${eq.equipmentCode} status → ${dto.status} by ${userId}`,
    );
    return updated;
  }

  // ─── Internal: used by Contract Auto-Engine ────────────────────────────────
  async assignToProject(
    equipmentId: string,
    projectCode: string,
    projectId: string,
    siteName: string,
  ) {
    return this.equipmentModel.findByIdAndUpdate(
      equipmentId,
      {
        $set: {
          status: 'Active',
          projectAssignment: projectCode,
          projectId,
          location: siteName || 'Project Site',
        },
      },
      { new: true },
    );
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  async remove(id: string) {
    const eq = await this.equipmentModel.findById(id);
    if (!eq) throw new NotFoundException('Equipment not found');
    if (eq.status === 'Active') {
      throw new BadRequestException(
        'Cannot delete active equipment. Change status first.',
      );
    }
    await this.equipmentModel.findByIdAndDelete(id);
    return { message: 'Equipment deleted successfully' };
  }
}
