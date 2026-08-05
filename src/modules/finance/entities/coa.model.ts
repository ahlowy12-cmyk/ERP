import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ──────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS (شجرة الحسابات)
// ──────────────────────────────────────────────────────────────
export const ChartOfAccountModelName = 'ChartOfAccount';

@Schema({ timestamps: true, collection: 'chart_of_accounts' })
export class ChartOfAccount extends Document {
  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'],
    required: true,
  })
  type!: string;

  @Prop({ type: String, default: null })
  parentCode?: string;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ type: Number, default: 0 })
  balance!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Boolean, default: false })
  isReconciliation!: boolean;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const ChartOfAccountSchema = SchemaFactory.createForClass(ChartOfAccount);
// code is unique via @Prop({ unique: true })
ChartOfAccountSchema.index({ type: 1 });
ChartOfAccountSchema.index({ parentCode: 1 });
ChartOfAccountSchema.index({ isActive: 1 });

export const ChartOfAccountModel = MongooseModule.forFeature([
  { name: ChartOfAccountModelName, schema: ChartOfAccountSchema },
]);
