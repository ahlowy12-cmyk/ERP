import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  PurchaseOrderDocument,
  PurchaseOrderModelName,
} from './entities/purchase-order.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PurchaseOrdersRepository extends AbstractRepository<PurchaseOrderDocument> {
  constructor(
    @InjectModel(PurchaseOrderModelName)
    PurchaseOrder: Model<PurchaseOrderDocument>,
  ) {
    super(PurchaseOrder);
  }
}
