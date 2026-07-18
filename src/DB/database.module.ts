import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';

// Models
import { UserModel } from 'src/modules/admin/users/entities/user.model';
import { RoleModel } from 'src/modules/admin/roles/entities/role.model';
import { PermissionModel } from 'src/modules/admin/roles/entities/permission.model';
import { RefreshTokenModel } from 'src/modules/admin/users/entities/refresh-token.model';
import { PasswordResetTokenModel } from 'src/modules/admin/users/entities/password-reset-token.model';
import { DepartmentModel } from 'src/modules/admin/departments/entities/department.model';

@Module({
  imports: [
    UserModel,
    RoleModel,
    PermissionModel,
    RefreshTokenModel,
    PasswordResetTokenModel,
    DepartmentModel,
  ],
  providers: [SeederService],
  exports: [
    UserModel,
    RoleModel,
    PermissionModel,
    RefreshTokenModel,
    PasswordResetTokenModel,
    DepartmentModel,
  ],
})
export class DatabaseModule {}
