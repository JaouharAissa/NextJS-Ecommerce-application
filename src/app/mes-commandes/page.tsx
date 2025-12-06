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
    <div className="min-h-screen bg-pattern">
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="p-3 glass-button rounded-xl">
                <Package className="text-blue-600" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mes commandes</h1>
                <p className="text-sm text-gray-600">Suivez l'avancement de vos achats</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/home")}
                className="px-4 py-2 text-sm glass-button rounded-xl font-medium text-gray-700 hover:text-blue-600 transition-all"
              >
                ← Retour boutique
              </button>
              <button
                onClick={fetchCommandes}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm btn-primary rounded-xl"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-main py-8 lg:py-12 space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="glass-card p-8 rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!loading && commandes.length === 0 && !error && (
          <div className="glass-card p-12 lg:p-16 text-center rounded-xl">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 font-medium mb-2">Vous n'avez pas encore de commandes.</p>
            <p className="text-sm text-gray-500">Commencez vos achats dès maintenant !</p>
          </div>
        )}

        {commandes.map((commande) => {
          const currentIndex = statutSteps.findIndex((step) => step.key === commande.statut);
          return (
            <div key={commande._id} className="glass-card p-6 lg:p-8 space-y-6 hover-lift rounded-xl">
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

              <div className="flex flex-wrap gap-3">
                {statutSteps.map((step, index) => (
                  <div
                    key={step.key}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      index <= currentIndex 
                        ? "glass-button bg-blue-100 text-blue-800 border border-blue-200" 
                        : "glass-button bg-gray-100 text-gray-500 border border-gray-200"
                    }`}
                  >
                    {step.icon}
                    {step.label}
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-5 rounded-xl space-y-4">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Package size={20} />
                    Articles
                  </h3>
                  <div className="space-y-3">
                    {commande.items.map((item, idx) => (
                      <div key={`${item.produit.nom}-${idx}`} className="flex justify-between items-center p-3 glass-button rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{item.produit.nom}</p>
                          <p className="text-xs text-gray-500">x{item.quantite}</p>
                        </div>
                        <p className="font-bold text-blue-600">{item.sousTotal.toFixed(2)} DT</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <span className="font-bold text-lg text-gray-900">Total</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {commande.montantTotal.toFixed(2)} DT
                    </span>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-xl space-y-4">
                  <h3 className="font-bold text-lg text-gray-900">Livraison & paiement</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p className="font-medium">{commande.adresseLivraison.rue}</p>
                    <p>
                      {commande.adresseLivraison.ville}, {commande.adresseLivraison.codePostal}
                    </p>
                    <p>{commande.adresseLivraison.pays}</p>
                    <p className="pt-2 border-t border-gray-200">Tél: {commande.adresseLivraison.telephone}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Paiement ({commande.methodePaiement === "carte" ? "Stripe" : commande.methodePaiement})
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

