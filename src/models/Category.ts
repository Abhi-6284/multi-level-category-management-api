import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId | null;
  status: 'active' | 'inactive';
}

const categorySchema: Schema = new Schema({
  name: { type: String, required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
});

categorySchema.index({ parent: 1 });

export default mongoose.model<ICategory>('Category', categorySchema);