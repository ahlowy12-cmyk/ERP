import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { DARService } from './dar.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('workflow/dars')
export class DARController {
  constructor(private readonly svc: DARService) {}

  @Get()
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager, UserRole.FinanceManager,
  )
  @RequirePermissions('view:timesheets')
  findAll(
    @Query('contractId') contractId?: string,
    @Query('rigId') rigId?: string,
    @Query('status') status?: string,
    @Query('projectCode') projectCode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.svc.findAll({ contractId, rigId, status, projectCode, from, to, page, limit });
  }

  @Get(':id')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager, UserRole.FinanceManager,
  )
  @RequirePermissions('view:timesheets')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('edit:timesheets')
  create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.create(dto, userId);
  }

  @Patch(':id/submit')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('edit:timesheets')
  submit(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.submit(id, userId); }

  @Patch(':id/approve')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('approve:projects')
  approve(
    @Param('id') id: string,
    @Body() dto: { clientRepName?: string; clientSignature?: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.approve(id, dto, userId); }

  @Patch(':id/reject')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('approve:projects')
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.reject(id, reason, userId); }
}
