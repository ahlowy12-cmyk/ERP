import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('workflow')
export class InvoicesController {
  constructor(private readonly svc: InvoicesService) {}

  // ── Invoices ────────────────────────────────────────────────────────────
  // GET /api/v1/workflow/invoices
  @Get('invoices')
  findAll(
    @Query('status') status?: string,
    @Query('contractId') contractId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.findAll({ status, contractId, page, limit }); }

  // GET /api/v1/workflow/invoices/:id
  @Get('invoices/:id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  // POST /api/v1/workflow/invoices/create-from-wcc
  @Post('invoices/create-from-wcc')
  createFromWCC(
    @Body() dto: { wccId: string; vatPercent?: number; withholdingTaxPercent?: number; dueDate: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.createFromWCC(dto, userId); }

  // ── GL Journal Entries ──────────────────────────────────────────────────
  // GET /api/v1/workflow/journal-entries
  @Get('journal-entries')
  getGLEntries(
    @Query('sourceType') sourceType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.getGLEntries({ sourceType, page, limit }); }

  // ── Collections ─────────────────────────────────────────────────────────
  // GET /api/v1/workflow/collections
  @Get('collections')
  getCollections(
    @Query('invoiceId') invoiceId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.getCollections({ invoiceId, page, limit }); }

  // GET /api/v1/workflow/collections/aging
  @Get('collections/aging')
  getAgingReport() { return this.svc.getAgingReport(); }

  // POST /api/v1/workflow/collections/:invoiceId/payments
  @Post('collections/:invoiceId/payments')
  recordPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() dto: { amount: number; date: string; method: string; reference?: string; remarks?: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.recordPayment(invoiceId, dto, userId); }
}
