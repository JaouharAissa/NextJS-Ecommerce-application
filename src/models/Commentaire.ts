// models/Commentaire.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ICommentaire extends Document {
  contenu: string;
  sentiment: "positif" | "negatif" | "neutre";
  scoreConfiance: number;
  produit: mongoose.Types.ObjectId;
  utilisateur: mongoose.Types.ObjectId;
  note: number;
  date: Date;
}

const commentaireSchema = new Schema<ICommentaire>(
  {
    contenu: { 
      type: String, 
      required: true,
      minlength: 3,
      maxlength: 1000
    },
    sentiment: { 
      type: String, 
      enum: ["positif", "negatif", "neutre"],
      default: "neutre"
    },
    scoreConfiance: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 1 
    },
    produit: { 
      type: Schema.Types.ObjectId, 
      ref: "Produit",
      required: true 
    },
    utilisateur: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    note: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

// Index pour récupérer rapidement les commentaires d'un produit
commentaireSchema.index({ produit: 1, date: -1 });

const Commentaire = mongoose.models.Commentaire || mongoose.model<ICommentaire>("Commentaire", commentaireSchema);
export default Commentaire;