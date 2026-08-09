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
    if (periodEnd)   dateFilter.$lte = new Date(periodEnd);

    // ── Output VAT: Revenue lines in GL ──────────────────────────────────
    const jeFilter: any = { status: 'Posted', 'lines.accountCode': { $in: ['410000', '420000'] } };
    if (Object.keys(dateFilter).length) jeFilter.date = dateFilter;

    const journalEntries = await this.journalEntryModel.find(jeFilter).lean();

    const outputLines: any[] = [];
    let totalOutputNet = 0;
    let totalOutputVat = 0;

    for (const je of journalEntries) {
      for (const line of (je.lines as any[]) || []) {
        if (['410000', '420000'].includes(line.accountCode)) {
          const netAmount = line.type === 'Credit' ? (line.amount || 0) : 0;
          if (netAmount <= 0) continue;
          const vatAmount = netAmount * 0.15;
          outputLines.push({
            ref:         je.journalNumber || je.reference,
            date:        je.date,
            party:       je.description || '',
            description: `${je.sourceType || ''} — ${je.reference || ''}`,
            netAmount,
            vatAmount,
            vatRate: 15,
            type:    'output',
          });
          totalOutputNet += netAmount;
          totalOutputVat += vatAmount;
        }
      }
    }

    // ── Input VAT: Supplier Invoices ──────────────────────────────────────
    const apFilter: any = {};
    if (Object.keys(dateFilter).length) apFilter.invoiceDate = dateFilter;

    const supplierInvoices = await this.supplierInvoiceModel.find(apFilter).lean();

    const inputLines: any[] = [];
    let totalInputNet = 0;
    let totalInputVat = 0;

    for (const inv of supplierInvoices) {
      const vatAmount = inv.taxAmount || 0;
      const netAmount = inv.subTotal  || 0;
      inputLines.push({
        ref:         inv.invoiceNumber,
        date:        inv.invoiceDate,
        party:       inv.vendorName || '',
        description: inv.poNumber ? `PO: ${inv.poNumber}` : (inv.chargeType || ''),
        netAmount,
        vatAmount,
        vatRate: 15,
        type:    'input',
      });
      totalInputNet += netAmount;
      totalInputVat += vatAmount;
    }

    const netVatPayable = totalOutputVat - totalInputVat;

    return {
      data: {
        summary: {
          totalOutputNet, totalOutputVat,
          totalInputNet,  totalInputVat,
          netVatPayable,
          effectiveOutputRate: 15,
          effectiveInputRate:  15,
        },
        outputLines,
        inputLines,
      }
    };
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

  async postSettlement(dto: { periodStart: string; periodEnd: string }, userId: string) {
    // Fetch report to get computed VAT figures
    const reportResult = await this.getReport(dto);
    const { totalOutputVat, totalInputVat, netVatPayable } = reportResult.data.summary;

    if (Math.abs(netVatPayable) < 0.01) {
      throw new BadRequestException('No VAT difference to settle');
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const journalNumber = await this.nextJENumber(session);

      let glLines: any[];
      let totalDebit: number;
      let totalCredit: number;

      if (netVatPayable > 0) {
        // Company owes GAZT (output > input)
        // DR 214000 (VAT Payable)      = totalOutputVAT
        // CR 215000 (VAT Receivable)   = totalInputVAT
        // CR 211000 (A/P — GAZT)       = netVatPayable
        glLines = [
          { accountCode: '214000', accountName: 'VAT Payable',         type: 'Debit',  amount: totalOutputVat },
          { accountCode: '215000', accountName: 'VAT Receivable',       type: 'Credit', amount: totalInputVat  },
          { accountCode: '211000', accountName: 'Accounts Payable (A/P — GAZT)', type: 'Credit', amount: netVatPayable },
        ];
        totalDebit  = totalOutputVat;
        totalCredit = totalInputVat + netVatPayable;
      } else {
        // Refund due from GAZT
        // DR 215000 (VAT Receivable)   = totalInputVAT
        // DR 211000 / Other            = abs(netVatPayable)  [refund claim]
        // CR 214000 (VAT Payable)      = totalOutputVAT
        const refundDue = Math.abs(netVatPayable);
        glLines = [
          { accountCode: '215000', accountName: 'VAT Receivable',  type: 'Debit',  amount: totalInputVat  },
          { accountCode: '121000', accountName: 'A/R — VAT Refund', type: 'Debit',  amount: refundDue      },
          { accountCode: '214000', accountName: 'VAT Payable',     type: 'Credit', amount: totalOutputVat },
        ];
        totalDebit  = totalInputVat + refundDue;
        totalCredit = totalOutputVat;
      }

      const refLabel = `VAT-SETTLE-${dto.periodStart}-TO-${dto.periodEnd}`;

      const glEntry = new this.journalEntryModel({
        journalNumber,
        reference:   refLabel,
        sourceType:  'VAT_Settlement',
        date:        new Date(),
        description: `VAT Settlement ${dto.periodStart} to ${dto.periodEnd}`,
        status:      'Posted',
        totalDebit,
        totalCredit,
        lines:       glLines,
        createdBy:   userId,
      });
      await glEntry.save({ session });

      // Update COA balances
      for (const line of glLines) {
        const inc = line.type === 'Debit' ? line.amount : -line.amount;
        await this.coaModel.updateOne({ code: line.accountCode }, { $inc: { balance: inc } }, { session });
      }

      await session.commitTransaction();
      return {
        data: {
          message:       'VAT settlement posted successfully',
          netVatPayable,
          type:          netVatPayable > 0 ? 'payable' : 'receivable',
          glEntry,
        }
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
