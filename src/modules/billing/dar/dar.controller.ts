import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { DARService } from './dar.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('workflow/dars')
export class DARController {
  constructor(private readonly svc: DARService) {}

  @Get()
  findAll(
    @Query('contractId') contractId?: string,
    @Query('rigId') rigId?: string,
    @Query('status') status?: string,
    @Query('projectCode') projectCode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.svc.findAll({ contractId, rigId, status, projectCode, from, to, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.create(dto, userId);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: { clientRepName?: string; clientSignature?: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.approve(id, dto, userId); }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.reject(id, reason, userId); }
}
