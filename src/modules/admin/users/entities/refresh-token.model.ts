import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId!: Types.ObjectId;
  @Prop({ type: String, required: true }) tokenHash!: string;
  @Prop({ type: String }) deviceInfo?: string;
  @Prop({ type: String }) ipAddress?: string;
  @Prop({ type: Date, required: true }) expiresAt!: Date;
  @Prop({ type: Boolean, default: false }) revoked!: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
export const RefreshTokenModelName = RefreshToken.name;
export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenModel = MongooseModule.forFeature([
  { name: RefreshTokenModelName, schema: RefreshTokenSchema },
]);
