import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  QuotationDocument,
  QuotationModelName,
} from './entities/quotation.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class QuotationsRepository extends AbstractRepository<QuotationDocument> {
  constructor(
    @InjectModel(QuotationModelName) Quotation: Model<QuotationDocument>,
  ) {
    super(Quotation);
  }
}
