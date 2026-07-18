import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PasswordResetToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId!: Types.ObjectId;
  @Prop({ type: String, required: true }) tokenHash!: string;
  @Prop({ type: Date, required: true }) expiresAt!: Date;
  @Prop({ type: Boolean, default: false }) used!: boolean;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);
export const PasswordResetTokenModelName = PasswordResetToken.name;
export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;
export const PasswordResetTokenModel = MongooseModule.forFeature([
  { name: PasswordResetTokenModelName, schema: PasswordResetTokenSchema },
]);
