import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RfqsRepository } from 'src/modules/procurement/rfqs/rfqs.repository';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly _RfqsRepository: RfqsRepository) {}

  // تعمل هذه المهمة كل يوم في منتصف الليل
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredRfqs() {
    this.logger.log('Running Cron Job: Checking for expired RFQs...');

    const now = new Date();
    // البحث عن الـ RFQs المفتوحة التي تخطت الموعد النهائي
    const expiredRfqs = await this._RfqsRepository.model.updateMany(
      {
        deadlineDate: { $lt: now },
        status: { $in: ['Published', 'Partially Responded'] },
      },
      { $set: { status: 'Closed' } },
    );

    if (expiredRfqs.modifiedCount > 0) {
      this.logger.log(
        `Successfully closed ${expiredRfqs.modifiedCount} expired RFQs.`,
      );
    }
  }
}
