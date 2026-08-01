import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RoleModel } from './entities/role.model';
import { PermissionModel } from './entities/permission.model';
import { UserModel } from '../users/entities/user.model';

@Module({
  imports: [RoleModel, PermissionModel, UserModel],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService, RoleModel, PermissionModel],
})
export class RolesModule {}
