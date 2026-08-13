import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;

@Schema({ timestamps: true, collection: 'password_reset_tokens' })
export class PasswordResetToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  token!: string;          // hashed token stored in DB

  @Prop({ type: Date, required: true })
  expiresAt!: Date;        // typically 1 hour

  @Prop({ type: Boolean, default: false })
  used!: boolean;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete
export const PasswordResetTokenModelName = PasswordResetToken.name;
export const PasswordResetTokenModel = MongooseModule.forFeature([
  { name: PasswordResetTokenModelName, schema: PasswordResetTokenSchema },
]);
