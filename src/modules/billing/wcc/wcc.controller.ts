import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { WCCService } from './wcc.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('workflow/wccs')
export class WCCController {
  constructor(private readonly svc: WCCService) {}

  // GET /api/v1/workflow/wccs — Finance, Operations, PM can view
  @Get()
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.FinanceManager, UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:finance')
  findAll(
    @Query('contractId') contractId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.findAll({ contractId, status, page, limit }); }

  // GET /api/v1/workflow/wccs/:id
  @Get(':id')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.FinanceManager, UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:finance')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  // POST /api/v1/workflow/wccs/generate — Operations & Finance generate WCC
  @Post('generate')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.FinanceManager, UserRole.OperationsManager,
  )
  @RequirePermissions('edit:finance')
  generate(
    @Body() dto: { contractId: string; periodFrom: string; periodTo: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.generate(dto, userId); }

  // PATCH /api/v1/workflow/wccs/:id/approve — GM & Finance approve WCC
  @Patch(':id/approve')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('approve:finance')
  approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.approve(id, userId); }
}
