import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

import { UserModel } from 'src/modules/admin/users/entities/user.model';
import { RoleModel } from 'src/modules/admin/roles/entities/role.model';
import { PermissionModel } from 'src/modules/admin/roles/entities/permission.model';
import { RefreshTokenModel } from 'src/modules/admin/users/entities/refresh-token.model';
import { PasswordResetTokenModel } from 'src/modules/admin/users/entities/password-reset-token.model';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST') ?? 'smtp.gmail.com',
          port: Number(config.get('MAIL_PORT') ?? 587),
          secure: false,
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"PetroFlow ERP" <${config.get<string>('MAIL_FROM') ?? config.get<string>('MAIL_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),

    // Models
    UserModel,
    RoleModel,
    PermissionModel,
    RefreshTokenModel,
    PasswordResetTokenModel,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule, MailerModule],
})
export class AuthModule {}
