// models/Categorie.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ICategorie extends Document {
  nom: string;
}

const categorieSchema = new Schema<ICategorie>(
  {
    nom: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
    },
  },
  { timestamps: true }
);

const Categorie = mongoose.models.Categorie || mongoose.model<ICategorie>("Categorie", categorieSchema);
export default Categorie;