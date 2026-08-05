import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ──────────────────────────────────────────────────────────────
// 1. ASSET ASSIGNMENT
// ──────────────────────────────────────────────────────────────
export const AssetAssignmentModelName = 'AssetAssignment';

@Schema({ timestamps: true, collection: 'asset_assignments' })
export class AssetAssignment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  assetId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  assetNumber!: string;

  @Prop({ required: true, trim: true })
  equipmentName!: string;

  @Prop({
    type: String,
    enum: ['Project', 'Rig', 'Camp', 'Driver'],
    required: true,
  })
  assignedToType!: string;

  @Prop({ type: String, required: true })
  assignedToId!: string;

  @Prop({ required: true, trim: true })
  assignedToName!: string;

  @Prop({ type: Date, required: true })
  assignmentDate!: Date;

  @Prop({ type: Date, default: null })
  releaseDate?: Date;

  @Prop({
    type: String,
    enum: ['New', 'Good', 'Fair', 'Poor'],
    default: 'Good',
  })
  conditionOnAssign!: string;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const AssetAssignmentSchema = SchemaFactory.createForClass(AssetAssignment);
AssetAssignmentSchema.index({ assetId: 1 });
AssetAssignmentSchema.index({ assignedToType: 1 });
AssetAssignmentSchema.index({ assignedToId: 1 });

export const AssetAssignmentModel = MongooseModule.forFeature([
  { name: AssetAssignmentModelName, schema: AssetAssignmentSchema },
]);

// ──────────────────────────────────────────────────────────────
// 2. ASSET TRANSFER
// ──────────────────────────────────────────────────────────────
export const AssetTransferModelName = 'AssetTransfer';

@Schema({ timestamps: true, collection: 'asset_transfers' })
export class AssetTransfer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  assetId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  assetNumber!: string;

  @Prop({ required: true, trim: true })
  equipmentName!: string;

  @Prop({ required: true, trim: true })
  fromLocation!: string;

  @Prop({ required: true, trim: true })
  toLocation!: string;

  @Prop({ type: Date, required: true })
  transferDate!: Date;

  @Prop({ required: true, trim: true })
  authorizedBy!: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Completed', 'Rejected'],
    default: 'Completed',
  })
  status!: string;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const AssetTransferSchema = SchemaFactory.createForClass(AssetTransfer);
AssetTransferSchema.index({ assetId: 1 });
AssetTransferSchema.index({ status: 1 });
AssetTransferSchema.index({ transferDate: -1 });

export const AssetTransferModel = MongooseModule.forFeature([
  { name: AssetTransferModelName, schema: AssetTransferSchema },
]);

// ──────────────────────────────────────────────────────────────
// 3. ASSET DISPOSAL
// ──────────────────────────────────────────────────────────────
export const AssetDisposalModelName = 'AssetDisposal';

@Schema({ timestamps: true, collection: 'asset_disposals' })
export class AssetDisposal extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  assetId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  assetNumber!: string;

  @Prop({ required: true, trim: true })
  equipmentName!: string;

  @Prop({ type: Date, required: true })
  disposalDate!: Date;

  @Prop({
    type: String,
    enum: ['Sale', 'Scrap', 'Write-off', 'Donation'],
    required: true,
  })
  disposalMethod!: string;

  @Prop({ type: Number, default: 0 })
  disposalCost!: number;

  @Prop({ type: Number, default: 0 })
  revenueReceived!: number;

  @Prop({ required: true, trim: true })
  reason!: string;

  @Prop({ required: true, trim: true })
  authorizedBy!: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Approved'],
    default: 'Approved',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const AssetDisposalSchema = SchemaFactory.createForClass(AssetDisposal);
AssetDisposalSchema.index({ assetId: 1 });
AssetDisposalSchema.index({ disposalDate: -1 });
AssetDisposalSchema.index({ status: 1 });

export const AssetDisposalModel = MongooseModule.forFeature([
  { name: AssetDisposalModelName, schema: AssetDisposalSchema },
]);

// ──────────────────────────────────────────────────────────────
// 4. ASSET HISTORY (Audit Log)
// ──────────────────────────────────────────────────────────────
export const AssetHistoryModelName = 'AssetHistory';

@Schema({ timestamps: true, collection: 'asset_history' })
export class AssetHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  assetId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  equipmentCode!: string;

  @Prop({
    type: String,
    enum: ['Location Change', 'Status Change', 'Project Assignment', 'Maintenance'],
    required: true,
  })
  changeType!: string;

  @Prop({ type: String, default: null })
  oldValue?: string;

  @Prop({ type: String, default: null })
  newValue?: string;

  @Prop({ required: true, trim: true })
  changedBy!: string;

  @Prop({ type: Date, default: () => new Date() })
  date!: Date;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const AssetHistorySchema = SchemaFactory.createForClass(AssetHistory);
AssetHistorySchema.index({ assetId: 1 });
AssetHistorySchema.index({ changeType: 1 });
AssetHistorySchema.index({ date: -1 });

export const AssetHistoryModel = MongooseModule.forFeature([
  { name: AssetHistoryModelName, schema: AssetHistorySchema },
]);
