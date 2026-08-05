import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { SupplierInvoiceModelName, PaymentVoucherModelName } from '../entities/ap.model';
import { JournalEntryModelName } from '../../billing/invoices/entities/billing.model';
import { BankAccountModelName, CashAccountModelName } from '../entities/cash-bank.model';
import { ChartOfAccountModelName } from '../entities/coa.model';

@Injectable()
export class ApService {
  private readonly logger = new Logger(ApService.name);

  constructor(
    @InjectModel(SupplierInvoiceModelName) private supplierInvoiceModel: Model<any>,
    @InjectModel(PaymentVoucherModelName) private paymentVoucherModel: Model<any>,
    @InjectModel(JournalEntryModelName) private journalEntryModel: Model<any>,
    @InjectModel(BankAccountModelName) private bankAccountModel: Model<any>,
    @InjectModel(CashAccountModelName) private cashAccountModel: Model<any>,
    @InjectModel(ChartOfAccountModelName) private coaModel: Model<any>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async nextNumber(model: Model<any>, field: string, prefix: string, session?: any): Promise<string> {
    const year = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const count = await model.countDocuments({}, { session });
      const nextNum = count + 1 + i;
      const id = `${prefix}-${year}-${nextNum.toString().padStart(4, '0')}`;
      const existing = await model.findOne({ [field]: id }, null, { session });
      if (!existing) return id;
    }
    throw new BadRequestException(`Could not generate next number for ${prefix}`);
  }

  async findAllInvoices(query: { status?: string; vendorId?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.search) {
      filter.$or = [
        { invoiceNumber: { $regex: query.search, $options: 'i' } },
        { vendorName: { $regex: query.search, $options: 'i' } }
      ];
    }
    if (query.dateFrom || query.dateTo) {
      filter.invoiceDate = {};
      if (query.dateFrom) filter.invoiceDate.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.invoiceDate.$lte = new Date(query.dateTo);
    }

    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [data, allInvoices] = await Promise.all([
      this.supplierInvoiceModel.find(filter).skip(skip).limit(limit).exec(),
      this.supplierInvoiceModel.find(filter).exec()
    ]);

    const totalOutstanding = allInvoices
      .filter(i => i.status !== 'Paid' && i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (i.balanceDue || 0), 0);
    const totalPaid = allInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const today = new Date();
    const overdueCount = allInvoices.filter(i => 
      new Date(i.dueDate) < today && (i.status === 'Unpaid' || i.status === 'Partially Paid')
    ).length;
    const activeVendors = new Set(allInvoices.map(i => i.vendorId?.toString()).filter(Boolean));

    return {
      data,
      kpis: {
        totalOutstanding,
        totalPaid,
        overdueCount,
        activeVendorCount: activeVendors.size
      }
    };
  }

