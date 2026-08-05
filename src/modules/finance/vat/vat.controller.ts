import { UserRole } from 'src/DB/enums/user.enum';
import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { VatService } from './vat.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('finance/vat')
export class VatController {
  constructor(private readonly vatService: VatService) {}

  @Get('report')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getReport(@Query() query: any) {
    return this.vatService.getReport(query);
  }

  @Post('post-settlement')
  @Roles(UserRole.SuperAdmin, UserRole.FinanceManager)
  @RequirePermissions('approve:finance')
  postSettlement(@Body() dto: { periodStart: string; periodEnd: string }, @Request() req: any) {
    return this.vatService.postSettlement(dto, req.user?.id);
  }
}
