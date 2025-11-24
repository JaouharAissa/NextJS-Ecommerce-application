import mongoose, { Schema, Document, Model } from "mongoose";
  export interface IProduct extends Document {
  name: string;
  price: number;
  }
  const ProductSchema: Schema<IProduct> = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  });
  const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
  export default Product;