import { UserRole } from 'src/DB/enums/user.enum';
import { Controller, Get, Post, Patch, Body, Query, Param, Request } from '@nestjs/common';
import { CashBankService } from './cash-bank.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';

@Controller('finance/cash-bank')
export class CashBankController {
  constructor(private readonly cashBankService: CashBankService) {}

  @Get('bank-accounts')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  findAllBankAccounts() {
    return this.cashBankService.findAllBankAccounts();
  }

  @Post('bank-accounts')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  createBankAccount(@Body() dto: any, @Request() req: any) {
    return this.cashBankService.createBankAccount(dto, req.user?.id);
  }

  @Get('cash-accounts')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  findAllCashAccounts() {
    return this.cashBankService.findAllCashAccounts();
  }

  @Post('cash-accounts')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  createCashAccount(@Body() dto: any, @Request() req: any) {
    return this.cashBankService.createCashAccount(dto, req.user?.id);
  }

  @Get('reconciliations')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  findAllReconciliations(@Query() query: any) {
    return this.cashBankService.findAllReconciliations(query);
  }

  @Post('reconciliations')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  createReconciliation(@Body() dto: any, @Request() req: any) {
    return this.cashBankService.createReconciliation(dto, req.user?.id);
  }

  @Patch('bank-accounts/:id/balance')
  @Roles(UserRole.SuperAdmin, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  updateBankBalance(@Param('id') id: string, @Body() dto: any) {
    return this.cashBankService.updateBankBalance(id, dto);
  }
}
