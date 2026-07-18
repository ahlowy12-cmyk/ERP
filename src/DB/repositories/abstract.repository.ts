import { Model, Document } from 'mongoose';
import type { QueryFilter, UpdateQuery, QueryOptions } from 'mongoose';
import { Logger } from '@nestjs/common';

export abstract class AbstractRepository<TDocument extends Document> {
  protected readonly logger = new Logger(this.constructor.name);

  // جعل الموديل public ليكون متاحاً لبعض الخدمات التي تحتاجه مباشرة
  constructor(public readonly model: Model<TDocument>) {}

  async create(data: any, options?: QueryOptions): Promise<TDocument> {
    const createdDocument = new this.model(data);
    return (await createdDocument.save(options)) as TDocument;
  }

  async findOne(
    filterQuery: QueryFilter<TDocument>,
    populate?: any,
  ): Promise<TDocument | null> {
    const query = this.model.findOne(filterQuery);
    if (populate) query.populate(populate);
    return query.exec();
  }

  async findAll(
    options: {
      filter?: QueryFilter<TDocument>;
      populate?: any;
      select?: string;
      sort?: any;
      skip?: number;
      limit?: number;
      paginate?: { page?: number; limit: number };
      session?: any;
    } = {},
  ): Promise<TDocument[]> {
    const filter = options.filter || {};
    const query = this.model.find(filter);

    if (options.session) query.session(options.session);
    if (options.select) query.select(options.select);
    if (options.populate) query.populate(options.populate);
    if (options.sort) query.sort(options.sort);

    // دعم الـ Pagination
    if (options.paginate) {
      const page = options.paginate.page ?? 1;
      const skip = (page - 1) * options.paginate.limit;
      query.skip(skip).limit(options.paginate.limit);
    } else {
      if (options.skip) query.skip(options.skip);
      if (options.limit) query.limit(options.limit);
    }

    return query.exec();
  }

  async findOneAndUpdate(
    filterQuery: QueryFilter<TDocument>,
    updateData: UpdateQuery<TDocument>,
    options: QueryOptions = {},
  ): Promise<TDocument | null> {
    return this.model
      .findOneAndUpdate(filterQuery, updateData, { new: true, ...options })
      .exec();
  }

  async update(
    filterQuery: QueryFilter<TDocument>,
    updateData: UpdateQuery<TDocument>,
    options: QueryOptions = {},
  ): Promise<any> {
    return this.model.updateOne(filterQuery, updateData, options as any).exec();
  }

  async delete(filterQuery: QueryFilter<TDocument>): Promise<any> {
    return this.model.deleteOne(filterQuery).exec();
  }

  async deleteMany(
    filterQuery: QueryFilter<TDocument>,
    options?: QueryOptions,
  ): Promise<any> {
    return this.model.deleteMany(filterQuery, options as any).exec();
  }

  async softDelete(
    filterQuery: QueryFilter<TDocument>,
    options?: QueryOptions,
  ): Promise<any> {
    return this.model
      .updateMany(
        filterQuery,
        { $set: { status: 'Inactive' } } as any,
        options as any,
      )
      .exec();
  }
}
