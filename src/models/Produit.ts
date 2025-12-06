// models/Produit.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IProduit extends Document {
  nom: string;
  description: string;
  images: string[]; // Changed from single image to array of images
  prix: number;
  score_moyen: number;
  categorie: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // L'admin qui a créé le produit
}

const produitSchema = new Schema<IProduit>(
  {
    nom: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length >= 1 && v.length <= 5;
        },
        message: 'Un produit doit avoir entre 1 et 5 images'
      }
    },
    prix: {
      type: Number,
      required: true,
      min: 0
    },
    score_moyen: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    categorie: {
      type: Schema.Types.ObjectId,
      ref: "Categorie",
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  },
  { timestamps: true }
);

// Index pour améliorer les performances de recherche
produitSchema.index({ nom: 1, categorie: 1 });

const Produit = mongoose.models.Produit || mongoose.model<IProduit>("Produit", produitSchema);
export default Produit;