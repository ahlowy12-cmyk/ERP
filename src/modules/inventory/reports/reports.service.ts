import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryItemRepository } from 'src/DB/repositories/inventory-item.repository';
import { ItemLedgerRepository } from './item-ledger.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly _InventoryItemRepository: InventoryItemRepository,
    private readonly _ItemLedgerRepository: ItemLedgerRepository,
  ) {}

  // 1. لوحة تحكم المخزون (KPIs)
  async getSummary() {
    // 💡 يمكن استبدال هذه بـ Aggregation Query واحدة للحصول على أداء أفضل
    const items = await this._InventoryItemRepository.findAll({
      paginate: { limit: 100000 },
    }); // للحصر المبدئي
    const data = items || [];

    const totalItems = data.length;
    const totalValue = data.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
    const lowStockCount = data.filter(
      (item) => item.status === 'Low Stock',
    ).length;
    const outOfStockCount = data.filter(
      (item) => item.status === 'Out of Stock',
    ).length;

    return {
      data: {
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount,
        pendingMRVs: 0, // تُحسب من MrvRepository
        pendingMIVs: 0, // تُحسب من MivRepository
      },
    };
  }

  // 2. تقرير تقييم المخزون
  async getValuation() {
    const result = await this._InventoryItemRepository.findAll({
      select: 'itemCode itemName quantity unitPrice',
      paginate: { limit: 1000 }, // جلب أول 1000 صنف
    });

    const valuation = result.map((item: any) => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalValue: item.quantity * item.unitPrice,
    }));

    return { data: valuation };
  }

  // 3. جلب دفتر الصنف المحدد (Item Ledger)
  async getItemLedger(itemCode: string) {
    const item = await this._InventoryItemRepository.findOne({
      filter: { itemCode },
    });
    if (!item) throw new NotFoundException('Item not found');

    const ledger = await this._ItemLedgerRepository.findAll({
      filter: { itemCode },
      sort: { date: 1 }, // ترتيب تصاعدي زمني
    });

    return {
      data: {
        itemCode: item.itemCode,
        currentBalance: item.quantity,
        ledger: ledger,
      },
    };
  }
}
