import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Sequence {
  @Prop({ type: String, required: true, unique: true, index: true })
  key!: string; // مثال: 'PR-2026' أو 'RFQ-2026-0001'

  @Prop({ type: Number, default: 0 })
  value!: number; // الرقم التسلسلي الأخير
}

export const SequenceSchema = SchemaFactory.createForClass(Sequence);
export const SequenceModelName = Sequence.name;

export const SequenceModel = MongooseModule.forFeature([
  { name: SequenceModelName, schema: SequenceSchema },
]);

export type SequenceDocument = HydratedDocument<Sequence>;
