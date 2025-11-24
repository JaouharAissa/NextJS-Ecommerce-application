// app/api/categories/route.ts
import { dbConnect } from "@/lib/mongodb";
import Categorie from "@/models/Categorie";
import jwt from "jsonwebtoken";

// GET toutes les catégories
export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET as string);

    await dbConnect();
    const categories = await Categorie.find().sort({ nom: 1 });

    return new Response(JSON.stringify(categories), { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// POST créer une catégorie (admin uniquement)
export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }

    await dbConnect();
    const { nom } = await req.json();

    // Vérifier si la catégorie existe déjà
    const existingCategory = await Categorie.findOne({ nom });
    if (existingCategory) {
      return new Response(
        JSON.stringify({ error: "Cette catégorie existe déjà" }),
        { status: 400 }
      );
    }

    const newCategory = await Categorie.create({ nom });
    return new Response(JSON.stringify(newCategory), { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}