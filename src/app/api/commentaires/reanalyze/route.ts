import { dbConnect } from "@/lib/mongodb";
import Commentaire from "@/models/Commentaire";

const PYTHON_AI_URL =
  process.env.PYTHON_AI_URL || "http://127.0.0.1:4000/analyze";

export async function POST() {
  try {
    await dbConnect();

    // 1) Mise à jour globale : tous les commentaires avec 3 étoiles => neutre
    const neutralUpdateResult = await Commentaire.updateMany(
      { note: 3, sentiment: { $ne: "neutre" } },
      { $set: { sentiment: "neutre" } }
    );

    // 2) Ré-analyse IA pour les anciens commentaires sans score de confiance
    const commentaires = await Commentaire.find({
      $or: [{ scoreConfiance: { $exists: false } }, { scoreConfiance: 0 }],
    }).limit(200); // limite de sécurité

    const updated: string[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const commentaire of commentaires) {
      try {
        const res = await fetch(PYTHON_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: commentaire.contenu }),
        });

        if (!res.ok) {
          errors.push({
            id: commentaire._id.toString(),
            error: `HTTP ${res.status}`,
          });
          continue;
        }

        const data = (await res.json()) as {
          sentiment?: string;
          confidence?: number;
        };

        let sentiment: "positif" | "negatif" | "neutre" = "neutre";
        const s = data.sentiment;
        const c = typeof data.confidence === "number" ? data.confidence : 0;

        if (s === "positive") sentiment = "positif";
        else if (s === "negative") sentiment = "negatif";
        else if (s === "neutre") sentiment = "neutre";

        // Règle métier alignée : note de 3 étoiles => neutre
        if (commentaire.note === 3) {
          sentiment = "neutre";
        }

        commentaire.sentiment = sentiment;
        commentaire.scoreConfiance = c;
        await commentaire.save();
        updated.push(commentaire._id.toString());
      } catch (error: unknown) {
        errors.push({
          id: commentaire._id.toString(),
          error: (error as Error).message ?? "Unknown error",
        });
      }
    }

    return Response.json({
      message: "Ré-analyse terminée",
      reanalyzedCount: updated.length,
      updated,
      errors,
      neutralUpdatedCount: neutralUpdateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error reanalyzing commentaires:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}


