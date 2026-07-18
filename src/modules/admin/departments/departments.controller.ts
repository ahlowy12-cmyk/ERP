import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';

@Controller('admin/departments')
@Roles(UserRole.SuperAdmin, UserRole.GeneralManager)
@RequirePermissions('manage:users')
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDepartmentDto, @CurrentUser('id') adminId: string) {
    return this.departmentsService.create(dto, adminId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.departmentsService.update(id, dto, adminId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.departmentsService.remove(id, adminId);
  }
}
