// app/api/commandes/route.ts
import { dbConnect } from "@/lib/mongodb";
import { generateInvoicePdf } from "@/lib/invoice";
import Commande from "@/models/Commande";
import Produit from "@/models/Produit";
import User from "@/models/User";
import jwt from "jsonwebtoken";

type MethodePaiement = "especes" | "carte" | "paypal";

const buildPaiementDetails = (
  methodePaiement: MethodePaiement,
  paiementDetails: any
) => {
  if (methodePaiement === "carte") {
    const { titulaire, numeroCarte, expiration } = paiementDetails || {};
    if (!titulaire || !numeroCarte || !expiration) {
      throw new Error("Informations de carte bancaire manquantes");
    }
    const digitsOnly = String(numeroCarte).replace(/\D/g, "");
    const last4 = digitsOnly.slice(-4);
    const numeroMasque = `**** **** **** ${last4}`.trim();
    return {
      titulaire,
      numeroMasque,
      expiration,
    };
  }

  if (methodePaiement === "paypal") {
    const { paypalEmail, transactionId } = paiementDetails || {};
    if (!paypalEmail || !transactionId) {
      throw new Error("Informations PayPal manquantes");
    }
    return {
      paypalEmail,
      transactionId,
    };
  }

  return undefined;
};

// GET toutes les commandes (admin) ou mes commandes (user)
export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
    await dbConnect();

    let commandes;
    if (decoded.role === "admin") {
      // Admin voit toutes les commandes
      commandes = await Commande.find()
        .populate("utilisateur", "username email")
        .populate("items.produit", "nom image")
        .sort({ dateCommande: -1 });
    } else {
      // User voit seulement ses commandes
      commandes = await Commande.find({ utilisateur: decoded.userId })
        .populate("items.produit", "nom image")
        .sort({ dateCommande: -1 });
    }

    return new Response(JSON.stringify(commandes), { status: 200 });
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// POST créer une commande
export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
    await dbConnect();

    const data = await req.json();
    const methodePaiement: MethodePaiement = data.methodePaiement;
    if (!["especes", "carte", "paypal"].includes(methodePaiement)) {
      return new Response(JSON.stringify({ error: "Méthode de paiement invalide" }), { status: 400 });
    }
    let paiementDetails;
    try {
      paiementDetails = buildPaiementDetails(methodePaiement, data.paiementDetails);
    } catch (validationError) {
      return new Response(
        JSON.stringify({
          error: validationError instanceof Error ? validationError.message : "Paiement invalide",
        }),
        { status: 400 }
      );
    }

    // Vérifier et enrichir les items avec les données des produits
    const enrichedItems = await Promise.all(
      data.items.map(async (item: any) => {
        const produit = await Produit.findById(item.produit);
        if (!produit) {
          throw new Error(`Produit ${item.produit} non trouvé`);
        }

        const sousTotal = produit.prix * item.quantite;
        return {
          produit: produit._id,
          nom: produit.nom,
          prix: produit.prix,
          quantite: item.quantite,
          sousTotal,
        };
      })
    );

    // Calculer le montant total
    const montantTotal = enrichedItems.reduce((total, item) => total + item.sousTotal, 0);

    // Créer la commande
    const commande = await Commande.create({
      utilisateur: decoded.userId,
      items: enrichedItems,
      montantTotal,
      adresseLivraison: data.adresseLivraison,
      methodePaiement,
      commentaire: data.commentaire,
      statut: "en_attente",
      paiementDetails,
    });

    await commande.populate("items.produit", "nom image");
    await commande.populate("utilisateur", "username email");

    if (["carte", "paypal"].includes(commande.methodePaiement)) {
      const factureUrl = await generateInvoicePdf({
        commandeId: commande._id.toString(),
        dateCommande: commande.dateCommande,
        utilisateur: {
          username: (commande.utilisateur as any).username,
          email: (commande.utilisateur as any).email,
        },
        adresseLivraison: commande.adresseLivraison,
        items: commande.items.map((item: any) => ({
          nom: item.nom,
          quantite: item.quantite,
          prix: item.prix,
          sousTotal: item.sousTotal,
        })),
        montantTotal: commande.montantTotal,
        methodePaiement: commande.methodePaiement,
        paiementDetails: commande.paiementDetails,
      });
      commande.factureUrl = factureUrl;
      await commande.save();
    }

    return new Response(JSON.stringify(commande), { status: 201 });
  } catch (error) {
    console.error("Error creating commande:", error);
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}