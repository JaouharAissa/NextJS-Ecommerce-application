// models/User.ts
import mongoose, { Document, Schema } from "mongoose";

// Interface pour un item du panier
export interface ICartItem {
    produitId: string;
    nom: string;
    image?: string;
    prix: number;
    quantite: number;
}

// Interface pour l'utilisateur
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: "user" | "admin";
    cart: ICartItem[];
    favorites: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

// Schéma pour les items du panier
const CartItemSchema = new Schema<ICartItem>({
    produitId: {
        type: String,
        required: true
    },
    nom: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    prix: {
        type: Number,
        required: true,
        min: 0
    },
    quantite: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    }
});

// Schéma utilisateur
const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        cart: {
            type: [CartItemSchema],
            default: []
        },
        favorites: [{
            type: Schema.Types.ObjectId,
            ref: "Produit"
        }]
    },
    { timestamps: true }
);

// Index pour optimiser les recherches
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
