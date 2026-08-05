import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ─── Camp ───────────────────────────────────────────────────────────────────
export const CampModelName = 'Camp';

@Schema({ timestamps: true, collection: 'camps' })
export class Camp extends Document {
  @Prop({ required: true, unique: true, trim: true })
  campCode!: string;

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

  @Prop({ type: Number, required: true, min: 0 })
  totalBeds!: number;

  @Prop({ type: Number, default: 0 })
  occupiedBeds!: number;

  @Prop({ type: Number, default: 0 })
  availableBeds!: number; // totalBeds - occupiedBeds

  @Prop({ type: [String], default: [] })
  amenities!: string[];

  @Prop({ type: String, enum: ['Active', 'Inactive'], default: 'Active' })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const CampSchema = SchemaFactory.createForClass(Camp);
// Note: campCode is unique via @Prop({ unique: true })
CampSchema.index({ projectCode: 1 });
CampSchema.index({ status: 1 });

export const CampModel = MongooseModule.forFeature([
  { name: CampModelName, schema: CampSchema },
]);

// ─── Camp Allocation ────────────────────────────────────────────────────────
export const CampAllocationModelName = 'CampAllocation';

@Schema({ timestamps: true, collection: 'camp_allocations' })
export class CampAllocation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Camp', required: true })
  campId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  campCode!: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ required: true, trim: true })
  occupantName!: string;

  @Prop({ type: String, default: null })
  employeeId?: string;

  @Prop({ type: String, default: '' })
  role!: string;

  @Prop({ type: String, default: null })
  bedNumber?: string;

  @Prop({ type: Date, required: true })
  checkInDate!: Date;

  @Prop({ type: Date, default: null })
  checkOutDate?: Date;

  @Prop({ type: String, enum: ['Active', 'Released'], default: 'Active' })
  status!: string;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const CampAllocationSchema = SchemaFactory.createForClass(CampAllocation);
CampAllocationSchema.index({ campId: 1 });
CampAllocationSchema.index({ projectCode: 1 });
CampAllocationSchema.index({ status: 1 });

export const CampAllocationModel = MongooseModule.forFeature([
  { name: CampAllocationModelName, schema: CampAllocationSchema },
]);
