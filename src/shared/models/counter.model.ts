import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Counter {
  @Prop({ type: String, required: true, unique: true })
  _id!: string; // مثال: 'PR', 'PO', 'MRV'

  @Prop({ type: Number, default: 0 })
  seq!: number; // الرقم التسلسلي الحالي
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
export const CounterModelName = Counter.name;
export const CounterModel = MongooseModule.forFeature([
  { name: CounterModelName, schema: CounterSchema },
]);
export type CounterDocument = HydratedDocument<Counter>;
