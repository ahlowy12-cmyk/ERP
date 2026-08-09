import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { EquipmentModelName } from '../../assets/equipment/entities/equipment.model';
import { JournalEntryModelName } from '../../billing/invoices/entities/billing.model';
import { ChartOfAccountModelName } from '../entities/coa.model';

@Injectable()
export class DepreciationService {
  private readonly logger = new Logger(DepreciationService.name);

  private readonly USEFUL_LIFE: Record<string, number> = {
    'Rig': 15, 'Generator': 10, 'Crane': 12, 'Truck': 7,
    'Pump': 8, 'Compressor': 10, 'Heavy Equipment': 10, 'Safety Equipment': 5,
  };
  private readonly SALVAGE_RATE = 0.05;

  constructor(
    @InjectModel(EquipmentModelName) private readonly equipmentModel: Model<any>,
    @InjectModel(JournalEntryModelName) private readonly journalEntryModel: Model<any>,
    @InjectModel(ChartOfAccountModelName) private readonly coaModel: Model<any>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private calcDepreciation(asset: any, asOfDate: Date) {
    const usefulLifeYears = this.USEFUL_LIFE[asset.category] || 10;
    const purchaseCost    = asset.purchaseCost || 0;
    const salvageValue    = purchaseCost * this.SALVAGE_RATE;
    const depreciableBase = purchaseCost - salvageValue;
    const monthlyDepreciation = depreciableBase / (usefulLifeYears * 12);
    const annualDepreciation  = monthlyDepreciation * 12;

    const purchaseDate  = new Date(asset.purchaseDate || Date.now());
    let monthsElapsed   = (asOfDate.getFullYear() - purchaseDate.getFullYear()) * 12
                        + (asOfDate.getMonth() - purchaseDate.getMonth());
    if (monthsElapsed < 0) monthsElapsed = 0;

    const accumulatedDepreciation = Math.min(monthlyDepreciation * monthsElapsed, depreciableBase);
    const netBookValue            = purchaseCost - accumulatedDepreciation;
    const depreciationPercent     = purchaseCost > 0
      ? Math.round((accumulatedDepreciation / purchaseCost) * 1000) / 10 : 0;
    const fullyDepreciated        = accumulatedDepreciation >= depreciableBase;

    return { usefulLifeYears, salvageValue, annualDepreciation, monthlyDepreciation,
             accumulatedDepreciation, netBookValue, monthsElapsed, depreciationPercent, fullyDepreciated };
  }

  async getSchedule(query: { asOfDate?: string; search?: string }) {
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();
    const filter: any = { status: { $ne: 'Out Of Service' } };
    if (query.search) {
      filter.$or = [
        { equipmentName: new RegExp(query.search, 'i') },
        { assetNumber:   new RegExp(query.search, 'i') },
        { category:      new RegExp(query.search, 'i') },
        { name:          new RegExp(query.search, 'i') },
        { code:          new RegExp(query.search, 'i') },
      ];
    }

    const assets = await this.equipmentModel.find(filter).lean();

    let totalCost        = 0;
    let totalAccumulated = 0;
    let totalNBV         = 0;
    let totalMonthly     = 0;
    let totalAnnual      = 0;
    let activeAssets     = 0;
    let fullyDeprCount   = 0;

    const data = assets.map(asset => {
      const dep = this.calcDepreciation(asset, asOfDate);
      totalCost        += asset.purchaseCost || 0;
      totalAccumulated += dep.accumulatedDepreciation;
      totalNBV         += dep.netBookValue;
      if (!dep.fullyDepreciated) {
        totalMonthly += dep.monthlyDepreciation;
        totalAnnual  += dep.annualDepreciation;
        activeAssets++;
      } else {
        fullyDeprCount++;
      }
      return { asset, ...dep };
    });

    return {
      data,
      totals: {
        totalCost,
        totalAccumulated,
        totalNBV,
        totalAnnualCharge:   totalAnnual,
        totalMonthlyCharge:  totalMonthly,
        activeAssets,
        fullyDepreciatedCount: fullyDeprCount,
      },
    };
  }

  async getAssetSchedule(assetId: string) {
    const asset = await this.equipmentModel.findById(assetId).lean();
    if (!asset) throw new BadRequestException('Asset not found');

    const purchaseDate = new Date(asset.purchaseDate || Date.now());
    const today        = new Date();
    const schedule: any[] = [];

    let currentDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
    while (currentDate <= today) {
      const dep = this.calcDepreciation(asset, currentDate);
      schedule.push({
        period:     `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
        openingNBV: dep.netBookValue + (dep.fullyDepreciated ? 0 : dep.monthlyDepreciation),
        depreciation: dep.fullyDepreciated ? 0 : dep.monthlyDepreciation,
        closingNBV:  dep.netBookValue,
        cumulative:  dep.accumulatedDepreciation,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return { asset, schedule };
  }

  private async nextJENumber(session?: any): Promise<string> {
    const year   = new Date().getFullYear();
    const prefix = `JE-${year}-`;
    for (let i = 0; i < 5; i++) {
      const last = await this.journalEntryModel.findOne(
        { journalNumber: { $regex: `^${prefix}` } },
        {},
        { sort: { journalNumber: -1 }, session }
      );
      let nextNum = 1;
      if (last?.journalNumber) {
        const parts = last.journalNumber.split('-');
        if (parts.length === 3) nextNum = parseInt(parts[2], 10) + 1;
      }
      const journalNumber = `${prefix}${nextNum.toString().padStart(4, '0')}`;
      const exists = await this.journalEntryModel.exists({ journalNumber }).session?.(session);
      if (!exists) return journalNumber;
    }
    throw new Error('Could not generate unique JE number');
  }

  async postMonthly(dto: { postingMonth: string }, userId: string) {
    const { postingMonth } = dto;
    const reference = `DEPR-${postingMonth}`;

    // ── Guard: prevent double-posting ────────────────────────────────────
    const existing = await this.journalEntryModel.findOne({ reference });
    if (existing) {
      throw new BadRequestException(`Depreciation for ${postingMonth} already posted`);
    }

    const [year, month] = postingMonth.split('-');
    const asOfDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 28);

    const assets = await this.equipmentModel.find({ status: { $ne: 'Out Of Service' } }).lean();

    let totalCharge  = 0;
    let assetsPosted = 0;
    for (const asset of assets) {
      const dep = this.calcDepreciation(asset, asOfDate);
      if (!dep.fullyDepreciated) {
        totalCharge += dep.monthlyDepreciation;
        assetsPosted++;
      }
    }

    if (totalCharge <= 0) throw new BadRequestException('No depreciation charge to post');

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const journalNumber = await this.nextJENumber(session);

      // ── GL Entry ────────────────────────────────────────────────────────
      // DR 515000 (Depreciation Expense)  = totalCharge
      // CR 142000 (Accumulated Depreciation) = totalCharge
      const glLines = [
        { accountCode: '515000', accountName: 'Depreciation Expense',       type: 'Debit',  amount: totalCharge },
        { accountCode: '142000', accountName: 'Accumulated Depreciation',    type: 'Credit', amount: totalCharge },
      ];

      const glEntry = new this.journalEntryModel({
        journalNumber,
        reference,
        sourceType: 'Depreciation',
        date: new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1),
        description: `Monthly depreciation — ${postingMonth}`,
        status: 'Posted',
        totalDebit:  totalCharge,
        totalCredit: totalCharge,
        lines: glLines,
        createdBy: userId,
      });
      await glEntry.save({ session });

      await this.coaModel.updateOne({ code: '515000' }, { $inc: { balance: totalCharge  } }, { session });
      await this.coaModel.updateOne({ code: '142000' }, { $inc: { balance: -totalCharge } }, { session });

      await session.commitTransaction();
      return {
        data: {
          message:      'Monthly depreciation posted successfully',
          postingMonth,
          assetsCount:  assetsPosted,
          totalCharge,
          glEntry,
        }
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
