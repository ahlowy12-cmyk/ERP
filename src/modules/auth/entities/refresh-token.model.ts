import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ timestamps: true, collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  token!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Boolean, default: false })
  revoked!: boolean;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: String })
  ipAddress?: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
export const RefreshTokenModelName = RefreshToken.name;
export const RefreshTokenModel = MongooseModule.forFeature([
  { name: RefreshTokenModelName, schema: RefreshTokenSchema },
]);
