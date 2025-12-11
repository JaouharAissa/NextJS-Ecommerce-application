import { dbConnect } from "@/lib/mongodb";
import Commentaire from "@/models/Commentaire";
import Produit from "@/models/Produit";
import User from "@/models/User"; // Register User model
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const recalculateProduitScore = async (produitId: string) => {
  const stats = await Commentaire.aggregate([
    { $match: { produit: new mongoose.Types.ObjectId(produitId) } },
    { $group: { _id: "$produit", avgNote: { $avg: "$note" } } },
  ]);

  const avg = stats[0]?.avgNote ?? 0;
  await Produit.findByIdAndUpdate(produitId, { score_moyen: avg });
};

const PYTHON_AI_URL =
  process.env.PYTHON_AI_URL || "http://127.0.0.1:4000/analyze";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const produitId = searchParams.get("produitId");

    await dbConnect();

    if (produitId) {
      const commentaires = await Commentaire.find({ produit: produitId })
        .populate("utilisateur", "username email role")
        .sort({ createdAt: -1 });

      return Response.json(commentaires);
    }

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    let decoded: { role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ error: "Action non autorisée" }), { status: 403 });
    }

    const commentaires = await Commentaire.find()
      .populate("utilisateur", "username email role")
      .populate("produit", "nom image")
      .sort({ createdAt: -1 });

    return Response.json(commentaires);
  } catch (error) {
    console.error("Error fetching commentaires:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
    const body = await req.json();
    const { produitId, contenu, note } = body;

    if (!produitId || !contenu || typeof note !== "number") {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), { status: 400 });
    }

    if (note < 1 || note > 5) {
      return new Response(JSON.stringify({ error: "La note doit être entre 1 et 5" }), { status: 400 });
    }

    await dbConnect();

    const produitExiste = await Produit.exists({ _id: produitId });
    if (!produitExiste) {
      return new Response(JSON.stringify({ error: "Produit introuvable" }), { status: 404 });
    }

    // Appel au service IA Python pour analyser le sentiment du commentaire
    let sentiment: "positif" | "negatif" | "neutre" = "neutre";
    let scoreConfiance = 0;

    try {
      const aiResponse = await fetch(PYTHON_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: contenu }),
      });

      if (aiResponse.ok) {
        const data = (await aiResponse.json()) as {
          sentiment?: string;
          confidence?: number;
        };

        const s = data.sentiment;
        const c = typeof data.confidence === "number" ? data.confidence : 0;

        if (s === "positive") sentiment = "positif";
        else if (s === "negative") sentiment = "negatif";
        else if (s === "neutre") sentiment = "neutre";

        scoreConfiance = c;
      } else {
        console.error("Erreur service IA:", await aiResponse.text());
      }
    } catch (error) {
      console.error("Erreur lors de l'appel au service IA:", error);
    }

    // Règle métier : une note de 3 étoiles est considérée comme neutre
    if (note === 3) {
      sentiment = "neutre";
    }

    const commentaire = await Commentaire.create({
      produit: produitId,
      utilisateur: decoded.userId,
      contenu,
      note,
      sentiment,
      scoreConfiance,
    });

    await recalculateProduitScore(produitId);
    await commentaire.populate("utilisateur", "username email role");

    return new Response(JSON.stringify(commentaire), { status: 201 });
  } catch (error) {
    console.error("Error creating commentaire:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

