import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ type: String, required: true, unique: true }) code!: string; // مثال: WH-01
  @Prop({ type: String, required: true }) nameEn!: string;
  @Prop({ type: String, required: true }) nameAr!: string;

  @Prop({ type: String }) location?: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) managerId?: Types.ObjectId;

  // 👈 حقول الحذف المنطقي (Soft Delete)
  @Prop({ type: Boolean, default: false }) isDeleted!: boolean;
  @Prop({ type: Date, default: null }) deletedAt!: Date;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
export const WarehouseModelName = Warehouse.name;
export type WarehouseDocument = HydratedDocument<Warehouse>;

// 🛡️ Middleware: استبعاد المستودعات المحذوفة تلقائياً من جميع عمليات البحث
WarehouseSchema.pre('find', function (next) {
  this.setQuery({ ...this.getQuery(), isDeleted: false });
  if (typeof next === 'function') next();
});

WarehouseSchema.pre('findOne', function (next) {
  this.setQuery({ ...this.getQuery(), isDeleted: false });
  if (typeof next === 'function') next();
});
