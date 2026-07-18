import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class ItemLedger {
  @Prop({ type: String, required: true, index: true })
  itemCode!: string; // نضع Index هنا لأننا سنبحث كثيراً بهذا الحقل

  @Prop({ type: Date, default: Date.now })
  date!: Date;

  @Prop({
    type: String,
    required: true,
    enum: ['MRV', 'MIV', 'TRN', 'ADJ', 'INI'],
  })
  type!: string; // نوع الحركة

  @Prop({ type: String, required: true })
  reference!: string; // المستند المرجعي (مثال: MRV-2026-001)

  @Prop({ type: Number, required: true, default: 0 })
  qtyIn!: number; // الكمية الواردة

  @Prop({ type: Number, required: true, default: 0 })
  qtyOut!: number; // الكمية المنصرفة

  @Prop({ type: Number, required: true })
  balance!: number; // الرصيد التراكمي بعد هذه الحركة

  @Prop({ type: Number, required: true })
  unitPrice!: number; // سعر الوحدة وقت الحركة
}

export const ItemLedgerSchema = SchemaFactory.createForClass(ItemLedger);
export const ItemLedgerModelName = ItemLedger.name;
export const ItemLedgerModel = MongooseModule.forFeature([
  { name: ItemLedgerModelName, schema: ItemLedgerSchema },
]);
export type ItemLedgerDocument = HydratedDocument<ItemLedger>;
