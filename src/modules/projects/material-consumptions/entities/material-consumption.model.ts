import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const MaterialConsumptionModelName = 'MaterialConsumption';

@Schema({ timestamps: true, collection: 'material_consumptions' })
export class MaterialConsumption extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  projectCode!: string;

  @Prop({ type: String, default: null })
  costCenterCode?: string;

  @Prop({ required: true, trim: true })
  materialCode!: string;

  @Prop({ type: String, default: '' })
  materialName!: string;

  @Prop({ type: String, default: '' })
  warehouse!: string;

  @Prop({ type: Number, required: true, min: 0 })
  issuedQuantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  consumedQuantity!: number;

  @Prop({ type: String, default: 'unit' })
  unit!: string;

  @Prop({ type: Number, default: 0 })
  unitPrice!: number;

  @Prop({ type: Number, default: 0 })
  cost!: number; // consumedQuantity * unitPrice

  @Prop({ type: String, default: null })
  docRef?: string; // MIV reference

  @Prop({ type: Date, required: true })
  issueDate!: Date;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const MaterialConsumptionSchema = SchemaFactory.createForClass(MaterialConsumption);
MaterialConsumptionSchema.index({ projectCode: 1 });
MaterialConsumptionSchema.index({ materialCode: 1 });
MaterialConsumptionSchema.index({ issueDate: -1 });

export const MaterialConsumptionModel = MongooseModule.forFeature([
  { name: MaterialConsumptionModelName, schema: MaterialConsumptionSchema },
]);
