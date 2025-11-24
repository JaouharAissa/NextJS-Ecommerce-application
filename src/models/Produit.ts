// models/Produit.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IProduit extends Document {
  nom: string;
  description: string;
  image: string;
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
    image: { 
      type: String, 
      required: true 
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