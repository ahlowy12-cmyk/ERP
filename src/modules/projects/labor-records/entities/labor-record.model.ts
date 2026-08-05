import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const LaborRecordModelName = 'LaborRecord';

@Schema({ timestamps: true, collection: 'labor_records' })
export class LaborRecord extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  projectCode!: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  employeeId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  employeeName!: string;

  @Prop({ type: String, default: '' })
  role!: string;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ type: Number, default: 0, min: 0 })
  regularHours!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  overtimeHours!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  hourlyRate!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  overtimeRate!: number;

  @Prop({ type: Number, default: 0 })
  totalCost!: number; // (regularHours * hourlyRate) + (overtimeHours * overtimeRate)

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const LaborRecordSchema = SchemaFactory.createForClass(LaborRecord);
LaborRecordSchema.index({ projectCode: 1 });
LaborRecordSchema.index({ date: -1 });
LaborRecordSchema.index({ employeeId: 1 });

export const LaborRecordModel = MongooseModule.forFeature([
  { name: LaborRecordModelName, schema: LaborRecordSchema },
]);
