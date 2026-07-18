import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RoleModelName } from './entities/role.model';
import { PermissionModelName } from './entities/permission.model';
import { AuditLogService } from 'src/shared/audit-logs/audit-logs.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectModel(RoleModelName) private roleModel: Model<any>,
    @InjectModel(PermissionModelName) private permissionModel: Model<any>,
    private auditLogService: AuditLogService,
  ) {}

  // ─── Get All Roles ────────────────────────────────────────────────────────
  async findAll() {
    return this.roleModel
      .find()
      .populate({ path: 'permissions', model: PermissionModelName, select: 'name description module' })
      .lean()
      .exec();
  }

  // ─── Get One Role ─────────────────────────────────────────────────────────
  async findOne(id: string) {
    const role = await this.roleModel
      .findById(id)
      .populate({ path: 'permissions', model: PermissionModelName })
      .lean()
      .exec();
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // ─── Create Role ──────────────────────────────────────────────────────────
  async create(dto: CreateRoleDto, createdBy: string) {
    const exists = await this.roleModel.findOne({ name: dto.name });
    if (exists) throw new ConflictException(`Role "${dto.name}" already exists`);

    const permIds = dto.permissions?.map((p) => new Types.ObjectId(p)) || [];
    const role = await this.roleModel.create({ ...dto, permissions: permIds });

    await this.auditLogService.log({
      userId: createdBy,
      action: 'CREATE_ROLE',
      entity: 'Role',
      entityId: role._id.toString(),
      details: `Created role: ${dto.name}`,
    });

    return role;
  }

  // ─── Update Role Permissions ───────────────────────────────────────────────
  async update(id: string, dto: UpdateRoleDto, updatedBy: string) {
    const role = await this.roleModel.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem && dto.permissions !== undefined) {
      // السماح بتحديث الوصف فقط للأدوار النظامية
    }

    const updateData: any = {};
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.permissions !== undefined) {
      updateData.permissions = dto.permissions.map((p) => new Types.ObjectId(p));
    }

    const updated = await this.roleModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate({ path: 'permissions', model: PermissionModelName })
      .lean()
      .exec();

    await this.auditLogService.log({
      userId: updatedBy,
      action: 'UPDATE_ROLE',
      entity: 'Role',
      entityId: id,
      details: `Updated role permissions`,
    });

    return updated;
  }

  // ─── Delete Role ──────────────────────────────────────────────────────────
  async remove(id: string, deletedBy: string) {
    const role = await this.roleModel.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ForbiddenException('Cannot delete a system role');

    await this.roleModel.deleteOne({ _id: id });

    await this.auditLogService.log({
      userId: deletedBy,
      action: 'DELETE_ROLE',
      entity: 'Role',
      entityId: id,
      details: `Deleted role: ${role.name}`,
    });

    return { message: 'Role deleted successfully' };
  }

  // ─── Get All Permissions ──────────────────────────────────────────────────
  async getAllPermissions() {
    return this.permissionModel.find().sort({ module: 1, name: 1 }).lean().exec();
  }
}
