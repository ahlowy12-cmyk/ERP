import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  InventoryReservationDocument,
  InventoryReservationModelName,
} from './entities/reservation.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ReservationsRepository extends AbstractRepository<InventoryReservationDocument> {
  constructor(
    @InjectModel(InventoryReservationModelName)
    Reservation: Model<InventoryReservationDocument>,
  ) {
    super(Reservation);
  }
}
