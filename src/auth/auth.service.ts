import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';

import { UserModelName } from 'src/modules/admin/users/entities/user.model';
import { RoleModelName } from 'src/modules/admin/roles/entities/role.model';
import { PermissionModelName } from 'src/modules/admin/roles/entities/permission.model';
import {
  RefreshTokenModelName,
} from 'src/modules/admin/users/entities/refresh-token.model';
import {
  PasswordResetTokenModelName,
} from 'src/modules/admin/users/entities/password-reset-token.model';
import { AuditLogService } from 'src/shared/audit-logs/audit-logs.service';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(UserModelName) private userModel: Model<any>,
    @InjectModel(RoleModelName) private roleModel: Model<any>,
    @InjectModel(PermissionModelName) private permissionModel: Model<any>,
    @InjectModel(RefreshTokenModelName) private refreshTokenModel: Model<any>,
    @InjectModel(PasswordResetTokenModelName) private resetTokenModel: Model<any>,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
    private auditLogService: AuditLogService,
  ) {}

  // ─── Validate User (used by LocalStrategy) ────────────────────────────────
  async validateUser(username: string, password: string) {
    const user = await this.userModel
      .findOne({ $or: [{ username }, { email: username }] })
      .populate({ path: 'roleId', model: RoleModelName })
      .lean()
      .exec();

    if (!user) return null;

    // فحص الحساب المقفل
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new HttpException(
        {
          statusCode: 423,
          message: `Account locked. Try again after ${LOCK_DURATION_MINUTES} minutes.`,
          lockedUntil: user.lockedUntil,
        },
        423,
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await this._handleFailedLogin(user);
      return null;
    }

    // إعادة تعيين محاولات الفشل عند النجاح
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, lockedUntil: null } },
    );

    return user;
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(user: any, rememberMe = false, ipAddress?: string, deviceInfo?: string) {
    if (user.status !== 'Active') {
      throw new ForbiddenException('Your account is not active. Please contact admin.');
    }

    const role = user.roleId as any;
    const permissions = await this._getPermissions(role?.permissions || []);

    const accessTokenPayload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      role: role?.name || 'Employee',
      permissions,
      departmentId: user.departmentId?.toString(),
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    // توليد Refresh Token
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : REFRESH_TOKEN_EXPIRY_DAYS));

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    // تحديث آخر دخول
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } },
    );

    // تسجيل الحدث
    try {
      await this.auditLogService.log({
        userId: user._id.toString(),
        action: 'LOGIN',
        entity: 'User',
        entityId: user._id.toString(),
        details: `User logged in from IP: ${ipAddress || 'unknown'}`,
      });
    } catch {
      // audit log failure should not break login
    }

    const departmentId = user.departmentId;
    let department: any = null;
    if (departmentId) {
      department = await this.connection.model('Department').findById(departmentId).lean().exec();
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        fullNameAr: user.fullNameAr,
        role: role?.name,
        permissions,
        department: department?.nameEn || department?.code,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage,
        timezone: user.timezone,
        lastLogin: user.lastLogin,
      },
    };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────
  async refreshToken(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const stored = await this.refreshTokenModel
      .findOne({ tokenHash, revoked: false })
      .exec();

    if (!stored) throw new UnauthorizedException('Invalid or expired refresh token');
    if (new Date(stored.expiresAt) < new Date()) {
      await this.refreshTokenModel.deleteOne({ _id: stored._id });
      throw new UnauthorizedException('Refresh token expired. Please login again.');
    }

    const user = await this.userModel
      .findById(stored.userId)
      .populate({ path: 'roleId', model: RoleModelName })
      .lean()
      .exec();

    if (!user || user.status !== 'Active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    const role = user.roleId as any;
    const permissions = await this._getPermissions(role?.permissions || []);

    const accessToken = this.jwtService.sign(
      {
        sub: user._id.toString(),
        username: user.username,
        email: user.email,
        role: role?.name,
        permissions,
        departmentId: user.departmentId?.toString(),
      },
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    // Token Rotation: إلغاء القديم وإنشاء جديد
    await this.refreshTokenModel.deleteOne({ _id: stored._id });

    const newRawToken = crypto.randomBytes(64).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: newHash,
      expiresAt,
    });

    return { accessToken, refreshToken: newRawToken, expiresIn: ACCESS_TOKEN_EXPIRY };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      await this.refreshTokenModel.deleteOne({ userId: new Types.ObjectId(userId), tokenHash });
    } else {
      // إلغاء جميع Refresh Tokens
      await this.refreshTokenModel.deleteMany({ userId: new Types.ObjectId(userId) });
    }

    try {
      await this.auditLogService.log({
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        details: 'User logged out',
      });
    } catch {}

    return { message: 'Logged out successfully' };
  }

  // ─── Get Current User Profile ─────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({ path: 'roleId', model: RoleModelName })
      .populate({ path: 'departmentId', model: 'Department' })
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    const role = user.roleId as any;
    const permissions = await this._getPermissions(role?.permissions || []);
    const department = user.departmentId as any;

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      fullNameAr: user.fullNameAr,
      role: role?.name,
      roleName: role?.nameAr,
      permissions,
      department: department
        ? { code: department.code, nameEn: department.nameEn, nameAr: department.nameAr }
        : null,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      emailNotifications: user.emailNotifications,
      mustChangePassword: user.mustChangePassword,
      lastLogin: user.lastLogin,
    };
  }

  // ─── Change Password ──────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash: newHash,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      },
    );

    // إلغاء جميع Refresh Tokens لإجبار إعادة الدخول
    await this.refreshTokenModel.deleteMany({ userId: new Types.ObjectId(userId) });

    try {
      await this.auditLogService.log({
        userId,
        action: 'CHANGE_PASSWORD',
        entity: 'User',
        entityId: userId,
        details: 'User changed their password',
      });
    } catch {}

    return { message: 'Password changed successfully. Please login again.' };
  }

  // ─── Update Profile ───────────────────────────────────────────────────────
  async updateProfile(userId: string, updates: any) {
    const allowed = ['fullName', 'fullNameAr', 'preferredLanguage', 'timezone', 'emailNotifications'];
    const filtered: any = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: filtered }, { new: true })
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return { message: 'Profile updated successfully', data: user };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email }).lean().exec();

    // دائماً رسالة نجاح لأسباب أمنية
    if (!user) return { message: 'Reset link sent if email exists' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // صالح ساعة واحدة

    // إلغاء أي توكنات سابقة
    await this.resetTokenModel.deleteMany({ userId: user._id });

    await this.resetTokenModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    const resetLink = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/reset-password?token=${rawToken}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'PetroFlow ERP — Password Reset Request',
        template: 'reset-password',
        context: {
          fullName: user.fullName,
          resetLink,
          expiresInMinutes: 60,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to send reset email to ${email}: ${err}`);
    }

    try {
      await this.auditLogService.log({
        userId: user._id.toString(),
        action: 'FORGOT_PASSWORD',
        entity: 'User',
        entityId: user._id.toString(),
        details: `Password reset requested for ${email}`,
      });
    } catch {}

    return { message: 'Reset link sent if email exists' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.resetTokenModel
      .findOne({ tokenHash, used: false })
      .exec();

    if (!resetToken) throw new BadRequestException('Invalid or expired reset token');
    if (new Date(resetToken.expiresAt) < new Date()) {
      await this.resetTokenModel.deleteOne({ _id: resetToken._id });
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userModel.updateOne(
      { _id: resetToken.userId },
      { $set: { passwordHash: newHash, mustChangePassword: false, passwordChangedAt: new Date() } },
    );

    await this.resetTokenModel.updateOne({ _id: resetToken._id }, { $set: { used: true } });

    // إلغاء جميع Refresh Tokens
    await this.refreshTokenModel.deleteMany({ userId: resetToken.userId });

    try {
      await this.auditLogService.log({
        userId: resetToken.userId.toString(),
        action: 'RESET_PASSWORD',
        entity: 'User',
        entityId: resetToken.userId.toString(),
        details: 'Password reset via email token',
      });
    } catch {}

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────
  private async _getPermissions(permissionIds: Types.ObjectId[]): Promise<string[]> {
    if (!permissionIds || permissionIds.length === 0) return [];
    const perms = await this.permissionModel
      .find({ _id: { $in: permissionIds } })
      .select('name')
      .lean()
      .exec();
    return perms.map((p: any) => p.name);
  }

  private async _handleFailedLogin(user: any) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updates: any = { failedLoginAttempts: attempts };

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
      updates.lockedUntil = lockedUntil;
      updates.failedLoginAttempts = 0;

      try {
        await this.auditLogService.log({
          userId: user._id.toString(),
          action: 'ACCOUNT_LOCKED',
          entity: 'User',
          entityId: user._id.toString(),
          details: `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts`,
        });
      } catch {}
    }

    await this.userModel.updateOne({ _id: user._id }, { $set: updates });
  }
}
