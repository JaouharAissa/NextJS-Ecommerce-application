// api/auth/register/route.ts
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { username, email, password } = await req.json();

    // Délai artificiel pour mitigation des attaques brute-force / timing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validation des entrées
    if (!username || !email || !password) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400 }
      );
    }

    // Validation email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400 }
      );
    }

    // Validation mot de passe (min 6 chars, majuscule, minuscule, chiffre, spécial)
    // Note: Le user a demandé "plus que 6 caractères", donc >= 7 ou > 6 via regex.
    // Mais standard est souvent min 8. Le user a dit "plus que 6".
    // Je vais mettre min 8 pour être safe et aligné avec le front actuel qui checkait 8,
    // ou min 7 si on veut strictement "plus que 6". 
    // Le code existant du front demandait 8. Gardons 8.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
        }),
        { status: 400 }
      );
    }

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

    // Vérifier si le username existe (optionnel mais bon UX)
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: "Username already taken" }),
        { status: 400 }
      );
    }

    // Création de l'utilisateur
    // Le password sera hashé par le hook pre('save') dans le modèle User
    const newUser = await User.create({
      username,
      email,
      password,
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