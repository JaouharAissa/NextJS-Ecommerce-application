// app/api/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Produit from "@/models/Produit";

// GET - Récupérer les favoris de l'utilisateur
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        await dbConnect();

        const user = await User.findById(decoded.userId).populate({
            path: "favorites",
            model: Produit,
            populate: {
                path: "categorie",
                select: "nom"
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ favorites: user.favorites || [] });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// POST - Ajouter ou retirer un favori (toggle)
export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: "productId requis" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        // Vérifier si le produit existe
        const product = await Produit.findById(productId);
        if (!product) {
            return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
        }

        // Toggle favorite
        const favoriteIndex = user.favorites.findIndex(
            (fav: any) => fav.toString() === productId
        );

        let action: "added" | "removed";
        if (favoriteIndex > -1) {
            // Retirer des favoris
            user.favorites.splice(favoriteIndex, 1);
            action = "removed";
        } else {
            // Ajouter aux favoris
            user.favorites.push(productId);
            action = "added";
        }

        await user.save();

        // Récupérer les favoris avec les détails des produits
        const updatedUser = await User.findById(decoded.userId).populate({
            path: "favorites",
            model: Produit,
            populate: {
                path: "categorie",
                select: "nom"
            }
        });

        return NextResponse.json({
            message: action === "added" ? "Ajouté aux favoris" : "Retiré des favoris",
            action,
            favorites: updatedUser?.favorites || []
        });
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// PUT - Remplacer tous les favoris (pour sync initial depuis localStorage)
export async function PUT(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const { favoriteIds } = await req.json();

        if (!Array.isArray(favoriteIds)) {
            return NextResponse.json({ error: "favoriteIds doit être un array" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        // Vérifier que tous les produits existent
        const validProducts = await Produit.find({ _id: { $in: favoriteIds } });
        const validIds = validProducts.map(p => p._id);

        user.favorites = validIds;
        await user.save();

        // Récupérer les favoris avec les détails
        const updatedUser = await User.findById(decoded.userId).populate({
            path: "favorites",
            model: Produit,
            populate: {
                path: "categorie",
                select: "nom"
            }
        });

        return NextResponse.json({
            message: "Favoris synchronisés",
            favorites: updatedUser?.favorites || []
        });
    } catch (error) {
        console.error("Error syncing favorites:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
