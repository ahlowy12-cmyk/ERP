import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({ type: String, required: true, unique: true }) itemCode!: string;
  @Prop({ type: String, required: true }) nameEn!: string;
  @Prop({ type: String, required: true }) nameAr!: string;
  @Prop({ type: String, required: true }) category!: string;
  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  defaultWarehouse?: Types.ObjectId;
  @Prop({ type: Number, default: 0 }) quantity!: number;
  @Prop({ type: Number, default: 0 }) minQuantity!: number;
  @Prop({ type: String, default: 'Available' }) status!: string;
  @Prop({ type: Boolean, default: false }) isDeleted!: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(InventoryItem);

// 👈 الحل الجذري لمشكلة الـ where في النسخ الحديثة
ItemSchema.pre('find', function (next) {
  this.setQuery({ ...this.getQuery(), isDeleted: false });
  if (typeof next === 'function') next();
});

ItemSchema.pre('findOne', function (next) {
  this.setQuery({ ...this.getQuery(), isDeleted: false });
  if (typeof next === 'function') next();
});

export const ItemModelName = InventoryItem.name;
