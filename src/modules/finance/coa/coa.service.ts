import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChartOfAccountModelName } from '../entities/coa.model';
import { JournalEntryModelName } from '../../billing/invoices/entities/billing.model';

@Injectable()
export class CoaService {
  private readonly logger = new Logger(CoaService.name);

  constructor(
    @InjectModel(ChartOfAccountModelName) private readonly coaModel: Model<any>,
    @InjectModel(JournalEntryModelName) private readonly journalEntryModel: Model<any>
  ) {}

  async findAll(query: { type?: string; isActive?: boolean; parentCode?: string; leafOnly?: boolean }) {
    const filter: any = {};
    if (query.type) filter.type = query.type;
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    if (query.parentCode !== undefined) {
      if (query.parentCode === 'null' || query.parentCode === '') {
        filter.parentCode = { $in: [null, ''] };
      } else {
        filter.parentCode = query.parentCode;
      }
    }

    let accounts = await this.coaModel.find(filter).lean();

    if (query.leafOnly) {
      const allParents = await this.coaModel.distinct('parentCode', { parentCode: { $ne: null } });
      accounts = accounts.filter(acc => !allParents.includes(acc.code));
    }

    // Build hierarchical tree when fetching top-level
    if (query.parentCode === 'null' || query.parentCode === '') {
      const allAccounts = await this.coaModel.find(filter.type ? { type: filter.type } : {}).lean();
      const buildTree = (parentCode: string | null): any[] => {
        return allAccounts
          .filter(a => (parentCode ? a.parentCode === parentCode : !a.parentCode))
          .map(a => ({
            ...a,
            children: buildTree(a.code)
          }));
      };
      accounts = buildTree(null);
    }

    return { data: accounts };
  }

