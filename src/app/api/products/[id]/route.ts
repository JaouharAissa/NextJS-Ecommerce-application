// app/api/products/[id]/route.ts
import { dbConnect } from "@/lib/mongodb";
import Produit, { IProduit } from "@/models/Produit";
import jwt from "jsonwebtoken";

// GET un produit
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await dbConnect();
  const product = await Produit.findById(id)
    .populate("categorie", "nom")
    .populate("createdBy", "username email");
  
  if (!product) {
    return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
  }

  return Response.json(product);
}

// PUT modifier un produit (admin uniquement)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }

    const { id } = await context.params;
    await dbConnect();
    const data = await req.json();

    const product = await Produit.findByIdAndUpdate(id, data, { new: true });
    
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// DELETE supprimer un produit (admin uniquement)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }

    const { id } = await context.params;
    await dbConnect();
    
    const product = await Produit.findByIdAndDelete(id);
    
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
    }

    return Response.json({ message: "Produit supprimé ✅" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}