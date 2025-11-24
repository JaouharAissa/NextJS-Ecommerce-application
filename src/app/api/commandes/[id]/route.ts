// app/api/commandes/[id]/route.ts
import { dbConnect } from "@/lib/mongodb";
import Commande from "@/models/Commande";
import jwt from "jsonwebtoken";

// GET une commande
export async function GET(
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
    const commande = await Commande.findById(id)
      .populate("utilisateur", "username email")
      .populate("items.produit", "nom image prix");

    if (!commande) {
      return new Response(JSON.stringify({ error: "Commande not found" }), { status: 404 });
    }

    // Vérifier que l'utilisateur a le droit de voir cette commande
    if (decoded.role !== "admin" && commande.utilisateur._id.toString() !== decoded.userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    return Response.json(commande);
  } catch (error) {
    console.error("Error fetching commande:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// PUT modifier le statut d'une commande (admin uniquement)
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

    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }

    const { id } = await context.params;
    await dbConnect();

    const data = await req.json();
    const commande = await Commande.findByIdAndUpdate(
      id,
      { 
        statut: data.statut,
        dateLivraison: data.statut === "livree" ? new Date() : undefined
      },
      { new: true }
    ).populate("utilisateur", "username email").populate("items.produit", "nom image");

    if (!commande) {
      return new Response(JSON.stringify({ error: "Commande not found" }), { status: 404 });
    }

    return Response.json(commande);
  } catch (error) {
    console.error("Error updating commande:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// DELETE annuler une commande
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
    const commande = await Commande.findById(id);

    if (!commande) {
      return new Response(JSON.stringify({ error: "Commande not found" }), { status: 404 });
    }

    // Vérifier les permissions
    if (decoded.role !== "admin" && commande.utilisateur.toString() !== decoded.userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // On ne peut annuler que les commandes en_attente ou confirmee
    if (!["en_attente", "confirmee"].includes(commande.statut)) {
      return new Response(
        JSON.stringify({ error: "Cannot cancel this order" }), 
        { status: 400 }
      );
    }

    commande.statut = "annulee";
    await commande.save();

    return Response.json({ message: "Commande annulée ✅" });
  } catch (error) {
    console.error("Error deleting commande:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}