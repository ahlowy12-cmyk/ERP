import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
class PRItem {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  itemId!: Types.ObjectId;
  @Prop({ type: Number, required: true, min: 1 }) quantity!: number;
  @Prop({ type: String }) notes?: string;
}

@Schema({ timestamps: true })
export class PurchaseRequest {
  @Prop({ type: String, unique: true, sparse: true }) prNumber?: string;
  @Prop({ type: String, unique: true, sparse: true }) requestNumber?: string;
  @Prop({ type: String }) documentNumber?: string;
  @Prop({ type: String }) procurementChain?: string;
  @Prop({ type: String }) rootProcurementNumber?: string;
  @Prop({ type: String }) chainId?: string;

  @Prop({ type: String }) chargeType?: string;
  @Prop({ type: Types.ObjectId, ref: 'Project' }) projectId?: Types.ObjectId;
  @Prop({ type: String }) projectName?: string;
  @Prop({ type: Types.ObjectId, ref: 'Asset' }) assetId?: Types.ObjectId;
  @Prop({ type: String }) assetName?: string;
  @Prop({ type: String }) costCenter?: string;

  @Prop({ type: String }) department?: string;
  @Prop({ type: String }) requestedBy?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requesterId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId!: Types.ObjectId;

  @Prop({ type: Date, required: true }) requestDate!: Date;
  @Prop({ type: Date, required: true }) requiredDate!: Date;

  @Prop({
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Closed'],
    default: 'Draft',
  })
  status!: string;

  @Prop({ type: String }) justification?: string; // مبرر الشراء

  @Prop({ type: [SchemaFactory.createForClass(PRItem)], required: true })
  items!: PRItem[];
}

export const PurchaseRequestSchema =
  SchemaFactory.createForClass(PurchaseRequest);
export const PurchaseRequestModelName = PurchaseRequest.name;
export type PurchaseRequestDocument = HydratedDocument<PurchaseRequest>;
export const PurchaseRequestModel = MongooseModule.forFeature([
  { name: PurchaseRequestModelName, schema: PurchaseRequestSchema },
]);