  async findOne(id: string) {
    const account = await this.coaModel.findById(id).lean();
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async create(dto: {
    code: string; name: string; type: string; parentCode?: string;
    description?: string; isActive?: boolean; isReconciliation?: boolean; costCenterCode?: string;
  }, userId: string) {
    const existing = await this.coaModel.findOne({ code: dto.code });
    if (existing) throw new ConflictException(`Account code ${dto.code} already exists`);

    const account = await this.coaModel.create({
      ...dto,
      createdBy: userId,
      balance: 0,
    });
    return { message: 'Account created successfully', data: account };
  }

  async update(id: string, dto: { name?: string; description?: string; isActive?: boolean; type?: string; code?: string }) {
    const account = await this.coaModel.findById(id);
    if (!account) throw new NotFoundException('Account not found');

    if (dto.code || dto.type) {
      const hasEntries = await this.journalEntryModel.exists({ 'lines.accountCode': account.code });
      if (hasEntries) {
        if (dto.code && dto.code !== account.code)
          throw new BadRequestException('Cannot update code because this account has journal entries');
        if (dto.type && dto.type !== account.type)
          throw new BadRequestException('Cannot update type because this account has journal entries');
      }
    }

    const updated = await this.coaModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean();
    return { message: 'Account updated successfully', data: updated };
  }

  async remove(id: string) {
    const account = await this.coaModel.findById(id);
    if (!account) throw new NotFoundException('Account not found');

    const hasEntries = await this.journalEntryModel.exists({ 'lines.accountCode': account.code });
    if (hasEntries) throw new BadRequestException('Cannot delete account because it has journal entries');

    const hasChildren = await this.coaModel.exists({ parentCode: account.code });
    if (hasChildren) throw new BadRequestException('Cannot delete account because it has children accounts');

    await this.coaModel.findByIdAndDelete(id);
    return { message: 'Account deleted successfully' };
  }

  async seedDefaultAccounts() {
    // 35 accounts matching PetroFlow ERP chart of accounts
    const seedList = [
      // ── Assets ──────────────────────────────────────────────────────────────
      { code: '100000', name: 'Assets',                          type: 'Asset',     parentCode: null    },
      { code: '110000', name: 'Cash & Banks',                    type: 'Asset',     parentCode: '100000' },
      { code: '111000', name: 'Cash at Bank (USD)',               type: 'Asset',     parentCode: '110000' },
      { code: '112000', name: 'Cash at Bank (EGP)',               type: 'Asset',     parentCode: '110000' },
      { code: '113000', name: 'Petty Cash',                       type: 'Asset',     parentCode: '110000' },
      { code: '120000', name: 'Receivables',                      type: 'Asset',     parentCode: '100000' },
      { code: '121000', name: 'Accounts Receivable (A/R)',         type: 'Asset',     parentCode: '120000' },
      { code: '122000', name: 'Retentions Receivable',             type: 'Asset',     parentCode: '120000' },
      { code: '215000', name: 'VAT Receivable',                   type: 'Asset',     parentCode: '120000' },
      { code: '130000', name: 'Inventory Asset',                  type: 'Asset',     parentCode: '100000' },
      { code: '131000', name: 'Material Warehouse Stock',          type: 'Asset',     parentCode: '130000' },
      { code: '140000', name: 'Fixed Assets (Net)',                type: 'Asset',     parentCode: '100000' },
      { code: '141000', name: 'Equipment & Machinery',             type: 'Asset',     parentCode: '140000' },
      { code: '142000', name: 'Accumulated Depreciation',          type: 'Asset',     parentCode: '140000' },
      // ── Liabilities ─────────────────────────────────────────────────────────
      { code: '200000', name: 'Liabilities',                      type: 'Liability', parentCode: null    },
      { code: '210000', name: 'Payables & Accruals',               type: 'Liability', parentCode: '200000' },
      { code: '211000', name: 'Accounts Payable (A/P)',            type: 'Liability', parentCode: '210000' },
      { code: '212000', name: 'Accrued Salaries & Payroll',        type: 'Liability', parentCode: '210000' },
      { code: '213000', name: 'Withholding Tax Payable',           type: 'Liability', parentCode: '210000' },
      { code: '214000', name: 'VAT Payable',                      type: 'Liability', parentCode: '210000' },
      // ── Equity ──────────────────────────────────────────────────────────────
      { code: '300000', name: 'Equity',                           type: 'Equity',    parentCode: null    },
      { code: '310000', name: 'Share Capital',                     type: 'Equity',    parentCode: '300000' },
      { code: '320000', name: 'Retained Earnings',                 type: 'Equity',    parentCode: '300000' },
      // ── Revenue ─────────────────────────────────────────────────────────────
      { code: '400000', name: 'Revenue',                          type: 'Revenue',   parentCode: null    },
      { code: '410000', name: 'Drilling Services Revenue',         type: 'Revenue',   parentCode: '400000' },
      { code: '420000', name: 'Equipment Mobilization Revenue',    type: 'Revenue',   parentCode: '400000' },
      // ── Expenses ────────────────────────────────────────────────────────────
      { code: '500000', name: 'Expenses',                         type: 'Expense',   parentCode: null    },
      { code: '510000', name: 'Direct Cost of Services',           type: 'Expense',   parentCode: '500000' },
      { code: '511000', name: 'Project Material Consumed',         type: 'Expense',   parentCode: '510000' },
      { code: '512000', name: 'Project Labor Cost',                type: 'Expense',   parentCode: '510000' },
      { code: '513000', name: 'Rig Mobilization & Transfer Costs', type: 'Expense',   parentCode: '510000' },
      { code: '514000', name: 'Equipment Maintenance Expenses',    type: 'Expense',   parentCode: '510000' },
      { code: '515000', name: 'Depreciation Expense',              type: 'Expense',   parentCode: '510000' },
      { code: '520000', name: 'Indirect & Admin Expenses',         type: 'Expense',   parentCode: '500000' },
      { code: '521000', name: 'General & Administrative Costs',    type: 'Expense',   parentCode: '520000' },
    ];

    let created = 0;
    for (const item of seedList) {
      const exists = await this.coaModel.findOne({ code: item.code });
      if (!exists) {
        await this.coaModel.create({ ...item, balance: 0, isActive: true, isReconciliation: false });
        created++;
      }
    }

    return {
      data: {
        message: 'Default chart of accounts seeded successfully',
        count: created,
        total: seedList.length,
      }
    };
  }
}
