import { Injectable } from '@nestjs/common';
import { AbstractRepository } from './abstract.repository';
import {
  WarehouseDocument,
  WarehouseModelName,
} from '../models/warehouse.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class WarehouseRepository extends AbstractRepository<WarehouseDocument> {
  constructor(
    @InjectModel(WarehouseModelName) Warehouse: Model<WarehouseDocument>,
  ) {
    super(Warehouse);
  }
}
