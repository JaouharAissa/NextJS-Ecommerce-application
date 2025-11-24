// app/api/upload/route.ts
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    // Vérifier le token
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + "-" + file.name;
    const filepath = path.join(process.cwd(), "public/uploads", filename);

    // Sauvegarder le fichier
    await writeFile(filepath, buffer);

    // Retourner l'URL publique
    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 200 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}