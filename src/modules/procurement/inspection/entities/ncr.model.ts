import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Ncr {
  @Prop({ type: String, unique: true, index: true }) ncrNumber!: string; // NCR-2026-001

  @Prop({ type: Types.ObjectId, ref: 'InspectionRequest' })
  inspectionRequestId?: Types.ObjectId;
  @Prop({ type: String }) poNumber?: string;
  @Prop({ type: String, required: true }) vendorName!: string;

  @Prop({ type: Date, default: Date.now }) issueDate!: Date;

  @Prop({ type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' })
  severity!: string;

  @Prop({ type: String, required: true }) description!: string;
  @Prop({ type: String }) rootCause?: string;
  @Prop({ type: String }) correctiveAction?: string;

  @Prop({
    type: String,
    enum: ['Open', 'In Progress', 'Closed'],
    default: 'Open',
  })
  status!: string;

  @Prop({ type: Date }) resolvedDate?: Date;
  @Prop({ type: String }) resolvedBy?: string;
}

export const NcrSchema = SchemaFactory.createForClass(Ncr);
export const NcrModelName = Ncr.name;
export const NcrModel = MongooseModule.forFeature([
  { name: NcrModelName, schema: NcrSchema },
]);
export type NcrDocument = HydratedDocument<Ncr>;
