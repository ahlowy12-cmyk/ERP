import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('assets')
export class AssetsController {
  constructor(private readonly svc: AssetsService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // ASSIGNMENTS
  // ══════════════════════════════════════════════════════════════════════════

  // GET /api/v1/assets/assignments
  @Get('assignments')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:assets')
  listAssignments(
    @Query('assetId')       assetId?: string,
    @Query('assignedToType') assignedToType?: string,
    @Query('assignedToId')  assignedToId?: string,
  ) { return this.svc.listAssignments({ assetId, assignedToType, assignedToId }); }

  // POST /api/v1/assets/assignments
  @Post('assignments')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:assets')
  createAssignment(
    @Body() dto: {
      assetId: string;
      assignedToType: string;
      assignedToId: string;
      assignedToName: string;
      assignmentDate: string;
      conditionOnAssign?: string;
      notes?: string;
    },
    @CurrentUser('id') userId: string,
  ) { return this.svc.createAssignment(dto, userId); }

  // PATCH /api/v1/assets/assignments/:id/release
  @Patch('assignments/:id/release')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:assets')
  releaseAssignment(
    @Param('id') id: string,
    @Body() dto: { releaseDate?: string; notes?: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.releaseAssignment(id, dto, userId); }

  // ══════════════════════════════════════════════════════════════════════════
  // TRANSFERS
  // ══════════════════════════════════════════════════════════════════════════

  // GET /api/v1/assets/transfers
  @Get('transfers')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:assets')
  listTransfers(
    @Query('assetId') assetId?: string,
    @Query('status')  status?: string,
  ) { return this.svc.listTransfers({ assetId, status }); }

  // POST /api/v1/assets/transfers
  @Post('transfers')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.OperationsManager)
  @RequirePermissions('edit:assets')
  createTransfer(
    @Body() dto: {
      assetId: string;
      toLocation: string;
      transferDate: string;
      authorizedBy: string;
      notes?: string;
    },
    @CurrentUser('id') userId: string,
  ) { return this.svc.createTransfer(dto, userId); }

  // ══════════════════════════════════════════════════════════════════════════
  // DISPOSALS
  // ══════════════════════════════════════════════════════════════════════════

  // GET /api/v1/assets/disposals
  @Get('disposals')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:assets')
  listDisposals(@Query('assetId') assetId?: string) {
    return this.svc.listDisposals({ assetId });
  }

  // POST /api/v1/assets/disposals
  @Post('disposals')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager)
  @RequirePermissions('edit:assets')
  createDisposal(
    @Body() dto: {
      assetId: string;
      disposalDate: string;
      disposalMethod: string;
      disposalCost?: number;
      revenueReceived?: number;
      reason: string;
      authorizedBy: string;
    },
    @CurrentUser('id') userId: string,
  ) { return this.svc.createDisposal(dto, userId); }

  // ══════════════════════════════════════════════════════════════════════════
  // HISTORY (Audit Log)
  // ══════════════════════════════════════════════════════════════════════════

  // GET /api/v1/assets/history
  @Get('history')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.OperationsManager, UserRole.FinanceManager,
  )
  @RequirePermissions('view:assets')
  listHistory(
    @Query('assetId')    assetId?: string,
    @Query('changeType') changeType?: string,
  ) { return this.svc.listHistory({ assetId, changeType }); }

  // POST /api/v1/assets/history  (internal / admin use)
  @Post('history')
  @Roles(UserRole.SuperAdmin)
  @RequirePermissions('edit:assets')
  addHistory(
    @Body() dto: {
      assetId: string;
      equipmentCode: string;
      changeType: string;
      oldValue?: string;
      newValue?: string;
      changedBy: string;
      notes?: string;
    },
    @CurrentUser('id') userId: string,
  ) { return this.svc.addHistory(dto, userId); }
}
