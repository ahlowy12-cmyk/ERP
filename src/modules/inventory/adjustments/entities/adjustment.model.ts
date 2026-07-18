import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: true })
export class AdjustmentItem {
  @Prop({ type: String, required: true }) itemCode!: string;
  @Prop({ type: String, required: true }) itemName!: string;
  @Prop({ type: Number, required: true }) systemQuantity!: number;
  @Prop({ type: Number, required: true }) adjustedQuantity!: number; // الكمية الفعلية الجديدة
  @Prop({ type: String, required: true, enum: ['Addition', 'Deduction'] })
  adjustmentType!: string;
  @Prop({ type: Number, required: true }) unitPrice!: number;
  @Prop({ type: String }) reason?: string;
}
const AdjustmentItemSchema = SchemaFactory.createForClass(AdjustmentItem);

@Schema({ timestamps: true })
export class StockAdjustment {
  @Prop({ type: String, unique: true, index: true }) adjustmentNumber!: string; // ADJ-2026-001

  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId!: Types.ObjectId;
  @Prop({ type: Date, default: Date.now }) adjustmentDate!: Date;
  @Prop({ type: String, required: true }) requestedBy!: string;

  @Prop({
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Posted', 'Cancelled'],
    default: 'Draft',
  })
  status!: string;

  @Prop({ type: Number, default: 0 }) totalValue!: number;

  @Prop({ type: String }) adjNumber?: string;
  @Prop({ type: String }) approvedBy?: string;
  @Prop({ type: Date }) approvedAt?: Date;

  @Prop({ type: [AdjustmentItemSchema], default: [] }) items!: AdjustmentItem[];
}

export const StockAdjustmentSchema =
  SchemaFactory.createForClass(StockAdjustment);
export const StockAdjustmentModelName = StockAdjustment.name;
export const StockAdjustmentModel = MongooseModule.forFeature([
  { name: StockAdjustmentModelName, schema: StockAdjustmentSchema },
]);
export type StockAdjustmentDocument = HydratedDocument<StockAdjustment>;
