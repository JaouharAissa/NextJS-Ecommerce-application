// app/api/products/route.ts
import { dbConnect } from "@/lib/mongodb";
import Produit from "@/models/Produit";
import Categorie from "@/models/Categorie";
import User from "@/models/User";
import jwt from "jsonwebtoken";

// GET tous les produits
export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET as string);

    await dbConnect();
    const products = await Produit.find()
      .populate("categorie", "nom")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// POST créer un produit (admin uniquement)
export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };

    // Vérifier que c'est un admin
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }

    await dbConnect();
    const data = await req.json();

    const newProduct = await Produit.create({
      ...data,
      createdBy: decoded.userId,
    });

    return new Response(JSON.stringify(newProduct), { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}