import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  StockAdjustmentDocument,
  StockAdjustmentModelName,
} from './entities/adjustment.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';

@Injectable()
export class AdjustmentsRepository extends AbstractRepository<StockAdjustmentDocument> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(StockAdjustmentModelName)
    StockAdjustment: Model<StockAdjustmentDocument>,
  ) {
    super(StockAdjustment);
  }
}
