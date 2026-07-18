import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserModel } from './entities/user.model';
import { RoleModel } from '../roles/entities/role.model';
import { RefreshTokenModel } from './entities/refresh-token.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    UserModel,
    RoleModel,
    RefreshTokenModel,
    AuthModule, // للحصول على MailerModule
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, UserModel],
})
export class UsersModule {}
