import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { JournalEntryModelName } from '../../billing/invoices/entities/billing.model';
import { SupplierInvoiceModelName } from '../entities/ap.model';
import { ChartOfAccountModelName } from '../entities/coa.model';

@Injectable()
export class VatService {
  private readonly logger = new Logger(VatService.name);

  constructor(
    @InjectModel(JournalEntryModelName) private readonly journalEntryModel: Model<any>,
    @InjectModel(SupplierInvoiceModelName) private readonly supplierInvoiceModel: Model<any>,
    @InjectModel(ChartOfAccountModelName) private readonly coaModel: Model<any>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getReport(query: { periodStart?: string; periodEnd?: string }) {
    const { periodStart, periodEnd } = query;
    const dateFilter: any = {};
    if (periodStart) dateFilter.$gte = new Date(periodStart);
    if (periodEnd) dateFilter.$lte = new Date(periodEnd);

    const jeFilter: any = { status: 'Posted', 'lines.accountCode': '411000' };
    if (Object.keys(dateFilter).length > 0) jeFilter.date = dateFilter;

    const journalEntries = await this.journalEntryModel.find(jeFilter).lean();

    const outputLines: any[] = [];
    let totalOutputNet = 0;
    let totalOutputVat = 0;

    for (const je of journalEntries) {
      for (const line of (je.lines as any[]) || []) {
        if (line.accountCode === '411000') {
          // Revenue lines have Credit type with positive amount
          const netAmount = line.type === 'Credit' ? (line.amount || 0) : 0;
          if (netAmount <= 0) continue;
          const vatAmount = netAmount * 0.15;
          outputLines.push({
            ref: je.journalNumber || je.reference,
            date: je.date,
            party: je.description || '',
            description: `${je.sourceType} — ${je.reference || ''}`,
            netAmount,
            vatAmount,
            vatRate: 15,
            type: 'output',
          });
          totalOutputNet += netAmount;
          totalOutputVat += vatAmount;
        }
      }
    }

    const apFilter: any = {};
    if (Object.keys(dateFilter).length > 0) apFilter.invoiceDate = dateFilter;

    const supplierInvoices = await this.supplierInvoiceModel.find(apFilter).lean();

    const inputLines: any[] = [];
    let totalInputNet = 0;
    let totalInputVat = 0;

    for (const inv of supplierInvoices) {
      const vatAmount = inv.taxAmount || 0;
      const netAmount = (inv.subTotal || 0);
      inputLines.push({
        ref: inv.invoiceNumber,
        date: inv.invoiceDate,
        party: inv.vendorName || '',
        description: inv.poNumber ? `PO: ${inv.poNumber}` : inv.chargeType || '',
        netAmount,
        vatAmount,
        vatRate: 15,
        type: 'input',
      });
      totalInputNet += netAmount;
      totalInputVat += vatAmount;
    }

    const netVatPayable = totalOutputVat - totalInputVat;

    return {
      summary: {
        totalOutputNet,
        totalOutputVat,
        totalInputNet,
        totalInputVat,
        netVatPayable,
        effectiveOutputRate: 15,
        effectiveInputRate: 15,
      },
      outputLines,
      inputLines,
    };
  }

  private async nextJENumber(session?: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;
    for (let i = 0; i < 5; i++) {
      const last = await this.journalEntryModel.findOne(
        { journalNumber: { $regex: `^${prefix}` } },
        {},
        { sort: { journalNumber: -1 }, session },
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

  async postSettlement(dto: { periodStart: string; periodEnd: string }, userId: string) {
    const report = await this.getReport(dto);
    const { netVatPayable } = report.summary;

    if (Math.abs(netVatPayable) < 0.01) {
      throw new BadRequestException('No VAT difference to settle');
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const journalNumber = await this.nextJENumber(session);
      const absAmount = Math.abs(netVatPayable);

      const lines = netVatPayable > 0
        ? [
            { accountCode: '521000', accountName: 'G&A Costs', type: 'Debit', amount: absAmount, notes: 'VAT Settlement - Payable' },
            { accountCode: '214000', accountName: 'VAT Payable', type: 'Credit', amount: absAmount, notes: 'VAT Control' },
          ]
        : [
            { accountCode: '121000', accountName: 'Accounts Receivable A/R', type: 'Debit', amount: absAmount, notes: 'VAT Settlement - Refundable' },
            { accountCode: '214000', accountName: 'VAT Payable', type: 'Credit', amount: absAmount, notes: 'VAT Control' },
          ];

      const newJE = new this.journalEntryModel({
        journalNumber,
        reference: `VAT-SETTLE-${dto.periodStart}-TO-${dto.periodEnd}`,
        sourceType: 'VAT_Settlement',
        date: new Date(),
        status: 'Posted',
        description: `VAT Settlement ${dto.periodStart} to ${dto.periodEnd}`,
        totalDebit: absAmount,
        totalCredit: absAmount,
        lines,
        createdBy: userId,
      });
      await newJE.save({ session });

      // Update COA balances
      if (netVatPayable > 0) {
        await this.coaModel.updateOne({ code: '521000' }, { $inc: { balance: absAmount } }, { session });
        await this.coaModel.updateOne({ code: '214000' }, { $inc: { balance: -absAmount } }, { session });
      } else {
        await this.coaModel.updateOne({ code: '121000' }, { $inc: { balance: absAmount } }, { session });
        await this.coaModel.updateOne({ code: '214000' }, { $inc: { balance: -absAmount } }, { session });
      }

      await session.commitTransaction();
      return {
        message: 'VAT settlement posted successfully',
        netVatPayable,
        type: netVatPayable > 0 ? 'payable' : 'receivable',
        glEntry: newJE,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error posting VAT settlement', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}
