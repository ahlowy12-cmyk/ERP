import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const EquipmentTransferModelName = 'EquipmentTransfer';

@Schema({ timestamps: true, collection: 'equipment_transfers' })
export class EquipmentTransfer extends Document {
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

  @Prop({ required: true, trim: true })
  fromLocation!: string;

  @Prop({ required: true, trim: true })
  toLocation!: string;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, default: null })
  endDate?: Date;

  @Prop({ type: Number, default: 0 })
  transportationHours!: number;

  @Prop({ type: Number, default: 0 })
  transportationCost!: number;

  @Prop({ type: String, default: null })
  reason?: string;

  @Prop({
    type: String,
    enum: ['Pending', 'In Transit', 'Completed'],
    default: 'Pending',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const EquipmentTransferSchema = SchemaFactory.createForClass(EquipmentTransfer);
EquipmentTransferSchema.index({ projectCode: 1 });
EquipmentTransferSchema.index({ equipmentId: 1 });
EquipmentTransferSchema.index({ status: 1 });

export const EquipmentTransferModel = MongooseModule.forFeature([
  { name: EquipmentTransferModelName, schema: EquipmentTransferSchema },
]);
