import { UserRole } from 'src/DB/enums/user.enum';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatementsService } from './statements.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('finance/statements')
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get('trial-balance')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getTrialBalance(@Query() query: any) {
    return this.statementsService.getTrialBalance(query);
  }

  @Get('income-statement')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getIncomeStatement(@Query() query: any) {
    return this.statementsService.getIncomeStatement(query);
  }

  @Get('balance-sheet')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getBalanceSheet(@Query() query: any) {
    return this.statementsService.getBalanceSheet(query);
  }
}
