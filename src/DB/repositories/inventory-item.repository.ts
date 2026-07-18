import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from './abstract.repository';
import {
  InventoryItemDocument,
  InventoryItemModelName,
} from 'src/DB/models/inventory-item.model';

@Injectable()
export class InventoryItemRepository extends AbstractRepository<InventoryItemDocument> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(InventoryItemModelName) model: Model<InventoryItemDocument>,
  ) {
    super(model);
  }
}
