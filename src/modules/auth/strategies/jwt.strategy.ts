import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModelName } from '../../admin/users/entities/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(UserModelName) private readonly userModel: Model<any>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecretKey',
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fetch user from DB to get fresh status and permissions
    const user = await this.userModel
      .findById(payload.sub)
      .populate({ path: 'roleId', select: 'name permissions', populate: { path: 'permissions', select: 'name' } })
      .select('status username email fullName fullNameAr roleId avatar avatarUrl mustChangePassword preferredLanguage')
      .lean();

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === 'Inactive' || user.status === 'Suspended') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    const role = user.roleId as any;
    const roleName: string = payload.role || role?.name || 'Unknown';

    // Resolve permissions: could be populated objects or string names or slugs
    const permissions: string[] = (role?.permissions ?? []).map((p: any) => {
      if (typeof p === 'string') return p;
      return p?.name ?? p?.slug ?? p?.toString();
    });

    return {
      userId:      user._id.toString(),
      email:       user.email,
      username:    user.username,
      fullName:    user.fullName,
      role:        roleName,
      roleId:      role?._id?.toString(),
      permissions,
      mustChangePassword: user.mustChangePassword,
      status:      user.status,
    };
  }
}
