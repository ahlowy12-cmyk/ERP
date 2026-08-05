import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { WCCService } from './wcc.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('workflow/wccs')
export class WCCController {
  constructor(private readonly svc: WCCService) {}

  @Get()
  findAll(
    @Query('contractId') contractId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.svc.findAll({ contractId, status, page, limit }); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  // POST /api/v1/workflow/wccs/generate
  @Post('generate')
  generate(
    @Body() dto: { contractId: string; periodFrom: string; periodTo: string },
    @CurrentUser('id') userId: string,
  ) { return this.svc.generate(dto, userId); }

  // PATCH /api/v1/workflow/wccs/:id/approve
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) { return this.svc.approve(id, userId); }
}
