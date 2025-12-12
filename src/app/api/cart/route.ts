// app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

// GET - Récupérer le panier de l'utilisateur
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        await dbConnect();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ cart: user.cart || [] });
    } catch (error) {
        console.error("Error fetching cart:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// POST - Mettre à jour le panier complet
export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const { cart } = await req.json();

        if (!Array.isArray(cart)) {
            return NextResponse.json({ error: "cart doit être un array" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        user.cart = cart;
        await user.save();

        return NextResponse.json({
            message: "Panier sauvegardé",
            cart: user.cart
        });
    } catch (error) {
        console.error("Error saving cart:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// DELETE - Vider le panier
export async function DELETE(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        await dbConnect();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        user.cart = [];
        await user.save();

        return NextResponse.json({
            message: "Panier vidé",
            cart: []
        });
    } catch (error) {
        console.error("Error clearing cart:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
