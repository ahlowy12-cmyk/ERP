import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  PurchaseRequestDocument,
  PurchaseRequestModelName,
} from './entities/purchase-request.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PurchaseRequestRepository extends AbstractRepository<PurchaseRequestDocument> {
  constructor(
    @InjectModel(PurchaseRequestModelName)
    PurchaseRequest: Model<PurchaseRequestDocument>,
  ) {
    super(PurchaseRequest);
  }
}
