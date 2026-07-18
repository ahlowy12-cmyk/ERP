import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import { RFQDocument, RFQModelName } from './entities/rfq.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';

@Injectable()
export class RfqsRepository extends AbstractRepository<RFQDocument> {
  protected readonly logger = new Logger(this.constructor.name); // 👈 أضف هذا السطر
  constructor(@InjectModel(RFQModelName) RFQ: Model<RFQDocument>) {
    super(RFQ);
  }
}
