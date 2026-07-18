import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Department {
  @Prop({ type: String, required: true, unique: true }) code!: string;
  @Prop({ type: String, required: true }) nameEn!: string;
  @Prop({ type: String, required: true }) nameAr!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' }) parentId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) managerId?: Types.ObjectId;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
export const DepartmentModelName = Department.name;
export type DepartmentDocument = HydratedDocument<Department>;
export const DepartmentModel = MongooseModule.forFeature([
  { name: DepartmentModelName, schema: DepartmentSchema },
]);
