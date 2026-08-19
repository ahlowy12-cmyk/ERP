import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('operations')
export class TimesheetsController {
  constructor(private readonly svc: TimesheetsService) {}

  // ── Rigs ──────────────────────────────────────────────────────────────────
  // GET /api/v1/operations/rigs
  @Get('rigs')
  getRigs(
    @Query('status') status?: string,
    @Query('projectCode') projectCode?: string,
  ) { return this.svc.getRigs({ status, projectCode }); }

  // PATCH /api/v1/operations/rigs/:id/status
  @Patch('rigs/:id/status')
  updateRigStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.updateRigStatus(id, status, userId); }

  // ── Timesheets ────────────────────────────────────────────────────────────
  // GET /api/v1/operations/timesheets
  @Get('timesheets')
  findAll(
    @Query('rigId') rigId?: string,
    @Query('projectCode') projectCode?: string,
    @Query('month') month?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.findAll({ rigId, projectCode, month, page, limit }); }

  // GET /api/v1/operations/timesheets/:id
  @Get('timesheets/:id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  // POST /api/v1/operations/timesheets
  @Post('timesheets')
  create(
    @Body() dto: { rigId: string; month: string; projectCode?: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.create(dto, userId); }

  // PATCH /api/v1/operations/timesheets/:id/day/:dayNumber
  @Patch('timesheets/:id/day/:dayNumber')
  updateDay(
    @Param('id') id: string,
    @Param('dayNumber') dayNumber: string,
    @Body() dto: any,
  ) { return this.svc.updateDay(id, Number(dayNumber), dto); }

  // Alias: PATCH /api/v1/operations/timesheets/:id/days/:dayIndex
  @Patch('timesheets/:id/days/:dayIndex')
  updateDayAlias(
    @Param('id') id: string,
    @Param('dayIndex') dayIndex: string,
    @Body() dto: any,
  ) { return this.svc.updateDay(id, Number(dayIndex), dto); }

  // PATCH /api/v1/operations/timesheets/:id/status
  @Patch('timesheets/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.updateStatus(id, status, userId); }
}
