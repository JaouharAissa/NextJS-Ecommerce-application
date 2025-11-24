"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, RefreshCw, Download, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";

type StatutCommande = "en_attente" | "confirmee" | "en_cours" | "livree" | "annulee";

interface Commande {
  _id: string;
  items: Array<{
    produit: {
      nom: string;
      image?: string;
    };
    quantite: number;
    prix: number;
    sousTotal: number;
  }>;
  montantTotal: number;
  statut: StatutCommande;
  dateCommande: string;
  adresseLivraison: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
    telephone: string;
  };
  methodePaiement: "especes" | "carte" | "paypal";
  paiementDetails?: {
    titulaire?: string;
    numeroMasque?: string;
    expiration?: string;
    paypalEmail?: string;
    transactionId?: string;
  };
  factureUrl?: string;
}

const statutSteps: { key: StatutCommande; label: string; icon: ReactNode }[] = [
  { key: "en_attente", label: "En attente", icon: <Clock size={16} /> },
  { key: "confirmee", label: "Confirmée", icon: <CheckCircle2 size={16} /> },
  { key: "en_cours", label: "En cours", icon: <Truck size={16} /> },
  { key: "livree", label: "Livrée", icon: <CheckCircle2 size={16} /> },
  { key: "annulee", label: "Annulée", icon: <XCircle size={16} /> },
];

const statutColor: Record<StatutCommande, string> = {
  en_attente: "bg-yellow-100 text-yellow-800",
  confirmee: "bg-blue-100 text-blue-800",
  en_cours: "bg-purple-100 text-purple-800",
  livree: "bg-green-100 text-green-800",
  annulee: "bg-red-100 text-red-800",
};

export default function MesCommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCommandes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/commandes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Impossible de récupérer vos commandes.");
      }
      const data = await res.json();
      setCommandes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      router.push("/login");
      return;
    }
    if (role === "admin") {
      router.push("/commandes");
      return;
    }
    fetchCommandes();
  }, [router]);

  const renderPaiementDetails = (commande: Commande) => {
    if (commande.methodePaiement === "especes") {
      return <p>Paiement à la livraison</p>;
    }

    if (commande.methodePaiement === "carte") {
      return (
        <div className="text-sm text-gray-600 space-y-1">
          <p>Titulaire : {commande.paiementDetails?.titulaire || "-"}</p>
          <p>Carte : {commande.paiementDetails?.numeroMasque || "-"}</p>
          <p>Expiration : {commande.paiementDetails?.expiration || "-"}</p>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600 space-y-1">
        <p>Email PayPal : {commande.paiementDetails?.paypalEmail || "-"}</p>
        <p>ID transaction : {commande.paiementDetails?.transactionId || "-"}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Mes commandes</h1>
              <p className="text-sm text-gray-500">Suivez l'avancement de vos achats</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/home")}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-100"
            >
              ← Retour à la boutique
            </button>
            <button
              onClick={fetchCommandes}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && commandes.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
            Vous n'avez pas encore de commandes.
          </div>
        )}

        {commandes.map((commande) => {
          const currentIndex = statutSteps.findIndex((step) => step.key === commande.statut);
          return (
            <div key={commande._id} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Commande #{commande._id.slice(-8)}</p>
                  <p className="text-lg font-semibold text-gray-800">
                    Passée le {new Date(commande.dateCommande).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statutColor[commande.statut]}`}>
                    {commande.statut.replace("_", " ")}
                  </span>
                  {commande.factureUrl && (
                    <a
                      href={commande.factureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Download size={16} />
                      Facture PDF
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {statutSteps.map((step, index) => (
                  <div
                    key={step.key}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      index <= currentIndex ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {step.icon}
                    {step.label}
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Articles</h3>
                  <div className="space-y-3">
                    {commande.items.map((item, idx) => (
                      <div key={`${item.produit.nom}-${idx}`} className="flex justify-between text-sm text-gray-700">
                        <div>
                          <p className="font-medium">{item.produit.nom}</p>
                          <p className="text-xs text-gray-500">x{item.quantite}</p>
                        </div>
                        <p className="font-semibold">{item.sousTotal.toFixed(2)} DT</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-blue-600">{commande.montantTotal.toFixed(2)} DT</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Livraison & paiement</h3>
                  <div className="text-sm text-gray-600">
                    <p>{commande.adresseLivraison.rue}</p>
                    <p>
                      {commande.adresseLivraison.ville}, {commande.adresseLivraison.codePostal}
                    </p>
                    <p>{commande.adresseLivraison.pays}</p>
                    <p>Tél: {commande.adresseLivraison.telephone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Paiement ({commande.methodePaiement})
                    </p>
                    {renderPaiementDetails(commande)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}

