import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: true })
export class QuotationItem {
  @Prop({ type: String }) itemCode?: string;
  @Prop({ type: String, required: true }) itemName!: string;
  @Prop({ type: String }) itemDescription?: string;
  @Prop({ type: String, required: true }) uom!: string;
  @Prop({ type: Number, required: true }) quantity!: number;
  @Prop({ type: Number, required: true }) unitPrice!: number;
  @Prop({ type: Number, default: 0 }) discountPercent?: number;
  @Prop({ type: Number, default: 0 }) discountAmount?: number;
  @Prop({ type: Number, default: 15 }) taxPercent?: number;
  @Prop({ type: Number, default: 0 }) taxAmount?: number;
  @Prop({ type: Number, required: true }) totalPrice!: number;
  @Prop({ type: Number, default: 0 }) sortOrder?: number;
}
const QuotationItemSchema = SchemaFactory.createForClass(QuotationItem);

@Schema({ _id: true, timestamps: true })
export class QuotationAttachment {
  @Prop({ type: String, required: true }) fileName!: string;
  @Prop({ type: String }) fileSize?: string;
  @Prop({ type: String }) fileType?: string;
  @Prop({ type: String, required: true }) fileUrl!: string;
}
const QuotationAttachmentSchema =
  SchemaFactory.createForClass(QuotationAttachment);

@Schema({ timestamps: true })
export class Quotation {
  @Prop({ type: Types.ObjectId, ref: 'Rfq', required: true })
  rfqId!: Types.ObjectId;
  @Prop({ type: String, unique: true, index: true }) quotationNumber!: string;
  @Prop({ type: Number, required: true }) quotationSequence!: number;
  @Prop({ type: String, required: true }) procurementChain!: string;

  @Prop({ type: String, required: true }) vendorId!: string;
  @Prop({ type: String, required: true }) vendorName!: string;
  @Prop({ type: String }) vendorContactPerson?: string;
  @Prop({ type: String }) vendorPhone?: string;
  @Prop({ type: String }) vendorEmail?: string;

  @Prop({ type: Date }) quotationDate?: Date;
  @Prop({ type: Date }) validityDate?: Date;
  @Prop({ type: String, default: 'SAR' }) currency!: string;
  @Prop({ type: String }) deliveryLeadTime?: string;
  @Prop({ type: String }) deliveryLocation?: string;
  @Prop({ type: Boolean, default: false }) taxIncluded!: boolean;
  @Prop({ type: String }) paymentTerms?: string;
  @Prop({ type: String }) warrantyPeriod?: string;
  @Prop({ type: String }) remarks?: string;

  @Prop({ type: Number, required: true }) price!: number;
  @Prop({ type: Number }) subtotal?: number;
  @Prop({ type: Number, default: 0 }) discountPercent?: number;
  @Prop({ type: Number, default: 0 }) discountAmount?: number;
  @Prop({ type: Number, required: true, default: 15 }) taxPercent!: number;
  @Prop({ type: Number, required: true, default: 0 }) taxAmount!: number;
  @Prop({ type: Number, required: true }) totalAmount!: number;
  @Prop({ type: Number, default: 2 }) deliveryWeeks!: number;
  @Prop({ type: Date }) submissionDate?: Date;

  @Prop({ type: Boolean, default: false }) isBestPrice!: boolean;
  @Prop({ type: Boolean, default: false }) isRecommended!: boolean;
  @Prop({
    type: String,
    enum: ['Submitted', 'Accepted', 'Rejected', 'Revision Requested'],
    default: 'Submitted',
  })
  status!: string;

  @Prop({ type: [QuotationItemSchema], default: [] }) items!: QuotationItem[];
  @Prop({ type: [QuotationAttachmentSchema], default: [] })
  attachments!: QuotationAttachment[];
}

export const QuotationSchema = SchemaFactory.createForClass(Quotation);
export const QuotationModelName = Quotation.name;
export const QuotationModel = MongooseModule.forFeature([
  { name: QuotationModelName, schema: QuotationSchema },
]);
export type QuotationDocument = HydratedDocument<Quotation>;
