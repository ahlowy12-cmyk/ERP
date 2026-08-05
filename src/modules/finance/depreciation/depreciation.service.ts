import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { EquipmentModelName } from '../../assets/equipment/entities/equipment.model';
import { JournalEntryModelName } from '../../billing/invoices/entities/billing.model';
import { ChartOfAccountModelName } from '../entities/coa.model';

@Injectable()
export class DepreciationService {
  private readonly logger = new Logger(DepreciationService.name);
  
  private readonly USEFUL_LIFE: Record<string, number> = {
    'Rig': 15, 'Generator': 10, 'Crane': 12, 'Truck': 7,
    'Pump': 8, 'Compressor': 10, 'Heavy Equipment': 10,
    'Safety Equipment': 5,
  };
  private readonly SALVAGE_RATE = 0.05; // 5%

  constructor(
    @InjectModel(EquipmentModelName) private readonly equipmentModel: Model<any>,
    @InjectModel(JournalEntryModelName) private readonly journalEntryModel: Model<any>,
    @InjectModel(ChartOfAccountModelName) private readonly coaModel: Model<any>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private calcDepreciation(asset: any, asOfDate: Date) {
    const usefulLifeYears = this.USEFUL_LIFE[asset.category] || 10;
    const purchaseCost = asset.purchaseCost || 0;
    const salvageValue = purchaseCost * this.SALVAGE_RATE;
    const depreciableBase = purchaseCost - salvageValue;
    const monthlyDepreciation = depreciableBase / (usefulLifeYears * 12);
    const annualDepreciation = monthlyDepreciation * 12;

    const purchaseDate = new Date(asset.purchaseDate || Date.now());
    
    let monthsElapsed = (asOfDate.getFullYear() - purchaseDate.getFullYear()) * 12 
                        + (asOfDate.getMonth() - purchaseDate.getMonth());
    if (monthsElapsed < 0) monthsElapsed = 0;

    let accumulatedDepreciation = monthlyDepreciation * monthsElapsed;
    if (accumulatedDepreciation > depreciableBase) {
      accumulatedDepreciation = depreciableBase;
    }

    const netBookValue = purchaseCost - accumulatedDepreciation;
    const depreciationPercent = purchaseCost > 0 ? Math.round((accumulatedDepreciation / purchaseCost) * 1000) / 10 : 0;
    const fullyDepreciated = accumulatedDepreciation >= depreciableBase;

    return {
      usefulLifeYears,
      salvageValue,
      annualDepreciation,
      monthlyDepreciation,
      accumulatedDepreciation,
      netBookValue,
      monthsElapsed,
      depreciationPercent,
      fullyDepreciated
    };
  }

  async getSchedule(query: { asOfDate?: string; search?: string }) {
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();
    const filter: any = { status: { $ne: 'Out Of Service' } };
    
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { code: new RegExp(query.search, 'i') },
      ];
    }

    const assets = await this.equipmentModel.find(filter).lean();

    let totals = {
      purchaseCost: 0,
      accumulatedDepreciation: 0,
      netBookValue: 0,
      monthlyDepreciation: 0
    };

    const data = assets.map(asset => {
      const dep = this.calcDepreciation(asset, asOfDate);
      
      totals.purchaseCost += (asset.purchaseCost || 0);
      totals.accumulatedDepreciation += dep.accumulatedDepreciation;
      totals.netBookValue += dep.netBookValue;
      if (!dep.fullyDepreciated) {
        totals.monthlyDepreciation += dep.monthlyDepreciation;
      }

      return {
        asset,
        ...dep
      };
    });

    return { data, totals };
  }

  async getAssetSchedule(assetId: string) {
    const asset = await this.equipmentModel.findById(assetId).lean();
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const purchaseDate = new Date(asset.purchaseDate || Date.now());
    const today = new Date();
    const schedule: any[] = [];
    
    let currentDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
    
    while (currentDate <= today) {
      const dep = this.calcDepreciation(asset, currentDate);
      const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      schedule.push({
        period,
        openingNBV: dep.netBookValue + (dep.fullyDepreciated ? 0 : dep.monthlyDepreciation), 
        depreciation: dep.fullyDepreciated ? 0 : dep.monthlyDepreciation,
        closingNBV: dep.netBookValue,
        cumulative: dep.accumulatedDepreciation
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return { asset, schedule };
  }

  private async getNextJENumber(): Promise<string> {
    const prefix = 'JE-';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const lastEntry = await this.journalEntryModel.findOne({ entryNumber: new RegExp(`^${prefix}`) })
                                                      .sort({ entryNumber: -1 });
        let nextSeq = 1;
        if (lastEntry && lastEntry.entryNumber) {
          const parts = lastEntry.entryNumber.split('-');
          if (parts.length > 1) {
            nextSeq = parseInt(parts[1], 10) + 1;
          }
        }
        return `${prefix}${String(nextSeq).padStart(6, '0')}`;
      } catch (e) {
        if (attempt === 2) throw e;
      }
    }
    return `${prefix}000001`;
  }

  async postMonthly(dto: { postingMonth: string }, userId: string) {
    const { postingMonth } = dto;
    const reference = `DEPR-${postingMonth}`;

    const existing = await this.journalEntryModel.findOne({ reference });
    if (existing) {
      throw new BadRequestException(`Depreciation already posted for month ${postingMonth}`);
    }

    const filter = { status: { $ne: 'Out Of Service' } };
    const assets = await this.equipmentModel.find(filter).lean();

    const [year, month] = postingMonth.split('-');
    const asOfDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 28); 

    let totalCharge = 0;
    for (const asset of assets) {
      const dep = this.calcDepreciation(asset, asOfDate);
      if (!dep.fullyDepreciated) {
        totalCharge += dep.monthlyDepreciation;
      }
    }

    if (totalCharge <= 0) {
      throw new BadRequestException('No depreciation charge to post');
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const entryNumber = await this.getNextJENumber();

      const newJE = new this.journalEntryModel({
        entryNumber,
        reference,
        sourceType: 'Depreciation',
        date: new Date(),
        status: 'Posted',
        lines: [
          { accountCode: '514000', description: `Depreciation Expense ${postingMonth}`, debit: totalCharge, credit: 0 },
          { accountCode: '130000', description: `Accumulated Depreciation ${postingMonth}`, debit: 0, credit: totalCharge }
        ],
        createdBy: userId
      });

      await newJE.save({ session });

      await this.coaModel.updateOne({ code: '514000' }, { $inc: { balance: totalCharge } }, { session });
      await this.coaModel.updateOne({ code: '130000' }, { $inc: { balance: -totalCharge } }, { session });

      await session.commitTransaction();
      return { 
        message: 'Depreciation posted successfully', 
        postingMonth, 
        assetsCount: assets.length, 
        totalCharge, 
        glEntry: newJE 
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error posting depreciation', error);
      throw new BadRequestException('Failed to post depreciation');
    } finally {
      session.endSession();
    }
  }
}
