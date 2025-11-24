// models/UtilProd.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IUtilProd extends Document {
  utilisateur: mongoose.Types.ObjectId;
  produit: mongoose.Types.ObjectId;
  date: Date;
}

const utilProdSchema = new Schema<IUtilProd>(
  {
    utilisateur: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    produit: { 
      type: Schema.Types.ObjectId, 
      ref: "Produit",
      required: true 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

// Index composé pour éviter les doublons et optimiser les requêtes
utilProdSchema.index({ utilisateur: 1, produit: 1, date: -1 });

const UtilProd = mongoose.models.UtilProd || mongoose.model<IUtilProd>("UtilProd", utilProdSchema);
export default UtilProd;