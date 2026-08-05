import { UserRole } from 'src/DB/enums/user.enum';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DepreciationService } from './depreciation.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('finance/depreciation')
export class DepreciationController {
  constructor(private readonly depreciationService: DepreciationService) {}

  @Get()
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getSchedule(@Query() query: any) {
    return this.depreciationService.getSchedule(query);
  }

  @Get(':assetId/schedule')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getAssetSchedule(@Param('assetId') assetId: string) {
    return this.depreciationService.getAssetSchedule(assetId);
  }

  @Post('post-monthly')
  @Roles(UserRole.SuperAdmin, UserRole.FinanceManager)
  @RequirePermissions('approve:finance')
  postMonthly(@Body() dto: { postingMonth: string }, @Request() req: any) {
    return this.depreciationService.postMonthly(dto, req.user?.id);
  }
}
