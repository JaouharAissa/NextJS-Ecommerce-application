// models/Commande.ts
import mongoose, { Document, Schema } from "mongoose";

// Interface pour un item de commande
export interface ICommandeItem {
  produit: mongoose.Types.ObjectId;
  nom: string; // Copie du nom du produit
  prix: number; // Prix au moment de la commande
  quantite: number;
  sousTotal: number;
}

export interface ICommande extends Document {
  utilisateur: mongoose.Types.ObjectId;
  items: ICommandeItem[];
  montantTotal: number;
  statut: "en_attente" | "confirmee" | "en_cours" | "livree" | "annulee";
  adresseLivraison: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
    telephone: string;
  };
  dateCommande: Date;
  dateLivraison?: Date;
  methodePaiement: "especes" | "carte" | "paypal";
  paiementDetails?: {
    titulaire?: string;
    numeroMasque?: string;
    expiration?: string;
    paypalEmail?: string;
    transactionId?: string;
  };
  commentaire?: string;
  factureUrl?: string;
}

const commandeItemSchema = new Schema<ICommandeItem>({
  produit: {
    type: Schema.Types.ObjectId,
    ref: "Produit",
    required: true,
  },
  nom: {
    type: String,
    required: true,
  },
  prix: {
    type: Number,
    required: true,
    min: 0,
  },
  quantite: {
    type: Number,
    required: true,
    min: 1,
  },
  sousTotal: {
    type: Number,
    required: true,
    min: 0,
  },
});

const commandeSchema = new Schema<ICommande>(
  {
    utilisateur: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [commandeItemSchema],
      required: true,
      validate: {
        validator: function(items: ICommandeItem[]) {
          return items.length > 0;
        },
        message: "Une commande doit contenir au moins un produit",
      },
    },
    montantTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    statut: {
      type: String,
      enum: ["en_attente", "confirmee", "en_cours", "livree", "annulee"],
      default: "en_attente",
    },
    adresseLivraison: {
      rue: { type: String, required: true },
      ville: { type: String, required: true },
      codePostal: { type: String, required: true },
      pays: { type: String, required: true, default: "Tunisie" },
      telephone: { type: String, required: true },
    },
    dateCommande: {
      type: Date,
      default: Date.now,
    },
    dateLivraison: {
      type: Date,
    },
    methodePaiement: {
      type: String,
      enum: ["especes", "carte", "paypal"],
      required: true,
    },
    paiementDetails: {
      titulaire: { type: String },
      numeroMasque: { type: String },
      expiration: { type: String },
      paypalEmail: { type: String },
      transactionId: { type: String },
    },
    commentaire: {
      type: String,
      maxlength: 500,
    },
    factureUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index pour optimiser les requêtes
commandeSchema.index({ utilisateur: 1, dateCommande: -1 });
commandeSchema.index({ statut: 1 });

// Méthode pour calculer le montant total
commandeSchema.methods.calculateTotal = function() {
  this.montantTotal = this.items.reduce((total: number, item: ICommandeItem) => {
    return total + item.sousTotal;
  }, 0);
  return this.montantTotal;
};

const Commande = mongoose.models.Commande || mongoose.model<ICommande>("Commande", commandeSchema);
export default Commande;