// api/auth/register/route.ts
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { username, email, password } = await req.json();

    // ❌ L'admin ne peut pas être créé
    if (email === "admin@gmail.com") {
      return new Response(
        JSON.stringify({ error: "Admin account cannot be registered" }),
        { status: 403 }
      );
    }

    // Vérifier si l'email existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email already exists" }),
        { status: 400 }
      );
    }

    // ✅ CORRECTION : Ne PAS hasher manuellement
    // Le hook pre("save") va le faire automatiquement
    const newUser = await User.create({
      username,
      email,
      password, // ← Mot de passe en clair, le modèle va le hasher
      role: "user",
    });

    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      { status: 201 }
    );

  } catch (error) {
    console.error("Register error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500 }
    );
  }
}