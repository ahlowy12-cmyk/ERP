import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: true })
export class StockCountItem {
  @Prop({ type: String, required: true }) itemCode!: string;
  @Prop({ type: String, required: true }) itemName!: string;
  @Prop({ type: Number, required: true }) systemQuantity!: number;
  @Prop({ type: Number, required: true }) countedQuantity!: number;
  @Prop({ type: Number, required: true }) variance!: number; // (countedQuantity - systemQuantity)
}
const StockCountItemSchema = SchemaFactory.createForClass(StockCountItem);

@Schema({ timestamps: true })
export class StockCount {
  @Prop({ type: String, unique: true, index: true }) countNumber!: string; // CNT-2026-001

  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId!: Types.ObjectId;
  @Prop({ type: Date, default: Date.now }) countDate!: Date;
  @Prop({ type: String, required: true }) countedBy!: string;

  @Prop({ type: String, enum: ['Draft', 'Completed'], default: 'Draft' })
  status!: string;

  @Prop({ type: [StockCountItemSchema], default: [] }) items!: StockCountItem[];
}

export const StockCountSchema = SchemaFactory.createForClass(StockCount);
export const StockCountModelName = StockCount.name;
export const StockCountModel = MongooseModule.forFeature([
  { name: StockCountModelName, schema: StockCountSchema },
]);
export type StockCountDocument = HydratedDocument<StockCount>;
