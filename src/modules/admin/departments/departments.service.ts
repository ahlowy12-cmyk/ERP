import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DepartmentModelName } from './entities/department.model';
import { AuditLogService } from 'src/shared/audit-logs/audit-logs.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(DepartmentModelName) private departmentModel: Model<any>,
    private auditLogService: AuditLogService,
  ) {}

  async findAll() {
    return this.departmentModel
      .find()
      .populate({ path: 'managerId', model: 'User', select: 'fullName username' })
      .populate({ path: 'parentId', model: 'Department', select: 'code nameEn' })
      .lean()
      .exec();
  }

  async findOne(id: string) {
    const dept = await this.departmentModel
      .findById(id)
      .populate({ path: 'managerId', model: 'User', select: 'fullName username email' })
      .populate({ path: 'parentId', model: 'Department', select: 'code nameEn nameAr' })
      .lean()
      .exec();
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(dto: CreateDepartmentDto, createdBy: string) {
    const exists = await this.departmentModel.findOne({ code: dto.code });
    if (exists) throw new ConflictException(`Department code "${dto.code}" already exists`);

    const dept = await this.departmentModel.create({
      ...dto,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : undefined,
      managerId: dto.managerId ? new Types.ObjectId(dto.managerId) : undefined,
    });

    await this.auditLogService.log({
      userId: createdBy,
      action: 'CREATE_DEPARTMENT',
      entity: 'Department',
      entityId: dept._id.toString(),
      details: `Created department: ${dto.code} - ${dto.nameEn}`,
    });

    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, updatedBy: string) {
    const dept = await this.departmentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...dto,
          parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : undefined,
          managerId: dto.managerId ? new Types.ObjectId(dto.managerId) : undefined,
        },
      },
      { new: true },
    ).lean().exec();

    if (!dept) throw new NotFoundException('Department not found');

    await this.auditLogService.log({
      userId: updatedBy,
      action: 'UPDATE_DEPARTMENT',
      entity: 'Department',
      entityId: id,
      details: `Updated department`,
    });

    return dept;
  }

  async remove(id: string, deletedBy: string) {
    const dept = await this.departmentModel.findByIdAndDelete(id).lean().exec();
    if (!dept) throw new NotFoundException('Department not found');

    await this.auditLogService.log({
      userId: deletedBy,
      action: 'DELETE_DEPARTMENT',
      entity: 'Department',
      entityId: id,
      details: `Deleted department: ${(dept as any).code}`,
    });

    return { message: 'Department deleted successfully' };
  }
}
