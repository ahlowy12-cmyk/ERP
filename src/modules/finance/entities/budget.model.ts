import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ──────────────────────────────────────────────────────────────
// PROJECT BUDGET (ميزانية المشروع)
// ──────────────────────────────────────────────────────────────
export const ProjectBudgetModelName = 'ProjectBudget';

const BudgetLineSchema = new (require('mongoose').Schema)(
  {
    category: {
      type: String,
      enum: ['Materials', 'Labor', 'Equipment', 'Subcontractors', 'Transportation', 'G&A', 'Contingency'],
      required: true,
    },
    budgetAmount:    { type: Number, default: 0 },
    actualAmount:    { type: Number, default: 0 },
    committedAmount: { type: Number, default: 0 },
  },
  { _id: false },
);

@Schema({ timestamps: true, collection: 'project_budgets' })
export class ProjectBudget extends Document {
  @Prop({ required: true, trim: true })
  projectCode!: string;

  @Prop({ type: String, default: null })
  projectName?: string;

  @Prop({ type: Number, required: true })
  fiscalYear!: number;

  @Prop({ type: Number, default: 0 })
  totalBudget!: number;

  @Prop({
    type: String,
    enum: ['Draft', 'Active', 'Approved'],
    default: 'Active',
  })
  status!: string;

  @Prop({ type: [BudgetLineSchema], default: [] })
  lines!: {
    category: string;
    budgetAmount: number;
    actualAmount: number;
    committedAmount: number;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const ProjectBudgetSchema = SchemaFactory.createForClass(ProjectBudget);
ProjectBudgetSchema.index({ projectCode: 1, fiscalYear: 1 }, { unique: true });
ProjectBudgetSchema.index({ fiscalYear: 1 });
ProjectBudgetSchema.index({ status: 1 });

export const ProjectBudgetModel = MongooseModule.forFeature([
  { name: ProjectBudgetModelName, schema: ProjectBudgetSchema },
]);

// ──────────────────────────────────────────────────────────────
// COLLECTION VOUCHER (سند تحصيل مالي — AR)
// ──────────────────────────────────────────────────────────────
export const CollectionVoucherModelName = 'CollectionVoucher';

const InvoiceCollectedLineSchema = new (require('mongoose').Schema)(
  {
    invoiceId:       { type: Types.ObjectId, ref: 'SalesInvoice', required: true },
    invoiceNumber:   { type: String, required: true },
    amountCollected: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

@Schema({ timestamps: true, collection: 'collection_vouchers' })
export class CollectionVoucher extends Document {
  @Prop({ required: true, unique: true, trim: true })
  voucherNumber!: string; // CV-YYYY-XXXX

  @Prop({ type: Date, required: true })
  collectionDate!: Date;

  @Prop({ required: true, trim: true })
  customerName!: string;

  @Prop({ type: Types.ObjectId, ref: 'BankAccount', default: null })
  bankAccountId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  bankAccountName?: string;

  @Prop({
    type: String,
    enum: ['Bank Transfer', 'Cheque', 'Cash'],
    default: 'Bank Transfer',
  })
  paymentMethod!: string;

  @Prop({ type: String, default: null })
  referenceNumber?: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({
    type: String,
    enum: ['Draft', 'Posted', 'Cancelled'],
    default: 'Posted',
  })
  status!: string;

  @Prop({ type: [InvoiceCollectedLineSchema], default: [] })
  invoicesCollected!: {
    invoiceId: Types.ObjectId;
    invoiceNumber: string;
    amountCollected: number;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'JournalEntry', default: null })
  glEntryId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  glEntryNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const CollectionVoucherSchema = SchemaFactory.createForClass(CollectionVoucher);
// voucherNumber is unique via @Prop
CollectionVoucherSchema.index({ collectionDate: -1 });
CollectionVoucherSchema.index({ status: 1 });

export const CollectionVoucherModel = MongooseModule.forFeature([
  { name: CollectionVoucherModelName, schema: CollectionVoucherSchema },
]);
