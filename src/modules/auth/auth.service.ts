import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserModelName } from '../admin/users/entities/user.model';
import { RoleModelName } from '../admin/roles/entities/role.model';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(UserModelName) private readonly userModel: Model<any>,
    @InjectModel(RoleModelName) private readonly roleModel: Model<any>,
    private readonly jwtService: JwtService,
  ) {}

  // ── Validate credentials (used by LocalStrategy) ─────────────────────────
  async validateUser(login: string, password: string): Promise<any> {
    // Accept username OR email
    const user = await this.userModel
      .findOne({ $or: [{ username: login }, { email: login }] })
      .populate('roleId', 'name permissions')
      .select('+passwordHash +failedLoginAttempts +lockedUntil');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ── Account status checks ──────────────────────────────────────────────
    if (user.status === 'Inactive') {
      throw new UnauthorizedException('Account is inactive. Contact your administrator.');
    }
    if (user.status === 'Suspended') {
      throw new UnauthorizedException('Account is suspended. Contact your administrator.');
    }

    // ── Lockout check ──────────────────────────────────────────────────────
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
      );
    }

    // ── Password verification ──────────────────────────────────────────────
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await this.handleFailedAttempt(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // ── Successful — reset failed attempts ─────────────────────────────────
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
      },
    );

    return user;
  }

  // ── Build JWT and return response ─────────────────────────────────────────
  async login(user: any) {
    const role = user.roleId;
    const roleName: string = role?.name ?? 'Unknown';

    const payload = {
      sub:         user._id.toString(),
      email:       user.email,
      username:    user.username,
      fullName:    user.fullName,
      role:        roleName,
      roleId:      role?._id?.toString(),
      permissions: (role?.permissions ?? []).map((p: any) =>
        typeof p === 'string' ? p : p?.name ?? p?.toString(),
      ),
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id:                  user._id,
        username:            user.username,
        email:               user.email,
        fullName:            user.fullName,
        fullNameAr:          user.fullNameAr,
        role:                roleName,
        roleId:              role?._id,
        avatar:              user.avatarUrl || user.avatar || null,
        mustChangePassword:  user.mustChangePassword,
        preferredLanguage:   user.preferredLanguage,
        status:              user.status,
      },
    };
  }

  // ── Change password ───────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel
      .findById(userId)
      .select('+passwordHash');

    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash,
          mustChangePassword: false,
          passwordChangedAt:  new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      },
    );

    return { message: 'Password changed successfully' };
  }

  // ── Get current user profile ──────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('roleId', 'name permissions')
      .select('-passwordHash -failedLoginAttempts -lockedUntil')
      .lean();

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private async handleFailedAttempt(user: any) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const update: any = { failedLoginAttempts: attempts };

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      update.lockedUntil = lockUntil;
      this.logger.warn(`Account locked: ${user.email} — ${attempts} failed attempts`);
    }

    await this.userModel.updateOne({ _id: user._id }, { $set: update });
  }
}
