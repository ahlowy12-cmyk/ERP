import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DepartmentModelName } from './entities/department.model';
import { UserModelName } from '../users/entities/user.model';
import { AuditLogService } from 'src/shared/audit-logs/audit-logs.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(DepartmentModelName) private departmentModel: Model<any>,
    @InjectModel(UserModelName) private userModel: Model<any>,
    private auditLogService: AuditLogService,
  ) {}

  // TASK 3: findAll مع usersCount لكل قسم
  async findAll() {
    const departments = await this.departmentModel
      .find()
      .populate({
        path: 'managerId',
        model: 'User',
        select: 'fullName username',
      })
      .populate({
        path: 'parentId',
        model: 'Department',
        select: 'code nameEn',
      })
      .lean()
      .exec();

    // تجميع عدد المستخدمين لكل قسم باستخدام aggregation واحدة
    const counts: { _id: string; count: number }[] =
      await this.userModel.aggregate([
        { $match: { status: { $ne: 'Inactive' } } },
        {
          $group: {
            _id: '$departmentId',
            count: { $sum: 1 },
          },
        },
      ]);
    const countMap = Object.fromEntries(
      counts.map((c) => [c._id?.toString(), c.count]),
    );

    return departments.map((dept: any) => ({
      ...dept,
      usersCount: countMap[dept._id?.toString()] ?? 0,
    }));
  }

  async findOne(id: string) {
    const dept = await this.departmentModel
      .findById(id)
      .populate({
        path: 'managerId',
        model: 'User',
        select: 'fullName username email',
      })
      .populate({
        path: 'parentId',
        model: 'Department',
        select: 'code nameEn nameAr',
      })
      .lean()
      .exec();
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(dto: CreateDepartmentDto, createdBy: string) {
    const exists = await this.departmentModel.findOne({ code: dto.code });
    if (exists)
      throw new ConflictException(
        `Department code "${dto.code}" already exists`,
      );

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
    const dept = await this.departmentModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...dto,
            parentId: dto.parentId
              ? new Types.ObjectId(dto.parentId)
              : undefined,
            managerId: dto.managerId
              ? new Types.ObjectId(dto.managerId)
              : undefined,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

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

  // TASK 7: منع حذف قسم فيه موظفون نشطون
  async remove(id: string, deletedBy: string) {
    const dept = await this.departmentModel.findById(id).lean().exec();
    if (!dept) throw new NotFoundException('Department not found');

    const usersCount = await this.userModel.countDocuments({
      departmentId: new Types.ObjectId(id),
      status: { $ne: 'Inactive' },
    });

    if (usersCount > 0) {
      throw new BadRequestException({
        message:
          'Cannot delete department with active users. Reassign users first.',
        data: { usersCount },
      });
    }

    await this.departmentModel.findByIdAndDelete(id);

    await this.auditLogService.log({
      userId: deletedBy,
      action: 'DELETE_DEPARTMENT',
      entity: 'Department',
      entityId: id,
      details: `Deleted department: ${dept.code}`,
    });

    return { message: 'Department deleted successfully' };
  }
}

