import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MIV {
  @Prop({ type: String, unique: true, sparse: true }) documentNumber?: string;
  @Prop({ type: String }) mivNumber?: string;
  @Prop({ type: String }) approvedBy?: string;
  @Prop({ type: Date }) approvedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy!: Types.ObjectId;
  @Prop({
    type: String,
    enum: ['Draft', 'Approved', 'Issued', 'Rejected'],
    default: 'Draft',
  })
  status!: string;
  @Prop({ type: Array, required: true }) items!: any[];
  @Prop({ type: String }) remarks?: string;
  @Prop({ type: Boolean, default: false }) isDeleted!: boolean;
}

export const MIVSchema = SchemaFactory.createForClass(MIV);
export type MIVDocument = HydratedDocument<MIV>;
export const MIVModelName = MIV.name;
export const MIVModel = MongooseModule.forFeature([
  { name: MIVModelName, schema: MIVSchema },
]);
