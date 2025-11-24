// models/ProduitCommente.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IProduitCommente extends Document {
  produit: mongoose.Types.ObjectId;
  commentaire: mongoose.Types.ObjectId;
  date: Date;
}

const produitCommenteSchema = new Schema<IProduitCommente>(
  {
    produit: { 
      type: Schema.Types.ObjectId, 
      ref: "Produit",
      required: true 
    },
    commentaire: { 
      type: Schema.Types.ObjectId, 
      ref: "Commentaire",
      required: true 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

// Index pour les requêtes fréquentes
produitCommenteSchema.index({ produit: 1, date: -1 });

const ProduitCommente = mongoose.models.ProduitCommente || mongoose.model<IProduitCommente>("ProduitCommente", produitCommenteSchema);
export default ProduitCommente;