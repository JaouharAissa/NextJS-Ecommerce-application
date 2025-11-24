// app/api/setup/create-admin/route.ts
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    console.log("✅ Connecté à MongoDB");

    // Supprimer l'ancien admin s'il existe
    await User.deleteOne({ email: "admin@gmail.com" });
    console.log("🗑️ Ancien admin supprimé (si existant)");

    // ✅ Créer l'admin avec un mot de passe de 6+ caractères
    // Le hook pre-save va automatiquement hasher le password
    const admin = await User.create({
      username: "Admin",
      email: "admin@gmail.com",
      password: "admin123", // ✅ 8 caractères
      role: "admin",
    });

    console.log("✅ Admin créé avec succès:", admin._id);

    return Response.json({ 
      message: "✅ Admin créé avec succès!", 
      credentials: {
        email: "admin@gmail.com",
        password: "admin123"
      },
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("❌ Erreur création admin:", error);
    return Response.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}