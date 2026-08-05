import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ─── Journal Entry ──────────────────────────────────────────────────────────
export const JournalEntryModelName = 'JournalEntry';

@Schema({ timestamps: true, collection: 'journal_entries' })
export class JournalEntry extends Document {
  @Prop({ required: true, unique: true, trim: true })
  entryNumber!: string; // JE-YYYY-XXXX

  @Prop({ type: Date, required: true })
  entryDate!: Date;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: String, default: null })
  reference?: string;

  @Prop({
    type: String,
    enum: [
      'Invoice', 'Collection', 'Manual', 'Adjustment',
      'AP_Invoice', 'AP_Payment', 'AR_Collection',
      'Depreciation', 'VAT_Settlement',
    ],
    required: true,
  })
  sourceType!: string;

  @Prop({ type: Types.ObjectId, default: null })
  sourceId?: Types.ObjectId;

  @Prop({
    type: [
      {
        accountCode:  { type: String, required: true },
        accountName:  { type: String, required: true },
        type:         { type: String, enum: ['Debit', 'Credit'], required: true },
        amount:       { type: Number, required: true, min: 0 },
        costCenterCode: { type: String, default: null },
        notes:        { type: String, default: null },
      },
    ],
    default: [],
  })
  lines!: {
    accountCode: string;
    accountName: string;
    type: string;
    amount: number;
    costCenterCode?: string;
    notes?: string;
  }[];

  @Prop({ type: Number, default: 0 })
  totalDebit!: number;

  @Prop({ type: Number, default: 0 })
  totalCredit!: number;

  @Prop({
    type: String,
    enum: ['Draft', 'Posted', 'Voided'],
    default: 'Posted',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);
// Note: entryNumber is unique via @Prop({ unique: true })
JournalEntrySchema.index({ sourceType: 1, sourceId: 1 });
JournalEntrySchema.index({ entryDate: -1 });

export const JournalEntryModel = MongooseModule.forFeature([
  { name: JournalEntryModelName, schema: JournalEntrySchema },
]);

// ─── Sales Invoice ──────────────────────────────────────────────────────────
export const SalesInvoiceModelName = 'SalesInvoice';

@Schema({ timestamps: true, collection: 'sales_invoices' })
export class SalesInvoice extends Document {
  @Prop({ required: true, unique: true, trim: true })
  invoiceNumber!: string; // INV-YYYY-XXXX

  @Prop({ type: Types.ObjectId, ref: 'WCC', required: true })
  wccId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  wccNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  contractId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  contractNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ type: String, required: true })
  clientName!: string;

  @Prop({ type: Date, required: true })
  invoiceDate!: Date;

  @Prop({ type: Date, required: true })
  dueDate!: Date;

  @Prop({ type: Number, required: true })
  subtotal!: number;

  @Prop({ type: Number, default: 15 })
  vatPercent!: number;

  @Prop({ type: Number, default: 0 })
  vatAmount!: number;

  @Prop({ type: Number, default: 10 })
  retentionPercent!: number;

  @Prop({ type: Number, default: 0 })
  retentionAmount!: number;

  @Prop({ type: Number, default: 5 })
  withholdingTaxPercent!: number;

  @Prop({ type: Number, default: 0 })
  withholdingTaxAmount!: number;

  @Prop({ type: Number, required: true })
  netPayable!: number;

  @Prop({ type: Number, default: 0 })
  totalCollected!: number;

  @Prop({ type: Number })
  balanceDue!: number;

  @Prop({
    type: String,
    enum: ['Draft', 'Sent', 'Partially_Paid', 'Paid', 'Cancelled', 'Overdue'],
    default: 'Draft',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'JournalEntry', default: null })
  glEntryId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  glEntryNumber?: string;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const SalesInvoiceSchema = SchemaFactory.createForClass(SalesInvoice);
// Note: invoiceNumber is unique via @Prop({ unique: true })
SalesInvoiceSchema.index({ contractId: 1 });
SalesInvoiceSchema.index({ status: 1 });
SalesInvoiceSchema.index({ dueDate: 1 });

export const SalesInvoiceModel = MongooseModule.forFeature([
  { name: SalesInvoiceModelName, schema: SalesInvoiceSchema },
]);

// ─── Collection ──────────────────────────────────────────────────────────────
export const CollectionModelName = 'Collection';

@Schema({ timestamps: true, collection: 'collections' })
export class Collection extends Document {
  @Prop({ required: true, unique: true, trim: true })
  collectionNumber!: string; // COL-YYYY-XXXX

  @Prop({ type: Types.ObjectId, ref: 'SalesInvoice', required: true })
  invoiceId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  invoiceNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Contract', default: null })
  contractId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  contractNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: String, default: '' })
  clientName!: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({
    type: String,
    enum: ['Wire Transfer', 'Cheque', 'Cash', 'Bank Transfer'],
    default: 'Wire Transfer',
  })
  method!: string;

  @Prop({ type: String, default: null })
  reference?: string;

  @Prop({ type: String, default: null })
  remarks?: string;

  @Prop({ type: Types.ObjectId, ref: 'JournalEntry', default: null })
  glEntryId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  glEntryNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
// Note: collectionNumber is unique via @Prop({ unique: true })
CollectionSchema.index({ invoiceId: 1 });
CollectionSchema.index({ date: -1 });

export const CollectionModel = MongooseModule.forFeature([
  { name: CollectionModelName, schema: CollectionSchema },
]);