  async createInvoice(dto: any, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const subTotal = dto.subTotal || 0;
      const taxAmount = dto.taxAmount || 0;
      const totalAmount = subTotal + taxAmount;
      const balanceDue = totalAmount;

      let invoiceNumber = dto.invoiceNumber;
      if (!invoiceNumber) {
        invoiceNumber = await this.nextNumber(this.supplierInvoiceModel, 'invoiceNumber', 'SINV', session);
      }

      const invoice = new this.supplierInvoiceModel({
        ...dto,
        invoiceNumber,
        totalAmount,
        balanceDue,
        status: 'Unpaid',
        createdBy: userId,
      });

      await invoice.save({ session });

      const chargeAccountCode = dto.chargeAccountCode || '521000';
      const lines = [
        { accountCode: chargeAccountCode, debit: subTotal, credit: 0 },
        { accountCode: '211000', debit: 0, credit: totalAmount } // A/P
      ];
      
      if (taxAmount > 0) {
        lines.push({ accountCode: '214000', debit: taxAmount, credit: 0 }); // VAT Payable
      }

      const glEntry = new this.journalEntryModel({
        entryDate: dto.invoiceDate || new Date(),
        reference: invoiceNumber,
        sourceType: 'AP_Invoice',
        description: `AP Invoice for ${dto.vendorName}`,
        lines,
        createdBy: userId,
      });

      await glEntry.save({ session });

      for (const line of lines) {
        if (line.debit > 0) {
          await this.coaModel.updateOne({ code: line.accountCode }, { $inc: { balance: line.debit } }, { session });
        }
        if (line.credit > 0) {
          await this.coaModel.updateOne({ code: line.accountCode }, { $inc: { balance: -line.credit } }, { session });
        }
      }

      await session.commitTransaction();
      return { message: 'Invoice created successfully', data: invoice, glEntry };
    } catch (error: any) {
      await session.abortTransaction();
      this.logger.error('Error creating AP invoice', error);
      throw new BadRequestException(error.message);
    } finally {
      session.endSession();
    }
  }

  async getAging() {
    const invoices = await this.supplierInvoiceModel.find({ status: { $in: ['Unpaid', 'Partially Paid'] } }).exec();
    const today = new Date();
    const agingByVendor: Record<string, any> = {};

    invoices.forEach(inv => {
      const vId = inv.vendorId?.toString() || 'unknown';
      if (!agingByVendor[vId]) {
        agingByVendor[vId] = {
          vendorId: vId,
          vendorName: inv.vendorName,
          totalDue: 0,
          current: 0,
          thirtyToSixty: 0,
          sixtyToNinety: 0,
          overNinety: 0
        };
      }
      const v = agingByVendor[vId];
      const due = inv.balanceDue || 0;
      v.totalDue += due;

      const dueDate = new Date(inv.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        v.current += due;
      } else if (diffDays > 30 && diffDays <= 60) {
        v.thirtyToSixty += due;
      } else if (diffDays > 60 && diffDays <= 90) {
        v.sixtyToNinety += due;
      } else {
        v.overNinety += due;
      }
    });

    return { data: Object.values(agingByVendor) };
  }

  async findAllVouchers(query: { vendorId?: string; status?: string }) {
    const filter: any = {};
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.status) filter.status = query.status;

    const data = await this.paymentVoucherModel.find(filter).exec();
    return { data };
  }

  async createVoucher(dto: any, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const amount = dto.invoicesPaid?.reduce((sum: number, inv: any) => sum + (inv.amountPaid || 0), 0) || 0;
      
      let account;
      if (dto.paymentMethod === 'Cash') {
        account = await this.cashAccountModel.findById(dto.bankAccountId).session(session);
      } else {
        account = await this.bankAccountModel.findById(dto.bankAccountId).session(session);
      }

      if (!account) throw new NotFoundException('Bank/Cash account not found');

      if (account.balance < amount) {
        throw new BadRequestException(`Insufficient funds. Available: ${account.balance}, Required: ${amount}`);
      }

      account.balance -= amount;
      await account.save({ session });

      for (const invPaid of (dto.invoicesPaid || [])) {
        const inv = await this.supplierInvoiceModel.findById(invPaid.invoiceId).session(session);
        if (inv) {
          inv.paidAmount = (inv.paidAmount || 0) + invPaid.amountPaid;
          inv.balanceDue = (inv.balanceDue || 0) - invPaid.amountPaid;
          
          if (inv.balanceDue <= 0) {
            inv.status = 'Paid';
          } else if (inv.paidAmount > 0 && inv.balanceDue > 0) {
            inv.status = 'Partially Paid';
          }
          await inv.save({ session });
        }
      }

      const voucherNumber = await this.nextNumber(this.paymentVoucherModel, 'voucherNumber', 'PV', session);

      const voucher = new this.paymentVoucherModel({
        ...dto,
        amount,
        voucherNumber,
        status: 'Posted',
        createdBy: userId,
      });

      await voucher.save({ session });

      const bankCoaCode = account.coaCode || '111000'; // Default if not found
      
      const glEntry = new this.journalEntryModel({
        entryDate: dto.paymentDate || new Date(),
        reference: voucherNumber,
        sourceType: 'AP_Payment',
        description: `AP Payment to ${dto.vendorName}`,
        lines: [
          { accountCode: '211000', debit: amount, credit: 0 }, // A/P
          { accountCode: bankCoaCode, debit: 0, credit: amount } // Bank/Cash
        ],
        createdBy: userId,
      });

      await glEntry.save({ session });

      // Update COA balances
      await this.coaModel.updateOne({ code: '211000' }, { $inc: { balance: amount } }, { session });
      await this.coaModel.updateOne({ code: bankCoaCode }, { $inc: { balance: -amount } }, { session });

      await session.commitTransaction();
      return { message: 'Payment voucher created successfully', data: voucher, glEntry };
    } catch (error: any) {
      await session.abortTransaction();
      this.logger.error('Error creating AP voucher', error);
      throw new BadRequestException(error.message);
    } finally {
      session.endSession();
    }
  }
}
