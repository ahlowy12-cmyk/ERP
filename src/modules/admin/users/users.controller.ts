import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-user-role.dto';

@Controller('admin/users')
@Roles(UserRole.SuperAdmin, UserRole.GeneralManager)
@RequirePermissions('manage:users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /admin/users?page=1&limit=20&search=...&roleId=...&status=...
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll({ page, limit, search, roleId, departmentId, status });
  }

  // GET /admin/users/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // POST /admin/users
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser('id') adminId: string) {
    return this.usersService.create(dto, adminId);
  }

  // PATCH /admin/users/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.update(id, dto, adminId);
  }

  // PATCH /admin/users/:id/role
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.updateRole(id, dto, adminId);
  }

  // PATCH /admin/users/:id/status
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.updateStatus(id, dto, adminId);
  }

  // POST /admin/users/:id/reset-password
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.usersService.adminResetPassword(id, adminId);
  }

  // DELETE /admin/users/:id (soft delete)
  @Delete(':id')
  deactivate(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.usersService.deactivate(id, adminId);
  }
}
