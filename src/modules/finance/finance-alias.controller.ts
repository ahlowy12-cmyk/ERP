/**
 * Finance Aliases Controller
 *
 * يوفر مسارات بديلة متوافقة مع الفرونت إند:
 *   GET  /finance/accounts          → COA (Chart of Accounts)
 *   GET  /finance/general-ledger    → GL Journal Entries
 *   POST /finance/journal-entries   → Post GL Journal Entry
 *   GET  /finance/reports/trial-balance    → Financial Statements
 *   GET  /finance/reports/income-statement → Financial Statements
 *   GET  /finance/reports/balance-sheet    → Financial Statements
 */
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CoaService } from './coa/coa.service';
import { GlService } from './gl/gl.service';
import { StatementsService } from './statements/statements.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('finance')
export class FinanceAliasController {
  constructor(
    private readonly coaService: CoaService,
    private readonly glService: GlService,
    private readonly statementsService: StatementsService,
  ) {}

  // ── Chart of Accounts alias ────────────────────────────────────────────────
  // GET /api/v1/finance/accounts  (alias for /finance/coa)
  @Get('accounts')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getAccounts(
    @Query('type') type?: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.coaService.findAll({ type, parentCode: parentId });
  }

  // ── GL aliases ─────────────────────────────────────────────────────────────
  // GET /api/v1/finance/general-ledger  (alias for /finance/gl/journal-entries)
  @Get('general-ledger')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getGeneralLedger(
    @Query('accountCode') accountCode?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('reference') reference?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.glService.findAll({ accountCode, dateFrom, dateTo, reference, status, page, limit });
  }

  // POST /api/v1/finance/journal-entries  (alias for POST /finance/gl/journal-entries)
  @Post('journal-entries')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  createJournalEntry(
    @Body() dto: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.glService.createManual(dto, userId);
  }

  // ── Financial Reports aliases ───────────────────────────────────────────────
  // GET /api/v1/finance/reports/trial-balance
  @Get('reports/trial-balance')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getTrialBalance(@Query('asOfDate') asOfDate?: string) {
    return this.statementsService.getTrialBalance({ asOfDate });
  }

  // GET /api/v1/finance/reports/income-statement
  @Get('reports/income-statement')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getIncomeStatement(
    @Query('periodStart') periodStart?: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.statementsService.getIncomeStatement({ periodStart, asOfDate });
  }

  // GET /api/v1/finance/reports/balance-sheet
  @Get('reports/balance-sheet')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getBalanceSheet(@Query('asOfDate') asOfDate?: string) {
    return this.statementsService.getBalanceSheet({ asOfDate });
  }
}
