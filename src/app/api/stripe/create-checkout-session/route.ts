import { dbConnect } from "@/lib/mongodb";
import Produit from "@/models/Produit";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("⚠️ STRIPE_SECRET_KEY is not set. Stripe routes will not work.");
}

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: string;
    };

    const body = await req.json();
    const { items, adresseLivraison, commentaire } = body as {
      items: Array<{ produitId: string; quantite: number }>;
      adresseLivraison: {
        rue: string;
        ville: string;
        codePostal: string;
        pays: string;
        telephone: string;
      };
      commentaire?: string;
    };

    if (!items?.length) {
      return new Response(
        JSON.stringify({ error: "Le panier est vide pour Stripe." }),
        { status: 400 }
      );
    }

    await dbConnect();

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const produit = await Produit.findById(item.produitId);
        if (!produit) {
          throw new Error(`Produit ${item.produitId} non trouvé`);
        }
        return {
          produitId: produit._id.toString(),
          nom: produit.nom,
          prix: produit.prix,
          quantite: item.quantite,
        };
      })
    );

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      enrichedItems.map((item) => ({
        quantity: item.quantite,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(item.prix * 100), // en centimes
          product_data: {
            name: item.nom,
          },
        },
      }));

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      payment_method_types: ["card"],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/home?canceled=1`,
      metadata: {
        userId: decoded.userId,
        items: JSON.stringify(enrichedItems),
        adresseLivraison: JSON.stringify(adresseLivraison),
        commentaire: commentaire || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error creating Stripe Checkout Session:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}





