// src/modules/procurement/vendors/entities/vendor.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ type: String, required: true, unique: true }) code!: string;
  @Prop({ type: String, required: true }) nameEn!: string;
  @Prop({ type: String }) nameAr?: string;

  @Prop({ type: String, required: true, unique: true }) email!: string;
  @Prop({ type: String }) phone?: string;
  @Prop({ type: String }) address?: string;

  @Prop({ type: String }) taxId?: string; // الرقم الضريبي
  @Prop({ type: String }) commercialRegister?: string; // السجل التجاري

  @Prop({
    type: String,
    enum: ['Active', 'Inactive', 'Blocked'],
    default: 'Active',
  })
  status!: string;
  @Prop({ type: Number, min: 1, max: 5 }) rating?: number; // تقييم المورد

  @Prop({ type: Types.ObjectId, ref: 'User' }) createdBy?: Types.ObjectId;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
export const VendorModelName = Vendor.name;
export type VendorDocument = HydratedDocument<Vendor>;
