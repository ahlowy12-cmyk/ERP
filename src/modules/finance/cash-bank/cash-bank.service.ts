import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BankAccountModelName, CashAccountModelName, BankReconciliationModelName } from '../entities/cash-bank.model';

@Injectable()
export class CashBankService {
  private readonly logger = new Logger(CashBankService.name);

  constructor(
    @InjectModel(BankAccountModelName) private bankAccountModel: Model<any>,
    @InjectModel(CashAccountModelName) private cashAccountModel: Model<any>,
    @InjectModel(BankReconciliationModelName) private bankReconciliationModel: Model<any>,
  ) {}

  async findAllBankAccounts() {
    const [bankAccounts, cashAccounts, pendingRecs] = await Promise.all([
      this.bankAccountModel.find().lean().exec(),
      this.cashAccountModel.find().lean().exec(),
      this.bankReconciliationModel.countDocuments({ status: 'Unreconciled' })
    ]);

    const bankBalance = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const cashBalance = cashAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalBalance = bankBalance + cashBalance;
    const activeAccounts = bankAccounts.filter(a => a.status !== 'Inactive').length
                         + cashAccounts.filter(a => a.status !== 'Inactive').length;

    return {
      data: bankAccounts,
      kpis: {
        totalBalance,
        bankBalance,
        cashBalance,
        activeAccounts,
        pendingRecsCount: pendingRecs,
      }
    };
  }

  async createBankAccount(dto: any, userId: string) {
    const newAccount = new this.bankAccountModel({
      ...dto,
      createdBy: userId
    });
    await newAccount.save();
    return { message: 'Bank account created successfully', data: newAccount };
  }

  async findAllCashAccounts() {
    const data = await this.cashAccountModel.find().exec();
    return { data };
  }

  async createCashAccount(dto: any, userId: string) {
    const newAccount = new this.cashAccountModel({
      ...dto,
      createdBy: userId
    });
    await newAccount.save();
    return { message: 'Cash account created successfully', data: newAccount };
  }

  async findAllReconciliations(query: { bankAccountId?: string }) {
    const filter: any = {};
    if (query.bankAccountId) filter.bankAccountId = query.bankAccountId;
    const data = await this.bankReconciliationModel.find(filter).exec();
    return { data };
  }

  async createReconciliation(dto: any, userId: string) {
    const bankAccount = await this.bankAccountModel.findById(dto.bankAccountId);
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const bookBalance = bankAccount.balance || 0;
    const statementBalance = dto.statementBalance || 0;
    const difference = Math.abs(bookBalance - statementBalance);

    const status = difference < 0.01 ? 'Reconciled' : 'Unreconciled';
    
    const recData: any = {
      ...dto,
      bookBalance,
      difference,
      status,
      createdBy: userId
    };

    if (status === 'Reconciled') {
      recData.reconciledDate = new Date();
      recData.reconciledBy = userId;
    }

    const reconciliation = new this.bankReconciliationModel(recData);
    await reconciliation.save();

    return {
      message: 'Reconciliation processed',
      data: reconciliation,
      status,
      difference
    };
  }

  async updateBankBalance(id: string, dto: { operation: 'credit'|'debit', amount: number, reference?: string }) {
    const account = await this.bankAccountModel.findById(id);
    if (!account) throw new NotFoundException('Bank account not found');

    if (dto.operation === 'debit' && account.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance for debit operation');
    }

    if (dto.operation === 'credit') {
      account.balance += dto.amount;
    } else if (dto.operation === 'debit') {
      account.balance -= dto.amount;
    }

    await account.save();
    return { message: 'Balance updated successfully', newBalance: account.balance };
  }
}
