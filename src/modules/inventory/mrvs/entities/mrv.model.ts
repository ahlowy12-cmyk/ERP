import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
class MRVItem {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  itemId!: Types.ObjectId;
  @Prop({ type: Number, required: true }) expectedQuantity!: number;
  @Prop({ type: Number, required: true, min: 0 }) receivedQuantity!: number;
  @Prop({ type: Number, default: 0 }) acceptedQuantity!: number;
  @Prop({ type: Number, default: 0 }) rejectedQuantity!: number;
  @Prop({ type: String }) notes?: string;
}

@Schema({ timestamps: true })
export class MRV {
  @Prop({ type: String, required: true, unique: true }) mrvNumber!: string;
  @Prop({ type: Types.ObjectId, ref: 'PurchaseOrder', required: true })
  poId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId!: Types.ObjectId;

  @Prop({ type: String }) approvedBy?: string;
  @Prop({ type: Date }) approvedAt?: Date;

  @Prop({ type: Boolean, default: false }) isDeleted!: boolean;

  @Prop({ type: Date, required: true }) receivedDate!: Date;
  @Prop({ type: String }) deliveryNoteNumber?: string; // رقم بوليصة الشحن من المورد

  @Prop({
    type: String,
    enum: ['Draft', 'Inspected', 'Posted'],
    default: 'Draft',
  })
  status!: string;

  @Prop({ type: [SchemaFactory.createForClass(MRVItem)], required: true })
  items!: MRVItem[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receivedById!: Types.ObjectId;
}

export const MRVSchema = SchemaFactory.createForClass(MRV);
export const MRVModelName = MRV.name;
export type MRVDocument = HydratedDocument<MRV>;
export const MRVModel = MongooseModule.forFeature([
  { name: MRVModelName, schema: MRVSchema },
]);
export const MrvModel = MRVModel;
export const MrvModelName = MRVModelName;
export type MrvDocument = MRVDocument;
