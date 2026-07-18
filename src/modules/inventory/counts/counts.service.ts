import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CountsRepository } from './counts.repository';
import { NumberingService } from 'src/shared/services/numbering.service';
import { CreateCountDto } from './dto/create-count.dto';

@Injectable()
export class CountsService {
  constructor(
    private readonly _CountsRepository: CountsRepository,
    private readonly _NumberingService: NumberingService,
  ) {}

  async createCount(data: CreateCountDto) {
    // 💡 Placeholder for NumberingService: CNT-YYYY-NNN
    const seqNum = await this._NumberingService.generateMIVNumber();
    const countNumber = seqNum.replace('MIV', 'CNT');

    // حساب الفارق لكل صنف بشكل آمن
    const processedItems = data.items.map((item: any) => ({
      ...item,
      variance: item.countedQuantity - item.systemQuantity,
    }));

    const stockCount = await this._CountsRepository.create({
      ...data,
      countNumber,
      items: processedItems,
      status: 'Draft',
    });

    return {
      message: 'Stock count session created successfully',
      data: stockCount,
    };
  }

  // إنهاء جلسة الجرد
  async completeCount(countId: string) {
    const stockCount = await this._CountsRepository.findOneAndUpdate(
      { _id: countId, status: 'Draft' },
      { status: 'Completed' },
    );

    if (!stockCount) {
      throw new BadRequestException(
        'Count session not found or already completed',
      );
    }

    // ملاحظة معمارية: اكتمال الجرد لا يعدل المخزون مباشرة، بل يُبرز الفروقات للإدارة.
    // التعديل الفعلي يتم عن طريق موديول "Stock Adjustments" الذي برمجناه مسبقاً.

    return { message: 'Stock count session completed', data: stockCount };
  }
}
