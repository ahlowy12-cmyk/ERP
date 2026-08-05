import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('operations/fleet')
export class FleetController {
  constructor(private readonly svc: FleetService) {}

  // GET  /api/v1/operations/fleet/vehicles
  @Get('vehicles')
  getVehicles(
    @Query('status') status?: string,
    @Query('projectCode') projectCode?: string,
    @Query('type') type?: string,
  ) { return this.svc.getVehicles({ status, projectCode, type }); }

  // POST /api/v1/operations/fleet/vehicles
  @Post('vehicles')
  createVehicle(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.createVehicle(dto, userId);
  }

  // GET  /api/v1/operations/fleet/vehicles/:id
  @Get('vehicles/:id')
  getVehicle(@Param('id') id: string) { return this.svc.getVehicle(id); }

  // PATCH /api/v1/operations/fleet/vehicles/:id/status
  @Patch('vehicles/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.svc.updateVehicleStatus(id, status);
  }

  // GET  /api/v1/operations/fleet/trips
  @Get('trips')
  getTrips(
    @Query('vehicleId') vehicleId?: string,
    @Query('projectCode') projectCode?: string,
    @Query('status') status?: string,
  ) { return this.svc.getTrips({ vehicleId, projectCode, status }); }

  // POST /api/v1/operations/fleet/trips
  @Post('trips')
  createTrip(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.svc.createTrip(dto, userId);
  }

  // PATCH /api/v1/operations/fleet/trips/:id/complete
  @Patch('trips/:id/complete')
  completeTrip(@Param('id') id: string, @Body() dto: { endOdometer: number; endDate?: string }) {
    return this.svc.completeTrip(id, dto);
  }
}
