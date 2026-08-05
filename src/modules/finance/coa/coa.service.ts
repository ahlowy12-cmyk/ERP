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

    if (query.parentCode === 'null' || query.parentCode === '') {
      const allAccounts = await this.coaModel.find(filter.type ? { type: filter.type } : {}).lean();
      const buildTree = (parentId: string | null | undefined): any[] => {
        return allAccounts
          .filter(a => (parentId ? a.parentCode === parentId : !a.parentCode))
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

  async create(dto: { code: string; name: string; type: string; parentCode?: string; description?: string; isActive?: boolean; isReconciliation?: boolean; costCenterCode?: string }, userId: string) {
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
      const hasEntries = await this.journalEntryModel.exists({
        'lines.accountCode': account.code
      });
      if (hasEntries) {
        if (dto.code && dto.code !== account.code) {
           throw new BadRequestException('Cannot update code because this account has journal entries');
        }
        if (dto.type && dto.type !== account.type) {
           throw new BadRequestException('Cannot update type because this account has journal entries');
        }
      }
    }

    const updated = await this.coaModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean();
    return { message: 'Account updated successfully', data: updated };
  }

  async remove(id: string) {
    const account = await this.coaModel.findById(id);
    if (!account) throw new NotFoundException('Account not found');

    const hasEntries = await this.journalEntryModel.exists({
      'lines.accountCode': account.code
    });
    if (hasEntries) {
      throw new BadRequestException('Cannot delete account because it has journal entries');
    }

    const hasChildren = await this.coaModel.exists({ parentCode: account.code });
    if (hasChildren) {
      throw new BadRequestException('Cannot delete account because it has children accounts');
    }

    await this.coaModel.findByIdAndDelete(id);
    return { message: 'Account deleted successfully' };
  }

  async seedDefaultAccounts() {
    const seedList = [
      { code: '110000', name: 'Cash & Bank', type: 'Asset', isActive: true },
      { code: '111000', name: 'Cash / Bank Account', type: 'Asset', parentCode: '110000', isActive: true },
      { code: '121000', name: 'Accounts Receivable A/R', type: 'Asset', isActive: true },
      { code: '130000', name: 'Accumulated Depreciation', type: 'Asset', isActive: true },
      { code: '211000', name: 'Accounts Payable A/P', type: 'Liability', isActive: true },
      { code: '212000', name: 'Retention Receivable', type: 'Asset', isActive: true },
      { code: '213000', name: 'Withholding Tax Receivable', type: 'Asset', isActive: true },
      { code: '214000', name: 'VAT Payable', type: 'Liability', isActive: true },
      { code: '311000', name: 'VAT Payable', type: 'Liability', isActive: true },
      { code: '411000', name: 'Drilling & Services Revenue', type: 'Revenue', isActive: true },
      { code: '514000', name: 'Equipment Maintenance Expenses', type: 'Expense', isActive: true },
      { code: '521000', name: 'General & Administrative Costs', type: 'Expense', isActive: true },
    ];

    for (const item of seedList) {
      const exists = await this.coaModel.findOne({ code: item.code });
      if (!exists) {
        await this.coaModel.create({
            ...item,
            balance: 0,
        });
      }
    }
    
    return { message: 'Default accounts seeded successfully' };
  }
}
