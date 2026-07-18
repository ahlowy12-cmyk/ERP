import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ type: String, required: true, unique: true, index: true })
  code!: string; // مثال: WH-003

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String })
  location?: string;

  @Prop({ type: String, enum: ['Active', 'Inactive'], default: 'Active' })
  status!: string;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
export const WarehouseModelName = Warehouse.name;

export const WarehouseModel = MongooseModule.forFeature([
  { name: WarehouseModelName, schema: WarehouseSchema },
]);

export type WarehouseDocument = HydratedDocument<Warehouse>;
