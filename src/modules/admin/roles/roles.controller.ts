import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';

@Controller('admin/roles')
@Roles(UserRole.SuperAdmin)
@RequirePermissions('manage:roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // GET /admin/roles
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  // GET /admin/roles/permissions
  @Get('permissions')
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  // GET /admin/roles/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  // POST /admin/roles
  @Post()
  create(@Body() dto: CreateRoleDto, @CurrentUser('id') adminId: string) {
    return this.rolesService.create(dto, adminId);
  }

  // PATCH /admin/roles/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.rolesService.update(id, dto, adminId);
  }

  // DELETE /admin/roles/:id
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.rolesService.remove(id, adminId);
  }
}
