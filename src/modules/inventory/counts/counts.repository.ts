import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  StockCountDocument,
  StockCountModelName,
} from './entities/stock-count.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CountsRepository extends AbstractRepository<StockCountDocument> {
  constructor(
    @InjectModel(StockCountModelName) StockCount: Model<StockCountDocument>,
  ) {
    super(StockCount);
  }
}
