import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Role {
  @Prop({ type: String, required: true, unique: true }) name!: string;
  @Prop({ type: String }) nameAr?: string;
  @Prop({ type: String }) description?: string;
  @Prop({ type: Boolean, default: false }) isSystem!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], default: [] })
  permissions!: Types.ObjectId[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
export const RoleModelName = Role.name;
export type RoleDocument = HydratedDocument<Role>;
export const RoleModel = MongooseModule.forFeature([
  { name: RoleModelName, schema: RoleSchema },
]);
