// app/api/categories/[id]/route.ts
import { dbConnect } from "@/lib/mongodb";
import Categorie from "@/models/Categorie";
import jwt from "jsonwebtoken";

// GET une catégorie
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await dbConnect();
  const category = await Categorie.findById(id);

  if (!category) {
    return new Response(JSON.stringify({ error: "Category not found" }), { status: 404 });
  }

  return Response.json(category);
}

// PUT modifier une catégorie (admin uniquement)
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
    const { nom } = await req.json();

    const category = await Categorie.findByIdAndUpdate(id, { nom }, { new: true });

    if (!category) {
      return new Response(JSON.stringify({ error: "Category not found" }), { status: 404 });
    }

    return Response.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// DELETE supprimer une catégorie (admin uniquement)
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

    const category = await Categorie.findByIdAndDelete(id);

    if (!category) {
      return new Response(JSON.stringify({ error: "Category not found" }), { status: 404 });
    }

    return Response.json({ message: "Catégorie supprimée ✅" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}