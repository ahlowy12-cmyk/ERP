import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

import { UserModelName } from './entities/user.model';
import { RoleModelName } from '../roles/entities/role.model';
import { RefreshTokenModelName } from './entities/refresh-token.model';
import { AuditLogService } from 'src/shared/audit-logs/audit-logs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-user-role.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(UserModelName) private userModel: Model<any>,
    @InjectModel(RoleModelName) private roleModel: Model<any>,
    @InjectModel(RefreshTokenModelName) private refreshTokenModel: Model<any>,
    private mailerService: MailerService,
    private configService: ConfigService,
    private auditLogService: AuditLogService,
  ) {}

  // ─── List Users ────────────────────────────────────────────────────────────
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    departmentId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 20, search, roleId, departmentId, status } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (roleId) filter.roleId = new Types.ObjectId(roleId);
    if (departmentId) filter.departmentId = new Types.ObjectId(departmentId);
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate({ path: 'roleId', model: RoleModelName, select: 'name nameAr' })
        .populate({ path: 'departmentId', model: 'Department', select: 'code nameEn nameAr' })
        .select('-passwordHash -failedLoginAttempts -lockedUntil')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Get One User ──────────────────────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate({ path: 'roleId', model: RoleModelName })
      .populate({ path: 'departmentId', model: 'Department' })
      .select('-passwordHash -failedLoginAttempts -lockedUntil')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── Create User ──────────────────────────────────────────────────────────
  async create(dto: CreateUserDto, createdBy: string) {
    // التحقق من التكرار
    const exists = await this.userModel.findOne({
      $or: [{ username: dto.username }, { email: dto.email }],
    });
    if (exists) throw new ConflictException('Username or email already exists');

    // التحقق من وجود الدور
    const role = await this.roleModel.findById(dto.roleId).lean().exec();
    if (!role) throw new NotFoundException('Role not found');

    // توليد كلمة سر مؤقتة إذا لم تُرسَل
    const tempPassword = dto.password || this._generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const user = await this.userModel.create({
      ...dto,
      roleId: new Types.ObjectId(dto.roleId),
      departmentId: dto.departmentId ? new Types.ObjectId(dto.departmentId) : undefined,
      passwordHash,
      mustChangePassword: true,
      createdBy: new Types.ObjectId(createdBy),
    });

    // إرسال بريد ترحيب
    try {
      await this.mailerService.sendMail({
        to: dto.email,
        subject: 'Welcome to PetroFlow ERP — Your Account Is Ready',
        template: 'welcome-user',
        context: {
          fullName: dto.fullName,
          username: dto.username,
          email: dto.email,
          temporaryPassword: tempPassword,
          role: (role as any).name,
          loginUrl: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/login`,
        },
      });
    } catch (err) {
      this.logger.warn(`Could not send welcome email to ${dto.email}: ${err}`);
    }

    await this.auditLogService.log({
      userId: createdBy,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      details: `Created user ${dto.username} with role ${(role as any).name}`,
    });

    const { passwordHash: _, ...result } = user.toObject();
    return result;
  }

  // ─── Update User ──────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateUserDto, updatedBy: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    ).select('-passwordHash').lean().exec();

    if (!user) throw new NotFoundException('User not found');

    await this.auditLogService.log({
      userId: updatedBy,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      details: `Updated user profile`,
    });

    return user;
  }

  // ─── Update Role ──────────────────────────────────────────────────────────
  async updateRole(id: string, dto: UpdateUserRoleDto, updatedBy: string) {
    const role = await this.roleModel.findById(dto.roleId).lean().exec();
    if (!role) throw new NotFoundException('Role not found');

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { roleId: new Types.ObjectId(dto.roleId) } },
      { new: true },
    ).select('-passwordHash').lean().exec();

    if (!user) throw new NotFoundException('User not found');

    // إلغاء جميع Refresh Tokens لإجبار إعادة تحميل الصلاحيات
    await this.refreshTokenModel.deleteMany({ userId: new Types.ObjectId(id) });

    await this.auditLogService.log({
      userId: updatedBy,
      action: 'UPDATE_USER_ROLE',
      entity: 'User',
      entityId: id,
      details: `Changed role to ${(role as any).name}`,
    });

    return { message: 'Role updated. User must re-login to get new permissions.', user };
  }

  // ─── Update Status ────────────────────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateUserStatusDto, updatedBy: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { status: dto.status } },
      { new: true },
    ).select('-passwordHash').lean().exec();

    if (!user) throw new NotFoundException('User not found');

    if (dto.status !== 'Active') {
      await this.refreshTokenModel.deleteMany({ userId: new Types.ObjectId(id) });
    }

    await this.auditLogService.log({
      userId: updatedBy,
      action: 'UPDATE_USER_STATUS',
      entity: 'User',
      entityId: id,
      details: `Status changed to ${dto.status}. Reason: ${dto.reason || 'N/A'}`,
    });

    return { message: `User status updated to ${dto.status}`, user };
  }

  // ─── Delete (Soft: Deactivate) ─────────────────────────────────────────────
  async deactivate(id: string, deletedBy: string) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { status: 'Inactive' } }, { new: true })
      .lean().exec();

    if (!user) throw new NotFoundException('User not found');

    await this.refreshTokenModel.deleteMany({ userId: new Types.ObjectId(id) });

    await this.auditLogService.log({
      userId: deletedBy,
      action: 'DEACTIVATE_USER',
      entity: 'User',
      entityId: id,
      details: 'User account deactivated',
    });

    return { message: 'User deactivated successfully' };
  }

  // ─── Reset Password by Admin ───────────────────────────────────────────────
  async adminResetPassword(id: string, adminId: string) {
    const user = await this.userModel.findById(id).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    const tempPassword = this._generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    await this.userModel.updateOne(
      { _id: id },
      { $set: { passwordHash, mustChangePassword: true } },
    );

    await this.refreshTokenModel.deleteMany({ userId: new Types.ObjectId(id) });

    try {
      await this.mailerService.sendMail({
        to: (user as any).email,
        subject: 'PetroFlow ERP — Your Password Has Been Reset',
        template: 'welcome-user',
        context: {
          fullName: (user as any).fullName,
          username: (user as any).username,
          email: (user as any).email,
          temporaryPassword: tempPassword,
          role: '',
          loginUrl: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/login`,
        },
      });
    } catch (err) {
      this.logger.warn(`Could not send password reset email: ${err}`);
    }

    await this.auditLogService.log({
      userId: adminId,
      action: 'ADMIN_RESET_PASSWORD',
      entity: 'User',
      entityId: id,
      details: 'Admin reset user password',
    });

    return { message: 'Password reset and sent to user email' };
  }

  private _generateTempPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$!%*';
    const all = upper + lower + digits + special;
    let pass = '';
    pass += upper[Math.floor(Math.random() * upper.length)];
    pass += lower[Math.floor(Math.random() * lower.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < 12; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }
    return pass.split('').sort(() => Math.random() - 0.5).join('');
  }
}
