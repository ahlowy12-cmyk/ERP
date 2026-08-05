import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const EquipmentAssignmentModelName = 'EquipmentAssignment';

@Schema({ timestamps: true, collection: 'equipment_assignments' })
export class EquipmentAssignment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  projectCode!: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  equipmentId!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  equipmentName!: string;

  @Prop({ type: String, default: '' })
  equipmentCode!: string;

  @Prop({ type: String, default: '' })
  serialNumber!: string;

  @Prop({ type: String, default: '' })
  siteName!: string;

  @Prop({ type: Date, required: true })
  assignedDate!: Date;

  @Prop({ type: Date, default: null })
  returnedDate?: Date;

  @Prop({
    type: String,
    enum: ['Assigned', 'Returned', 'In Transit', 'Under Maintenance'],
    default: 'Assigned',
  })
  status!: string;

  @Prop({ type: Number, default: 0 })
  hoursUsed!: number;

  @Prop({ type: Number, default: 0 })
  daysUsed!: number;

  @Prop({ type: Number, default: 0 })
  dailyRate!: number;

  @Prop({ type: Number, default: 0 })
  totalCost!: number;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const EquipmentAssignmentSchema = SchemaFactory.createForClass(EquipmentAssignment);
EquipmentAssignmentSchema.index({ projectCode: 1 });
EquipmentAssignmentSchema.index({ equipmentId: 1 });
EquipmentAssignmentSchema.index({ status: 1 });

export const EquipmentAssignmentModel = MongooseModule.forFeature([
  { name: EquipmentAssignmentModelName, schema: EquipmentAssignmentSchema },
]);
