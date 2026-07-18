import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import { MrvDocument, MrvModelName } from './entities/mrv.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class MrvsRepository extends AbstractRepository<MrvDocument> {
  constructor(@InjectModel(MrvModelName) Mrv: Model<MrvDocument>) {
    super(Mrv);
  }
}
