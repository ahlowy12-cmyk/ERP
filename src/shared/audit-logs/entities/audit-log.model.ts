import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ type: String, required: true }) action!: string; // 'CREATE', 'UPDATE', 'DELETE'
  @Prop({ type: String, required: true }) entity!: string; // اسم الجدول (مثال: 'PurchaseOrder')
  @Prop({ type: Types.ObjectId, required: true }) entityId!: Types.ObjectId;

  @Prop({ type: String }) details?: string;

  @Prop({ type: Object }) oldValue?: any; // البيانات قبل التعديل
  @Prop({ type: Object }) newValue?: any; // البيانات بعد التعديل
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
export const AuditLogModelName = AuditLog.name;
export const AuditLogModel = MongooseModule.forFeature([
  { name: AuditLogModelName, schema: AuditLogSchema },
]);
export type AuditLogDocument = HydratedDocument<AuditLog>;
