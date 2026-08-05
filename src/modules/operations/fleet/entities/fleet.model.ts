import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ─── Vehicle ────────────────────────────────────────────────────────────────
export const VehicleModelName = 'Vehicle';

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle extends Document {
  @Prop({ required: true, unique: true, trim: true })
  vehicleCode!: string;

  @Prop({ required: true, unique: true, trim: true })
  plateNumber!: string;

  @Prop({
    type: String,
    enum: ['Pickup', 'Crane', 'Forklift', 'Bus', 'Tanker', 'Heavy Truck', 'Other'],
    required: true,
  })
  type!: string;

  @Prop({ required: true, trim: true })
  make!: string;

  @Prop({ type: String, default: '' })
  modelName!: string;

  @Prop({ type: Number, default: null })
  year?: number;

  @Prop({ type: String, default: '' })
  color!: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  currentProjectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  currentProjectCode?: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({
    type: String,
    enum: ['Available', 'In Use', 'Maintenance', 'Decommissioned'],
    default: 'Available',
  })
  status!: string;

  @Prop({ type: Number, default: 0 })
  currentOdometer!: number;

  @Prop({ type: Date, default: null })
  lastServiceDate?: Date;

  @Prop({ type: Number, default: null })
  nextServiceDueKm?: number;

  @Prop({ type: String, default: null })
  assignedDriver?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
VehicleSchema.index({ vehicleCode: 1 }, { unique: true });
VehicleSchema.index({ plateNumber: 1 }, { unique: true });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ currentProjectCode: 1 });

export const VehicleModel = MongooseModule.forFeature([
  { name: VehicleModelName, schema: VehicleSchema },
]);

// ─── Trip ───────────────────────────────────────────────────────────────────
export const TripModelName = 'Trip';

@Schema({ timestamps: true, collection: 'trips' })
export class Trip extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicleId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  vehicleCode!: string;

  @Prop({ type: String, default: null })
  plateNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ required: true, trim: true })
  driverName!: string;

  @Prop({ required: true, trim: true })
  startLocation!: string;

  @Prop({ required: true, trim: true })
  endLocation!: string;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, default: null })
  endDate?: Date;

  @Prop({ type: Number, required: true, min: 0 })
  startOdometer!: number;

  @Prop({ type: Number, default: null })
  endOdometer?: number;

  @Prop({ type: Number, default: null })
  distance?: number; // auto: endOdometer - startOdometer

  @Prop({ type: String, default: '' })
  purpose!: string;

  @Prop({ type: String, enum: ['In Progress', 'Completed'], default: 'In Progress' })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const TripSchema = SchemaFactory.createForClass(Trip);
TripSchema.index({ vehicleId: 1 });
TripSchema.index({ projectCode: 1 });
TripSchema.index({ startDate: -1 });

export const TripModel = MongooseModule.forFeature([
  { name: TripModelName, schema: TripSchema },
]);
