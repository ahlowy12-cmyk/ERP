import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { UserRole } from 'src/DB/enums/user.enum';

@Controller('workflow')
export class InvoicesController {
  constructor(private readonly svc: InvoicesService) {}

  // ── Invoices ────────────────────────────────────────────────────────────

  // GET /api/v1/workflow/invoices — Finance & Management can view
  @Get('invoices')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.FinanceManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:finance')
  findAll(
    @Query('status') status?: string,
    @Query('contractId') contractId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.findAll({ status, contractId, page, limit }); }

  // GET /api/v1/workflow/invoices/:id
  @Get('invoices/:id')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.FinanceManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:finance')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  // POST /api/v1/workflow/invoices/create-from-wcc — Finance only
  @Post('invoices/create-from-wcc')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('edit:finance')
  createFromWCC(
    @Body() dto: { wccId: string; vatPercent?: number; withholdingTaxPercent?: number; dueDate: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.createFromWCC(dto, userId); }

  // POST /api/v1/workflow/invoices/:id/post-gl — ترحيل القيد المحاسبي للدفتر العام
  @Post('invoices/:id/post-gl')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('approve:finance')
  postGL(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.postGL(id, userId); }

  // ── GL Journal Entries ──────────────────────────────────────────────────

  // GET /api/v1/workflow/journal-entries — Finance & Management view
  @Get('journal-entries')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.FinanceManager,
  )
  @RequirePermissions('view:finance')
  getGLEntries(
    @Query('sourceType') sourceType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.getGLEntries({ sourceType, page, limit }); }

  // ── Collections ─────────────────────────────────────────────────────────

  // GET /api/v1/workflow/collections
  @Get('collections')
  @Roles(
    UserRole.SuperAdmin, UserRole.GeneralManager,
    UserRole.FinanceManager, UserRole.ProjectManager,
  )
  @RequirePermissions('view:finance')
  getCollections(
    @Query('invoiceId') invoiceId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.getCollections({ invoiceId, page, limit }); }

  // GET /api/v1/workflow/collections/aging — Finance & GM view
  @Get('collections/aging')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('view:finance')
  getAgingReport() { return this.svc.getAgingReport(); }

  // POST /api/v1/workflow/collections/:invoiceId/payments — Finance only
  @Post('collections/:invoiceId/payments')
  @Roles(UserRole.SuperAdmin, UserRole.GeneralManager, UserRole.FinanceManager)
  @RequirePermissions('approve:finance')
  recordPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() dto: { amount: number; date: string; method: string; reference?: string; remarks?: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.recordPayment(invoiceId, dto, userId); }
}
