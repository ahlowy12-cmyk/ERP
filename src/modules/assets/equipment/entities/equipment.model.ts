import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const EquipmentModelName = 'Equipment';

@Schema({ timestamps: true, collection: 'equipment' })
export class Equipment extends Document {
  @Prop({ required: true, unique: true, trim: true })
  assetNumber!: string;

  @Prop({ required: true, unique: true, trim: true })
  equipmentCode!: string;

  @Prop({ required: true, trim: true })
  equipmentName!: string;

  @Prop({
    type: String,
    enum: [
      'Rig',
      'Generator',
      'Crane',
      'Truck',
      'Pump',
      'Compressor',
      'Heavy Equipment',
      'Safety Equipment',
    ],
    required: true,
  })
  category!: string;

  @Prop({ required: true, trim: true })
  manufacturer!: string;

  @Prop({ required: true, trim: true })
  modelName!: string;

  @Prop({ required: true, unique: true, trim: true })
  serialNumber!: string;

  // Financial Data
  @Prop({ type: Date, required: true })
  purchaseDate!: Date;

  @Prop({ type: Number, default: 0 })
  purchaseCost!: number;

  @Prop({ type: Number, default: 0 })
  currentValue!: number;

  @Prop({ type: String, default: 'Straight Line' })
  depreciationMethod!: string;

  // Location & Assignment
  @Prop({ type: String, default: '' })
  location!: string;

  @Prop({ type: String, default: null })
  projectAssignment?: string; // projectCode

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: '' })
  costCenter!: string;

  @Prop({ type: String, default: '' })
  department!: string;

  // Status & Meters
  @Prop({
    type: String,
    enum: ['Active', 'Standby', 'Maintenance', 'Out Of Service'],
    default: 'Standby',
  })
  status!: string;

  @Prop({ type: Number, default: 0 })
  operatingHours!: number;

  @Prop({ type: Date, default: null })
  lastMaintenanceDate?: Date;

  @Prop({ type: Date, default: null })
  nextMaintenanceDate?: Date;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);

EquipmentSchema.index({ equipmentCode: 1 }, { unique: true });
EquipmentSchema.index({ assetNumber: 1 }, { unique: true });
EquipmentSchema.index({ serialNumber: 1 }, { unique: true });
EquipmentSchema.index({ status: 1 });
EquipmentSchema.index({ category: 1 });
EquipmentSchema.index({ projectAssignment: 1 });

export const EquipmentModel = MongooseModule.forFeature([
  { name: EquipmentModelName, schema: EquipmentSchema },
]);
