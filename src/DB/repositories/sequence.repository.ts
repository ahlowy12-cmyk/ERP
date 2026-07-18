import { Injectable } from '@nestjs/common';
import { AbstractRepository } from './abstract.repository';
import { SequenceDocument, SequenceModelName } from '../models/sequence.model';
import { Model, QueryOptions } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SequenceRepository extends AbstractRepository<SequenceDocument> {
  constructor(
    @InjectModel(SequenceModelName) Sequence: Model<SequenceDocument>,
  ) {
    super(Sequence);
  }

  // دالة مخصصة لزيادة العداد بشكل آمن (Atomic Increment)
  async getNextSequenceValue(
    key: string,
    options?: QueryOptions,
  ): Promise<number> {
    const sequence = await this.findOneAndUpdate(
      { key },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: 'after', ...options },
    );
    return sequence ? sequence.value : 1;
  }
}
