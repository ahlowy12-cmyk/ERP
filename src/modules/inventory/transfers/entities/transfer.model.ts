import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: true })
export class TransferItem {
  @Prop({ type: String, required: true }) itemCode!: string;
  @Prop({ type: String, required: true }) itemName!: string;
  @Prop({ type: Number, required: true }) quantity!: number;
  @Prop({ type: String, required: true }) uom!: string;
}
const TransferItemSchema = SchemaFactory.createForClass(TransferItem);

@Schema({ timestamps: true })
export class Transfer {
  @Prop({ type: String, unique: true, index: true }) transferNumber!: string; // TRN-2026-001

  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  fromWarehouseId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  toWarehouseId!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now }) transferDate!: Date;
  @Prop({ type: String, required: true }) requestedBy!: string;

  @Prop({
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Posted', 'Cancelled'],
    default: 'Draft',
  })
  status!: string;

  @Prop({ type: [TransferItemSchema], default: [] }) items!: TransferItem[];
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);
export const TransferModelName = Transfer.name;
export const TransferModel = MongooseModule.forFeature([
  { name: TransferModelName, schema: TransferSchema },
]);
export type TransferDocument = HydratedDocument<Transfer>;
