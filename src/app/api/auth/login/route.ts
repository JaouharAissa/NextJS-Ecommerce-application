// app/api/auth/login/route.ts
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log("🔑 Tentative de login pour:", email);

    await dbConnect();
    console.log("✅ Connecté à MongoDB");

    // 🔍 Chercher l'utilisateur dans MongoDB
    const user = await User.findOne({ email });
    console.log("🔍 User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("❌ Utilisateur non trouvé:", email);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    console.log("👤 User ID:", user._id.toString());
    console.log("👤 User role:", user.role);

    // 🔐 Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Password match:", isMatch);

    if (!isMatch) {
      console.log("❌ Mot de passe incorrect pour:", email);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    // ✅ Générer le token avec le VRAI ID MongoDB
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    console.log("✅ Token généré avec userId:", user._id.toString());
    console.log("✅ Login réussi pour:", email, "| Role:", user.role);

    return new Response(
      JSON.stringify({ 
        token, 
        role: user.role,
        message: `${user.role === "admin" ? "Admin" : "User"} logged in successfully`
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Login error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Something went wrong",
        details: error instanceof Error ? error.message : "Unknown"
      }),
      { status: 500 }
    );
  }
}