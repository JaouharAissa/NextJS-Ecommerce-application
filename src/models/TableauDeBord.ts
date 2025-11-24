// models/TableauDeBord.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ITableauDeBord extends Document {
  admin: mongoose.Types.ObjectId;
  statistiquesGlobales: {
    totalProduits: number;
    totalUtilisateurs: number;
    totalCommentaires: number;
    sentimentGlobal: {
      positif: number;
      negatif: number;
      neutre: number;
    };
  };
  statistiquesParProduit: Array<{
    produit: mongoose.Types.ObjectId;
    nombreCommentaires: number;
    scoreMoyen: number;
    sentiments: {
      positif: number;
      negatif: number;
      neutre: number;
    };
  }>;
  lastUpdated: Date;
}

const tableauDeBordSchema = new Schema<ITableauDeBord>(
  {
    admin: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    statistiquesGlobales: {
      totalProduits: { type: Number, default: 0 },
      totalUtilisateurs: { type: Number, default: 0 },
      totalCommentaires: { type: Number, default: 0 },
      sentimentGlobal: {
        positif: { type: Number, default: 0 },
        negatif: { type: Number, default: 0 },
        neutre: { type: Number, default: 0 },
      },
    },
    statistiquesParProduit: [
      {
        produit: { type: Schema.Types.ObjectId, ref: "Produit" },
        nombreCommentaires: { type: Number, default: 0 },
        scoreMoyen: { type: Number, default: 0 },
        sentiments: {
          positif: { type: Number, default: 0 },
          negatif: { type: Number, default: 0 },
          neutre: { type: Number, default: 0 },
        },
      },
    ],
    lastUpdated: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

const TableauDeBord = mongoose.models.TableauDeBord || mongoose.model<ITableauDeBord>("TableauDeBord", tableauDeBordSchema);
export default TableauDeBord;