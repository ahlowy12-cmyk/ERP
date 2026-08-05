import { Module } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { VehicleModel, TripModel } from './entities/fleet.model';

@Module({
  imports: [VehicleModel, TripModel],
  providers: [FleetService],
  controllers: [FleetController],
  exports: [FleetService, VehicleModel],
})
export class FleetModule {}
