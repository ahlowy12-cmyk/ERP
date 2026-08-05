import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChartOfAccountModelName } from '../entities/coa.model';
import { JournalEntryModelName } from '../../billing/invoices/entities/billing.model';

@Injectable()
export class StatementsService {
  private readonly logger = new Logger(StatementsService.name);

  constructor(
    @InjectModel(ChartOfAccountModelName) private readonly coaModel: Model<any>,
    @InjectModel(JournalEntryModelName) private readonly journalEntryModel: Model<any>,
  ) {}

  async getTrialBalance(query: { asOfDate?: string }) {
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();
    const activeAccounts = await this.coaModel.find({ isActive: true }).sort({ code: 1 }).lean();

    // Build parent codes set for isParent detection
    const parentCodes = new Set(
      activeAccounts.filter(a => a.parentCode).map(a => a.parentCode)
    );

    const entries = await this.journalEntryModel.find({
      status: 'Posted',
      date: { $lte: asOfDate },
    }).lean();

    const accountTotals: Record<string, { debit: number; credit: number }> = {};
    for (const entry of entries) {
      for (const line of (entry.lines as any[]) || []) {
        if (!accountTotals[line.accountCode]) {
          accountTotals[line.accountCode] = { debit: 0, credit: 0 };
        }
        if (line.type === 'Debit') {
          accountTotals[line.accountCode].debit += line.amount || 0;
        } else {
          accountTotals[line.accountCode].credit += line.amount || 0;
        }
      }
    }

    const data: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const acc of activeAccounts) {
      const totals = accountTotals[acc.code] || { debit: 0, credit: 0 };
      const net = totals.debit - totals.credit;

      let finalDebit = 0;
      let finalCredit = 0;
      if (net > 0) {
        finalDebit = net;
        totalDebit += finalDebit;
      } else if (net < 0) {
        finalCredit = Math.abs(net);
        totalCredit += finalCredit;
      }

      // Compute level from parentCode chain
      let level = 0;
      let parent = acc.parentCode;
      while (parent) {
        level++;
        const parentAcc = activeAccounts.find(a => a.code === parent);
        parent = parentAcc?.parentCode || null;
        if (level > 10) break; // guard against circular
      }

      data.push({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: finalDebit,
        credit: finalCredit,
        isParent: parentCodes.has(acc.code),
        level,
      });
    }

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    return { data, totals: { totalDebit, totalCredit }, isBalanced };
  }

  async getIncomeStatement(query: { periodStart?: string; asOfDate?: string }) {
    const periodStart = query.periodStart ? new Date(query.periodStart) : new Date(new Date().getFullYear(), 0, 1);
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();

    const activeAccounts = await this.coaModel.find({ isActive: true }).lean();
    const accountTypeMap = activeAccounts.reduce((acc, a) => {
      acc[a.code] = a.type;
      return acc;
    }, {} as Record<string, string>);

    const entries = await this.journalEntryModel.find({
      status: 'Posted',
      date: { $gte: periodStart, $lte: asOfDate },
    }).lean();

    const revenueItems: Record<string, number> = {};
    const expenseItems: Record<string, number> = {};

    for (const entry of entries) {
      for (const line of (entry.lines as any[]) || []) {
        const accType = accountTypeMap[line.accountCode];
        const amount = line.amount || 0;
        if (accType === 'Revenue') {
          const net = line.type === 'Credit' ? amount : -amount;
          revenueItems[line.accountCode] = (revenueItems[line.accountCode] || 0) + net;
        } else if (accType === 'Expense') {
          const net = line.type === 'Debit' ? amount : -amount;
          expenseItems[line.accountCode] = (expenseItems[line.accountCode] || 0) + net;
        }
      }
    }

    const revenue = Object.values(revenueItems).reduce((s, v) => s + v, 0);
    const totalExpenses = Object.values(expenseItems).reduce((s, v) => s + v, 0);
    const grossProfit = revenue;
    const netProfit = grossProfit - totalExpenses;

    const data = [
      { label: 'Revenue', amount: revenue, isSubtotal: false },
      { label: 'Cost of Revenue', amount: 0, isNegative: true },
      { label: 'Gross Profit', amount: grossProfit, isSubtotal: true },
      { label: 'G&A Expenses', amount: -totalExpenses, isNegative: true },
      { label: 'Net Profit', amount: netProfit, isTotal: true },
    ];

    return { data };
  }

  async getBalanceSheet(query: { asOfDate?: string }) {
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();
    const activeAccounts = await this.coaModel.find({ isActive: true }).sort({ code: 1 }).lean();

    const entries = await this.journalEntryModel.find({
      status: 'Posted',
      date: { $lte: asOfDate },
    }).lean();

    // Compute net balance per account using type+amount format
    const accountBalances: Record<string, number> = {};
    for (const entry of entries) {
      for (const line of (entry.lines as any[]) || []) {
        if (!accountBalances[line.accountCode]) accountBalances[line.accountCode] = 0;
        // For assets/expenses: Debit increases, Credit decreases
        accountBalances[line.accountCode] += line.type === 'Debit' ? (line.amount || 0) : -(line.amount || 0);
      }
    }

    const currentAssetItems: any[] = [];
    const nonCurrentAssetItems: any[] = [];
    const currentLiabilityItems: any[] = [];
    const nonCurrentLiabilityItems: any[] = [];

    let equityTotal = 0;

    for (const acc of activeAccounts) {
      const rawBalance = accountBalances[acc.code] || 0;
      if (acc.type === 'Asset') {
        const bal = rawBalance; // positive = debit normal balance
        const item = { code: acc.code, name: acc.name, amount: bal };
        // codes starting with 1 = current, others = non-current
        if (acc.code.startsWith('1')) currentAssetItems.push(item);
        else nonCurrentAssetItems.push(item);
      } else if (acc.type === 'Liability') {
        const bal = -rawBalance; // liabilities have credit normal balance
        const item = { code: acc.code, name: acc.name, amount: bal };
        if (acc.code.startsWith('2')) currentLiabilityItems.push(item);
        else nonCurrentLiabilityItems.push(item);
      } else if (acc.type === 'Equity') {
        equityTotal += -rawBalance; // equity credit normal balance
      }
    }

    const incomeData = await this.getIncomeStatement({ asOfDate: query.asOfDate });
    const netProfit = (incomeData.data.find(d => d.label === 'Net Profit') as any)?.amount || 0;

    const currentAssetTotal = currentAssetItems.reduce((s, i) => s + i.amount, 0);
    const nonCurrentAssetTotal = nonCurrentAssetItems.reduce((s, i) => s + i.amount, 0);
    const currentLiabTotal = currentLiabilityItems.reduce((s, i) => s + i.amount, 0);
    const nonCurrentLiabTotal = nonCurrentLiabilityItems.reduce((s, i) => s + i.amount, 0);
    const totalAssets = currentAssetTotal + nonCurrentAssetTotal;
    const totalLiabilities = currentLiabTotal + nonCurrentLiabTotal;
    const totalEquity = equityTotal + netProfit;

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      assets: {
        current: { total: currentAssetTotal, items: currentAssetItems },
        nonCurrent: { total: nonCurrentAssetTotal, items: nonCurrentAssetItems },
        totalAssets,
      },
      liabilities: {
        current: { total: currentLiabTotal, items: currentLiabilityItems },
        nonCurrent: { total: nonCurrentLiabTotal, items: nonCurrentLiabilityItems },
        totalLiabilities,
      },
      equity: {
        total: totalEquity,
        retainedEarnings: netProfit,
        statedCapital: equityTotal,
      },
      isBalanced,
    };
  }
}
