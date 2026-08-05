import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ─── Fuel Tank ─────────────────────────────────────────────────────────────
export const FuelTankModelName = 'FuelTank';

@Schema({ timestamps: true, collection: 'fuel_tanks' })
export class FuelTank extends Document {
  @Prop({ required: true, unique: true, trim: true })
  tankCode!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ type: String, default: '' })
  location!: string;

  @Prop({ type: String, enum: ['Diesel', 'Petrol', 'LPG'], default: 'Diesel' })
  fuelType!: string;

  @Prop({ type: Number, required: true, min: 0 })
  capacityLiters!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  currentLevelLiters!: number;

  @Prop({ type: Number, default: 0 })
  minimumLevelLiters!: number;

  @Prop({ type: Number, default: 0 })
  unitCost!: number; // last known cost per liter

  @Prop({ type: Date, default: null })
  lastRefillDate?: Date;

  @Prop({ type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const FuelTankSchema = SchemaFactory.createForClass(FuelTank);
FuelTankSchema.index({ tankCode: 1 }, { unique: true });
FuelTankSchema.index({ projectCode: 1 });
FuelTankSchema.index({ status: 1 });

export const FuelTankModel = MongooseModule.forFeature([
  { name: FuelTankModelName, schema: FuelTankSchema },
]);

// ─── Fuel Receipt ───────────────────────────────────────────────────────────
export const FuelReceiptModelName = 'FuelReceipt';

@Schema({ timestamps: true, collection: 'fuel_receipts' })
export class FuelReceipt extends Document {
  @Prop({ type: Types.ObjectId, ref: 'FuelTank', required: true })
  tankId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  tankCode!: string;

  @Prop({ type: Number, required: true, min: 0 })
  quantityLiters!: number;

  @Prop({ type: Number, default: 0 })
  unitCost!: number;

  @Prop({ type: Number, default: 0 })
  totalCost!: number;

  @Prop({ type: String, default: '' })
  supplierName!: string;

  @Prop({ type: Date, required: true })
  deliveryDate!: Date;

  @Prop({ type: String, default: '' })
  receivedBy!: string;

  @Prop({ type: String, default: null })
  invoiceNumber?: string;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const FuelReceiptSchema = SchemaFactory.createForClass(FuelReceipt);
FuelReceiptSchema.index({ tankId: 1 });
FuelReceiptSchema.index({ deliveryDate: -1 });

export const FuelReceiptModel = MongooseModule.forFeature([
  { name: FuelReceiptModelName, schema: FuelReceiptSchema },
]);

// ─── Fuel Issue ─────────────────────────────────────────────────────────────
export const FuelIssueModelName = 'FuelIssue';

@Schema({ timestamps: true, collection: 'fuel_issues' })
export class FuelIssue extends Document {
  @Prop({ type: Types.ObjectId, ref: 'FuelTank', required: true })
  tankId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  tankCode!: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ type: Number, required: true, min: 0 })
  quantityLiters!: number;

  @Prop({ type: String, default: '' })
  issuedTo!: string; // "Rig" | "Vehicle" | "Generator" | "Camp"

  @Prop({ type: String, default: null })
  issuedToId?: string;

  @Prop({ type: String, default: '' })
  issuedToName!: string;

  @Prop({ type: Date, required: true })
  issueDate!: Date;

  @Prop({ type: String, default: '' })
  issuedBy!: string;

  @Prop({ type: Number, default: null })
  runningHours?: number;

  @Prop({ type: Number, default: 0 })
  unitCost!: number;

  @Prop({ type: Number, default: 0 })
  totalCost!: number;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const FuelIssueSchema = SchemaFactory.createForClass(FuelIssue);
FuelIssueSchema.index({ tankId: 1 });
FuelIssueSchema.index({ costCenterCode: 1 });
FuelIssueSchema.index({ issueDate: -1 });

export const FuelIssueModel = MongooseModule.forFeature([
  { name: FuelIssueModelName, schema: FuelIssueSchema },
]);
