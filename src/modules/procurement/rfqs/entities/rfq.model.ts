import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RFQ {
  @Prop({ type: String, required: true, unique: true }) rfqNumber!: string;
  @Prop({ type: String }) title?: string;
  @Prop({ type: Types.ObjectId, ref: 'PurchaseRequest', required: true })
  purchaseRequestId!: Types.ObjectId;
  @Prop({ type: Date, required: true }) deadlineDate!: Date;
  @Prop({
    type: String,
    enum: [
      'Draft',
      'Published',
      'Partially Responded',
      'Closed',
      'Awarded',
      'Cancelled',
    ],
    default: 'Draft',
  })
  status!: string;
  @Prop({ type: Array, required: true }) items!: any[];

  // الحقول التي كانت مفقودة وتسببت في الأخطاء
  @Prop({ type: Array, default: [] }) vendors!: any[];
  @Prop({ type: String }) awardedVendorId?: string;
  @Prop({ type: String }) awardedVendorName?: string;
  @Prop({ type: String }) awardedQuotationId?: string;
  @Prop({ type: String }) awardedQuotationNumber?: string;
  @Prop({ type: String }) procurementChain?: string;

  @Prop({ type: Boolean, default: false }) isDeleted!: boolean;
}

export const RFQSchema = SchemaFactory.createForClass(RFQ);
export type RFQDocument = HydratedDocument<RFQ>;
export const RFQModelName = RFQ.name;
export const RfqModel = MongooseModule.forFeature([
  { name: RFQModelName, schema: RFQSchema },
]);
export const RfqModelName = RFQModelName;
export type RfqDocument = RFQDocument;
