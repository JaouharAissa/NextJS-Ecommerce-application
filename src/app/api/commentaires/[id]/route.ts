import { dbConnect } from "@/lib/mongodb";
import Commentaire from "@/models/Commentaire";
import Produit from "@/models/Produit";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const recalculateProduitScore = async (produitId: mongoose.Types.ObjectId | string) => {
  const stats = await Commentaire.aggregate([
    { $match: { produit: new mongoose.Types.ObjectId(produitId) } },
    { $group: { _id: "$produit", avgNote: { $avg: "$note" } } },
  ]);
  const avg = stats[0]?.avgNote ?? 0;
  await Produit.findByIdAndUpdate(produitId, { score_moyen: avg });
};

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
    const { id } = await context.params;
    const body = await req.json();
    const { contenu, note } = body;

    if (!contenu || typeof note !== "number") {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), { status: 400 });
    }
    if (note < 1 || note > 5) {
      return new Response(JSON.stringify({ error: "La note doit être entre 1 et 5" }), { status: 400 });
    }

    await dbConnect();
    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      return new Response(JSON.stringify({ error: "Commentaire introuvable" }), { status: 404 });
    }

    if (commentaire.utilisateur.toString() !== decoded.userId) {
      return new Response(JSON.stringify({ error: "Action non autorisée" }), { status: 403 });
    }

    commentaire.contenu = contenu;
    commentaire.note = note;
    await commentaire.save();
    await commentaire.populate("utilisateur", "username email role");
    await recalculateProduitScore(commentaire.produit);

    return Response.json(commentaire);
  } catch (error) {
    console.error("Error updating commentaire:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
    const { id } = await context.params;

    await dbConnect();

    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      return new Response(JSON.stringify({ error: "Commentaire introuvable" }), { status: 404 });
    }

    const isOwner = commentaire.utilisateur.toString() === decoded.userId;
    const isAdmin = decoded.role === "admin";
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Action non autorisée" }), { status: 403 });
    }

    await Commentaire.findByIdAndDelete(id);
    await recalculateProduitScore(commentaire.produit);

    return Response.json({ message: "Commentaire supprimé" });
  } catch (error) {
    console.error("Error deleting commentaire:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

