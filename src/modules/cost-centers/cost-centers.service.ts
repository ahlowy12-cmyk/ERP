import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CostCenterModelName } from './entities/cost-center.model';

@Injectable()
export class CostCentersService {
  constructor(
    @InjectModel(CostCenterModelName) private ccModel: Model<any>,
  ) {}

  async findAll(query: { type?: string; isActive?: string; page?: number; limit?: number }) {
    const { type, isActive, page = 1, limit = 50 } = query;
    const filter: any = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [items, totalItems] = await Promise.all([
      this.ccModel.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)).lean().exec(),
      this.ccModel.countDocuments(filter),
    ]);

    return { items, totalItems, currentPage: Number(page), totalPages: Math.ceil(totalItems / Number(limit)) };
  }

  async findOne(id: string) {
    const cc = await this.ccModel.findById(id).lean().exec();
    if (!cc) throw new NotFoundException('Cost center not found');
    return cc;
  }

  async findByCode(code: string) {
    return this.ccModel.findOne({ code }).lean().exec();
  }

  async create(dto: any, userId: string) {
    const exists = await this.ccModel.findOne({ code: dto.code });
    if (exists) throw new ConflictException(`Cost center code "${dto.code}" already exists`);
    return this.ccModel.create({ ...dto, createdBy: userId });
  }

  async update(id: string, dto: any) {
    const cc = await this.ccModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean().exec();
    if (!cc) throw new NotFoundException('Cost center not found');
    return cc;
  }

  // Internal: used by Contract Auto-Engine
  async createInternal(data: {
    code: string;
    name: string;
    type: string;
    parentCode?: string;
    contractId?: string;
    contractNumber?: string;
    projectCode?: string;
    createdBy?: string;
  }) {
    return this.ccModel.create({ ...data, isActive: true });
  }
}
