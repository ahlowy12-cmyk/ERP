import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const TimesheetModelName = 'Timesheet';

const DayEntrySchema = new (require('mongoose').Schema)({
  dayNumber: { type: Number, required: true, min: 1, max: 31 },
  date: { type: Date, required: true },
  operatingHours: { type: Number, default: 0, min: 0, max: 24 },
  standbyHours:   { type: Number, default: 0, min: 0, max: 24 },
  repairHours:    { type: Number, default: 0, min: 0, max: 24 },
  downtimeHours:  { type: Number, default: 0, min: 0, max: 24 },
  rigMoveHours:   { type: Number, default: 0, min: 0, max: 24 },
  totalHours:     { type: Number, default: 0 },
  comments:       { type: String, default: '' },
  status:         { type: String, enum: ['Draft', 'Approved'], default: 'Draft' },
}, { _id: false });

@Schema({ timestamps: true, collection: 'timesheets' })
export class Timesheet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  rigId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  rigName!: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ required: true, trim: true })
  month!: string; // e.g. "2026-08"

  @Prop({ type: Number, required: true })
  year!: number;

  @Prop({ type: Number, required: true, min: 1, max: 12 })
  monthNumber!: number;

  @Prop({ type: [DayEntrySchema], default: [] })
  days!: {
    dayNumber: number;
    date: Date;
    operatingHours: number;
    standbyHours: number;
    repairHours: number;
    downtimeHours: number;
    rigMoveHours: number;
    totalHours: number;
    comments: string;
    status: string;
  }[];

  // Monthly totals (auto-calculated)
  @Prop({ type: Number, default: 0 }) totalOperatingHours!: number;
  @Prop({ type: Number, default: 0 }) totalStandbyHours!: number;
  @Prop({ type: Number, default: 0 }) totalRepairHours!: number;
  @Prop({ type: Number, default: 0 }) totalDowntimeHours!: number;
  @Prop({ type: Number, default: 0 }) totalRigMoveHours!: number;

  @Prop({
    type: String,
    enum: ['Draft', 'Submitted', 'Approved'],
    default: 'Draft',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const TimesheetSchema = SchemaFactory.createForClass(Timesheet);
TimesheetSchema.index({ rigId: 1, month: 1 }, { unique: true });
TimesheetSchema.index({ projectCode: 1 });
TimesheetSchema.index({ month: 1 });

export const TimesheetModel = MongooseModule.forFeature([
  { name: TimesheetModelName, schema: TimesheetSchema },
]);
