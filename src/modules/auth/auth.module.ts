import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModel } from '../admin/users/entities/user.model';
import { RoleModel } from '../admin/roles/entities/role.model';
import { RefreshTokenModel } from './entities/refresh-token.model';
import { PasswordResetTokenModel } from './entities/password-reset-token.model';
import { PasswordHistoryModel } from './entities/password-history.model';
import { PasswordExpiryTask } from './tasks/password-expiry.task';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'defaultSecretKey',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '24h') as any,
        },
      }),
    }),
    UserModel,
    RoleModel,
    RefreshTokenModel,
    PasswordResetTokenModel,
    PasswordHistoryModel,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    PasswordExpiryTask,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
