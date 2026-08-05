import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// ──────────────────────────────────────────────────────────────
// 1. PM SCHEDULE (جدول الصيانة الوقائية)
// ──────────────────────────────────────────────────────────────
export const PMScheduleModelName = 'PMSchedule';

@Schema({ timestamps: true, collection: 'pm_schedules' })
export class PMSchedule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  assetId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  assetNumber!: string;

  @Prop({ required: true, trim: true })
  equipmentName!: string;

  @Prop({ required: true, unique: true, trim: true })
  pmCode!: string;

  @Prop({ required: true, trim: true })
  taskDescription!: string;

  @Prop({ type: Number, required: true })
  frequencyDays!: number;

  @Prop({ type: Date, default: null })
  lastDoneDate?: Date;

  @Prop({ type: Date, required: true })
  nextDueDate!: Date;

  @Prop({
    type: String,
    enum: ['Active', 'Paused'],
    default: 'Active',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const PMScheduleSchema = SchemaFactory.createForClass(PMSchedule);
// Note: pmCode is unique via @Prop({ unique: true })
PMScheduleSchema.index({ assetId: 1 });
PMScheduleSchema.index({ nextDueDate: 1 });
PMScheduleSchema.index({ status: 1 });

export const PMScheduleModel = MongooseModule.forFeature([
  { name: PMScheduleModelName, schema: PMScheduleSchema },
]);

// ──────────────────────────────────────────────────────────────
// 2. WORK ORDER (أمر العمل)
// ──────────────────────────────────────────────────────────────
export const WorkOrderModelName = 'WorkOrder';

const SparePartSchema = new (require('mongoose').Schema)(
  {
    itemCode:  { type: String, required: true },
    itemName:  { type: String, required: true },
    quantity:  { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, default: 0 },
  },
  { _id: false },
);

@Schema({ timestamps: true, collection: 'work_orders' })
export class WorkOrder extends Document {
  @Prop({ required: true, unique: true, trim: true })
  woNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  assetId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  assetNumber!: string;

  @Prop({ required: true, trim: true })
  equipmentName!: string;

  @Prop({
    type: String,
    enum: ['Preventive', 'Breakdown', 'Calibration'],
    required: true,
  })
  type!: string;

  @Prop({
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium',
  })
  priority!: string;

  @Prop({ required: true, trim: true })
  issueDescription!: string;

  @Prop({ type: String, default: null })
  assignedToTechnician?: string;

  // Reference to PM Schedule (if generated from PM)
  @Prop({ type: Types.ObjectId, ref: 'PMSchedule', default: null })
  pmScheduleId?: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  createdDate!: Date;

  @Prop({ type: Date, default: null })
  startDate?: Date;

  @Prop({ type: Date, default: null })
  completedDate?: Date;

  @Prop({
    type: String,
    enum: ['Open', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Open',
  })
  status!: string;

  @Prop({ type: [SparePartSchema], default: [] })
  sparePartsUsed!: {
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
  }[];

  @Prop({ type: Number, default: 0 })
  laborHoursCost!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const WorkOrderSchema = SchemaFactory.createForClass(WorkOrder);
// Note: woNumber is unique via @Prop({ unique: true })
WorkOrderSchema.index({ assetId: 1 });
WorkOrderSchema.index({ status: 1 });
WorkOrderSchema.index({ type: 1 });
WorkOrderSchema.index({ priority: 1 });
WorkOrderSchema.index({ createdDate: -1 });

export const WorkOrderModel = MongooseModule.forFeature([
  { name: WorkOrderModelName, schema: WorkOrderSchema },
]);
