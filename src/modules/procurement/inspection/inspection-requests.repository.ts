import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  InspectionRequestDocument,
  InspectionRequestModelName,
} from './entities/inspection-request.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class InspectionRequestsRepository extends AbstractRepository<InspectionRequestDocument> {
  constructor(
    @InjectModel(InspectionRequestModelName)
    InspectionRequest: Model<InspectionRequestDocument>,
  ) {
    super(InspectionRequest);
  }
}
