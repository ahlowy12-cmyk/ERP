import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from 'src/DB/repositories/abstract.repository';
import {
  AuditLogDocument,
  AuditLogModelName,
} from './entities/audit-log.model';

@Injectable()
export class AuditLogsRepository extends AbstractRepository<AuditLogDocument> {
  // تفعيل مسجل الأحداث (Logger) الخاص بهذا المستودع لتسهيل تتبع الأخطاء
  protected readonly logger = new Logger(AuditLogsRepository.name);

  constructor(
    @InjectModel(AuditLogModelName) auditLogModel: Model<AuditLogDocument>,
  ) {
    // تمرير الموديل إلى الأب (AbstractRepository) لتفعيل الدوال الأساسية
    super(auditLogModel);
  }

  // يمكنك هنا إضافة دوال مخصصة جداً لا توجد في الـ Abstract
  // مثال: جلب نشاطات مستخدم معين مع ترتيب زمني تنازلي
  async findUserActivities(userId: string, limit: number = 20) {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
