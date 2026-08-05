import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const WCCModelName = 'WCC';

@Schema({ timestamps: true, collection: 'work_completion_certificates' })
export class WCC extends Document {
  @Prop({ required: true, unique: true, trim: true })
  wccNumber!: string; // WCC-YYYY-XXXX

  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  contractId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  contractNumber!: string;

  @Prop({ type: String, default: '' })
  clientName!: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ type: Date, required: true })
  periodFrom!: Date;

  @Prop({ type: Date, required: true })
  periodTo!: Date;

  @Prop({ type: [Types.ObjectId], ref: 'DAR', default: [] })
  approvedDarIds!: Types.ObjectId[];

  // Hour totals from DARs
  @Prop({ type: Number, default: 0 })
  totalOperatingHours!: number;

  @Prop({ type: Number, default: 0 })
  totalStandbyHours!: number;

  @Prop({ type: Number, default: 0 })
  totalRepairHours!: number;

  @Prop({ type: Number, default: 0 })
  totalDowntimeHours!: number;

  // Day fractions (hours / 24)
  @Prop({ type: Number, default: 0 })
  totalOperatingDays!: number;

  @Prop({ type: Number, default: 0 })
  totalStandbyDays!: number;

  // Rate sheet snapshot
  @Prop({ type: Number, default: 0 })
  operatingDayRate!: number;

  @Prop({ type: Number, default: 0 })
  standbyDayRate!: number;

  // Amounts
  @Prop({ type: Number, default: 0 })
  operatingAmount!: number;

  @Prop({ type: Number, default: 0 })
  standbyAmount!: number;

  @Prop({ type: Number, default: 0 })
  mobilizationFee!: number;

  @Prop({ type: Number, default: 0 })
  demobilizationFee!: number;

  @Prop({ type: Number, default: 0 })
  otherCharges!: number;

  @Prop({ type: Number, default: 0 })
  subtotal!: number;

  @Prop({ type: Number, default: 10 })
  retentionPercent!: number;

  @Prop({
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Invoiced'],
    default: 'Draft',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'SalesInvoice', default: null })
  invoiceId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  invoiceNumber?: string;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const WCCSchema = SchemaFactory.createForClass(WCC);
WCCSchema.index({ wccNumber: 1 }, { unique: true });
WCCSchema.index({ contractId: 1 });
WCCSchema.index({ status: 1 });

export const WCCModel = MongooseModule.forFeature([
  { name: WCCModelName, schema: WCCSchema },
]);
