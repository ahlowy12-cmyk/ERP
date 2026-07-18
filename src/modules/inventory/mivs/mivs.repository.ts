import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import { MIVDocument, MIVModelName } from './entities/miv.model';

@Injectable()
export class MivsRepository extends AbstractRepository<MIVDocument> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(@InjectModel(MIVModelName) model: Model<MIVDocument>) {
    super(model);
  }
}
