import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import { NcrDocument, NcrModelName } from './entities/ncr.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class NcrsRepository extends AbstractRepository<NcrDocument> {
  constructor(@InjectModel(NcrModelName) Ncr: Model<NcrDocument>) {
    super(Ncr);
  }
}
