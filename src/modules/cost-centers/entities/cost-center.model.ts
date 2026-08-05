import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export const CostCenterModelName = 'CostCenter';

@Schema({ timestamps: true, collection: 'cost_centers' })
export class CostCenter extends Document {
  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    enum: ['Project', 'Department', 'Overhead', 'General'],
    default: 'General',
  })
  type!: string;

  @Prop({ type: Types.ObjectId, ref: CostCenterModelName, default: null })
  parentId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  parentCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'Contract', default: null })
  contractId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  contractNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  projectCode?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const CostCenterSchema = SchemaFactory.createForClass(CostCenter);

// Index for fast lookup
CostCenterSchema.index({ code: 1 }, { unique: true });
CostCenterSchema.index({ type: 1 });
CostCenterSchema.index({ isActive: 1 });

export const CostCenterModel = MongooseModule.forFeature([
  { name: CostCenterModelName, schema: CostCenterSchema },
]);
