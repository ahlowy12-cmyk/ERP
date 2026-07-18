import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PurchaseOrder {
  @Prop({ type: String, required: true, unique: true }) poNumber!: string;
  @Prop({ type: String }) documentNumber?: string;
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId!: Types.ObjectId;
  @Prop({
    type: String,
    enum: [
      'Draft',
      'Pending Approval',
      'Approved',
      'Issued',
      'Completed',
      'Cancelled',
    ],
    default: 'Draft',
  })
  status!: string;
  @Prop({ type: Array, required: true }) items!: any[];
  @Prop({ type: Number, required: true }) totalValue!: number;

  // مسار الاعتماد الذي كان مفقوداً في النسخ السابقة
  @Prop({ type: Array, default: [] }) approvalWorkflow!: any[];

  @Prop({ type: String }) contractFileUrl?: string;
  @Prop({ type: String }) contractNumber?: string;
  @Prop({ type: String }) contractTitle?: string;

  @Prop({ type: Boolean, default: false }) isDeleted!: boolean;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);
export type PurchaseOrderDocument = HydratedDocument<PurchaseOrder>;
export const PurchaseOrderModelName = PurchaseOrder.name;
export const PurchaseOrderModel = MongooseModule.forFeature([
  { name: PurchaseOrderModelName, schema: PurchaseOrderSchema },
]);
