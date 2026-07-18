import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
@Controller('inventory/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(@Body() data: CreateReservationDto) {
    return this.reservationsService.createReservation(data);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.reservationsService.approveReservation(id);
  }

  @Patch(':id/release')
  async release(@Param('id') id: string) {
    return this.reservationsService.releaseReservation(id);
  }
}
