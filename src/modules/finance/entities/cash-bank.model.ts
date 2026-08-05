import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ──────────────────────────────────────────────────────────────
// BANK ACCOUNT (حساب بنكي)
// ──────────────────────────────────────────────────────────────
export const BankAccountModelName = 'BankAccount';

@Schema({ timestamps: true, collection: 'bank_accounts' })
export class BankAccount extends Document {
  @Prop({ required: true, trim: true })
  bankName!: string;

  @Prop({ required: true, unique: true, trim: true })
  accountNumber!: string;

  @Prop({ type: String, default: null })
  iban?: string;

  @Prop({
    type: String,
    enum: ['SAR', 'USD', 'EUR'],
    default: 'USD',
  })
  currency!: string;

  @Prop({ type: Number, default: 0 })
  balance!: number;

  @Prop({ type: String, default: '110000' })
  coaCode!: string;

  @Prop({
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
// accountNumber is unique via @Prop
BankAccountSchema.index({ status: 1 });

export const BankAccountModel = MongooseModule.forFeature([
  { name: BankAccountModelName, schema: BankAccountSchema },
]);

// ──────────────────────────────────────────────────────────────
// CASH ACCOUNT (صندوق نقدي)
// ──────────────────────────────────────────────────────────────
export const CashAccountModelName = 'CashAccount';

@Schema({ timestamps: true, collection: 'cash_accounts' })
export class CashAccount extends Document {
  @Prop({ required: true, trim: true })
  officeLocation!: string;

  @Prop({ required: true, trim: true })
  custodianName!: string;

  @Prop({
    type: String,
    enum: ['SAR', 'USD', 'EUR'],
    default: 'USD',
  })
  currency!: string;

  @Prop({ type: Number, default: 0 })
  balance!: number;

  @Prop({ type: String, default: '111000' })
  coaCode!: string;

  @Prop({
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const CashAccountSchema = SchemaFactory.createForClass(CashAccount);
CashAccountSchema.index({ status: 1 });

export const CashAccountModel = MongooseModule.forFeature([
  { name: CashAccountModelName, schema: CashAccountSchema },
]);

// ──────────────────────────────────────────────────────────────
// BANK RECONCILIATION (المطابقة البنكية)
// ──────────────────────────────────────────────────────────────
export const BankReconciliationModelName = 'BankReconciliation';

@Schema({ timestamps: true, collection: 'bank_reconciliations' })
export class BankReconciliation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'BankAccount', required: true })
  bankAccountId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  statementPeriod!: string;

  @Prop({ type: Date, required: true })
  statementEndDate!: Date;

  @Prop({ type: Number, required: true })
  bookBalance!: number;

  @Prop({ type: Number, required: true })
  statementBalance!: number;

  @Prop({ type: Number, default: 0 })
  difference!: number;

  @Prop({
    type: String,
    enum: ['Reconciled', 'Unreconciled'],
    default: 'Unreconciled',
  })
  status!: string;

  @Prop({ type: Date, default: null })
  reconciledDate?: Date;

  @Prop({ type: String, default: null })
  reconciledBy?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const BankReconciliationSchema = SchemaFactory.createForClass(BankReconciliation);
BankReconciliationSchema.index({ bankAccountId: 1 });
BankReconciliationSchema.index({ statementEndDate: -1 });

export const BankReconciliationModel = MongooseModule.forFeature([
  { name: BankReconciliationModelName, schema: BankReconciliationSchema },
]);
