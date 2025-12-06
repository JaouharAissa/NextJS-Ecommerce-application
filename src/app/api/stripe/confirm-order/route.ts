import { dbConnect } from "@/lib/mongodb";
import { generateInvoicePdf } from "@/lib/invoice";
import Commande from "@/models/Commande";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import Produit from "@/models/Produit";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20" as any,
    })
  : null;

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured on the server" }),
        { status: 500 }
      );
    }

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string; role: string };

    const body = await req.json();
    const { sessionId } = body as { sessionId: string };

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Stripe sessionId is required" }),
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400 }
      );
    }

    if (!session.metadata?.userId || !session.metadata.items) {
      return new Response(
        JSON.stringify({ error: "Missing metadata on Stripe session" }),
        { status: 400 }
      );
    }

    if (session.metadata.userId !== decodedToken.userId) {
      return new Response(
        JSON.stringify({ error: "This session does not belong to the user" }),
        { status: 403 }
      );
    }

    await dbConnect();

    const enrichedItemsFromMetadata = JSON.parse(
      session.metadata.items
    ) as Array<{
      produitId: string;
      nom: string;
      prix: number;
      quantite: number;
    }>;

    const adresseLivraison = session.metadata.adresseLivraison
      ? JSON.parse(session.metadata.adresseLivraison)
      : undefined;

    if (!adresseLivraison) {
      return new Response(
        JSON.stringify({ error: "Adresse de livraison manquante" }),
        { status: 400 }
      );
    }

    // Revalider les produits et recalculer totaux
    const enrichedItems = await Promise.all(
      enrichedItemsFromMetadata.map(async (item) => {
        const produit = await Produit.findById(item.produitId);
        if (!produit) {
          throw new Error(`Produit ${item.produitId} non trouvé lors de la confirmation`);
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

    const montantTotal = enrichedItems.reduce(
      (total, item) => total + item.sousTotal,
      0
    );

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;

    // Créer la commande associée au paiement Stripe
    const commande = await Commande.create({
      utilisateur: decodedToken.userId,
      items: enrichedItems,
      montantTotal,
      adresseLivraison,
      methodePaiement: "carte",
      commentaire: session.metadata.commentaire || "",
      statut: "confirmee",
      paiementDetails: {
        transactionId: paymentIntent?.id,
      },
    });

    await commande.populate("items.produit", "nom image");
    await commande.populate("utilisateur", "username email");

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

    return new Response(JSON.stringify(commande), { status: 201 });
  } catch (error) {
    console.error("Error confirming Stripe order:", error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
}





