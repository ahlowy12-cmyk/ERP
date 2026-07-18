import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import { TransferDocument, TransferModelName } from './entities/transfer.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TransfersRepository extends AbstractRepository<TransferDocument> {
  protected readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectModel(TransferModelName) Transfer: Model<TransferDocument>,
  ) {
    super(Transfer);
  }
}
