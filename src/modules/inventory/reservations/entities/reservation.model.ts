import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Sub-Schema for Reservation Items
@Schema({ _id: true })
export class ReservationItem {
  @Prop({ type: String, required: true }) itemCode!: string;
  @Prop({ type: String, required: true }) itemName!: string;
  @Prop({ type: String, required: true }) uom!: string;
  @Prop({ type: Number, required: true }) requestedQuantity!: number;
  @Prop({ type: Number, default: 0 }) reservedQuantity!: number; // الكمية التي تم حجزها فعلياً
  @Prop({ type: Number, required: true }) unitPrice!: number;
}
const ReservationItemSchema = SchemaFactory.createForClass(ReservationItem);

// Main Reservation Schema
@Schema({ timestamps: true })
export class InventoryReservation {
  @Prop({ type: String, unique: true, index: true }) reservationNumber!: string; // RSV-2026-001

  @Prop({ type: String, required: true }) projectCode!: string;
  @Prop({ type: String, required: true }) projectName!: string;

  @Prop({ type: String, required: true }) requestedBy!: string;
  @Prop({ type: Date, default: Date.now }) requestDate!: Date;
  @Prop({ type: Date, required: true }) requiredDate!: Date;

  @Prop({
    type: String,
    enum: [
      'Pending',
      'Approved',
      'Partially Reserved',
      'Released',
      'Cancelled',
    ],
    default: 'Pending',
  })
  status!: string;

  @Prop({ type: Number, default: 0 }) totalValue!: number;
  @Prop({ type: String }) notes?: string;

  @Prop({ type: [ReservationItemSchema], default: [] })
  items!: ReservationItem[];
}

export const InventoryReservationSchema =
  SchemaFactory.createForClass(InventoryReservation);
export const InventoryReservationModelName = InventoryReservation.name;
export const InventoryReservationModel = MongooseModule.forFeature([
  { name: InventoryReservationModelName, schema: InventoryReservationSchema },
]);
export type InventoryReservationDocument =
  HydratedDocument<InventoryReservation>;
