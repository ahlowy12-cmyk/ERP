import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  // --- Basic Information ---
  @Prop({ type: String, required: true, unique: true })
  username!: string;

  @Prop({ type: String, required: true, unique: true })
  email!: string;

  @Prop({ type: String, required: true })
  fullName!: string;

  @Prop({ type: String })
  fullNameAr?: string;

  @Prop({ type: String, required: true })
  passwordHash!: string;

  // --- Relations ---
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // --- Employment & Profile ---
  @Prop({ type: String, unique: true, sparse: true })
  employeeId?: string;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: String })
  avatarUrl?: string;

  @Prop({ type: String })
  companyName?: string;

  // --- Settings & Status ---
  @Prop({
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Active',
  })
  status!: string;

  @Prop({ type: String, default: 'ar' })
  preferredLanguage!: string;

  @Prop({ type: String, default: 'Asia/Riyadh' })
  timezone!: string;

  @Prop({ type: Boolean, default: true })
  emailNotifications!: boolean;

  // --- Security & Auditing ---
  @Prop({ type: Date })
  lastLogin?: Date;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts!: number;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ type: Boolean, default: false })
  mustChangePassword!: boolean;

  @Prop({ type: Date })
  passwordChangedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModelName = User.name;
export const UserModel = MongooseModule.forFeature([
  { name: UserModelName, schema: UserSchema },
]);
