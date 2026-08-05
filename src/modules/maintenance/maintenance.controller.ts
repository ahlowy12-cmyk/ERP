import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly svc: MaintenanceService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // PM SCHEDULES
  // ══════════════════════════════════════════════════════════════════════════

  // GET /api/v1/maintenance/pm-schedules
  @Get('pm-schedules')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:maintenance')
  listPM(
    @Query('assetId')   assetId?: string,
    @Query('status')    status?: string,
    @Query('dueBefore') dueBefore?: string,
  ) { return this.svc.listPMSchedules({ assetId, status, dueBefore }); }

  // POST /api/v1/maintenance/pm-schedules
  @Post('pm-schedules')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:maintenance')
  createPM(
    @Body() dto: {
      assetId: string;
      pmCode: string;
      taskDescription: string;
      frequencyDays: number;
      nextDueDate: string;
      status?: string;
    },
    @CurrentUser('id') userId: string,
  ) { return this.svc.createPMSchedule(dto, userId); }

  // PATCH /api/v1/maintenance/pm-schedules/:id
  @Patch('pm-schedules/:id')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:maintenance')
  updatePM(
    @Param('id') id: string,
    @Body() dto: {
      status?: string;
      frequencyDays?: number;
      nextDueDate?: string;
      taskDescription?: string;
    },
  ) { return this.svc.updatePMSchedule(id, dto); }

  // POST /api/v1/maintenance/pm-schedules/:id/trigger
  @Post('pm-schedules/:id/trigger')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:maintenance')
  triggerPM(
    @Param('id') id: string,
    @Body() dto: { assignedToTechnician?: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.triggerPM(id, dto, userId); }

  // ══════════════════════════════════════════════════════════════════════════
  // WORK ORDERS
  // ══════════════════════════════════════════════════════════════════════════

  // GET /api/v1/maintenance/work-orders
  @Get('work-orders')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:maintenance')
  listWO(
    @Query('status')   status?: string,
    @Query('type')     type?: string,
    @Query('priority') priority?: string,
    @Query('assetId')  assetId?: string,
  ) { return this.svc.listWorkOrders({ status, type, priority, assetId }); }

  // POST /api/v1/maintenance/work-orders
  @Post('work-orders')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:maintenance')
  createWO(
    @Body() dto: {
      assetId: string;
      type: string;
      priority?: string;
      issueDescription: string;
      assignedToTechnician?: string;
    },
    @CurrentUser('id') userId: string,
  ) { return this.svc.createWorkOrder(dto, userId); }

  // PATCH /api/v1/maintenance/work-orders/:id/status
  @Patch('work-orders/:id/status')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:maintenance')
  updateWOStatus(
    @Param('id') id: string,
    @Body() dto: {
      status: string;
      sparePartsUsed?: { itemCode: string; itemName: string; quantity: number; unitPrice: number }[];
      laborHoursCost?: number;
    },
    @CurrentUser('id') userId: string,
  ) { return this.svc.updateWorkOrderStatus(id, dto, userId); }
}
