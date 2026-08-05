import { UserRole } from 'src/DB/enums/user.enum';
import { Controller, Get, Post, Body, Query, Request } from '@nestjs/common';
import { ArService } from './ar.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';

@Controller('finance/ar')
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Get('invoices')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager, UserRole.ProjectManager)
  @RequirePermissions('view:finance')
  findAllInvoices(@Query() query: any) {
    return this.arService.findAllInvoices(query);
  }

  @Get('aging')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getAging() {
    return this.arService.getAging();
  }

  @Get('collection-vouchers')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  findAllCollectionVouchers(@Query() query: any) {
    return this.arService.findAllCollectionVouchers(query);
  }

  @Post('collection-vouchers')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('approve:finance')
  createCollectionVoucher(@Body() dto: any, @Request() req: any) {
    return this.arService.createCollectionVoucher(dto, req.user?.id);
  }
}
