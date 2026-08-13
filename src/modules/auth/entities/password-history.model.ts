import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export type PasswordHistoryDocument = HydratedDocument<PasswordHistory>;

@Schema({ timestamps: true, collection: 'password_histories' })
export class PasswordHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  passwordHash!: string;    // bcrypt hash of old password

  @Prop({ type: Date, default: Date.now })
  changedAt!: Date;
}

export const PasswordHistorySchema = SchemaFactory.createForClass(PasswordHistory);
export const PasswordHistoryModelName = PasswordHistory.name;
export const PasswordHistoryModel = MongooseModule.forFeature([
  { name: PasswordHistoryModelName, schema: PasswordHistorySchema },
]);
