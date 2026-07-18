import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Permission {
  @Prop({ type: String, required: true, unique: true }) name!: string;
  @Prop({ type: String }) description?: string;
  @Prop({ type: String, required: true }) module!: string;
  @Prop({ type: String, required: true }) action!: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
export const PermissionModelName = Permission.name;
export type PermissionDocument = HydratedDocument<Permission>;
export const PermissionModel = MongooseModule.forFeature([
  { name: PermissionModelName, schema: PermissionSchema },
]);
