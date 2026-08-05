import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { CampsService } from './camps.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('operations/camps')
export class CampsController {
  constructor(private readonly svc: CampsService) {}

  // GET  /api/v1/operations/camps
  @Get()
  getCamps(
    @Query('projectCode') projectCode?: string,
    @Query('status') status?: string,
  ) { return this.svc.getCamps({ projectCode, status }); }

  // POST /api/v1/operations/camps
  @Post()
  createCamp(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.createCamp(dto, userId);
  }

  // GET  /api/v1/operations/camps/:id
  @Get(':id')
  getCamp(@Param('id') id: string) { return this.svc.getCamp(id); }

  // GET  /api/v1/operations/camps/allocations
  @Get('allocations/list')
  getAllocations(
    @Query('campId') campId?: string,
    @Query('projectCode') projectCode?: string,
  ) { return this.svc.getAllocations(campId, projectCode); }

  // POST /api/v1/operations/camps/allocations
  @Post('allocations')
  createAllocation(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.createAllocation(dto, userId);
  }

  // PATCH /api/v1/operations/camps/allocations/:id/release
  @Patch('allocations/:id/release')
  releaseAllocation(@Param('id') id: string) {
    return this.svc.releaseAllocation(id);
  }
}
