import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { InventoryReservationModel } from './entities/reservation.model';
import { ReservationsRepository } from './reservations.repository';

@Module({
  imports: [InventoryReservationModel],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
  exports: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
