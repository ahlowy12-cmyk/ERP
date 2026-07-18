import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLogDocument, AuditLogModelName } from './entities/audit-log.model';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLogModelName)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(data: {
    userId: string;
    action: string;
    entity: string;
    entityId: any;
    details?: string;
    oldValue?: any;
    newValue?: any;
  }) {
    const logEntry = new this.auditLogModel({
      userId: new Types.ObjectId(data.userId),
      action: data.action,
      entity: data.entity,
      entityId: new Types.ObjectId(data.entityId),
      details: data.details,
      oldValue: data.oldValue,
      newValue: data.newValue,
    });
    return logEntry.save();
  }
}
