// app/commandes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";

interface Commande {
  _id: string;
  utilisateur: {
    username: string;
    email: string;
  };
  items: Array<{
    produit: {
      nom: string;
      image: string;
    };
    quantite: number;
    prix: number;
    sousTotal: number;
  }>;
  montantTotal: number;
  statut: string;
  dateCommande: string;
  adresseLivraison: {
    rue: string;
    ville: string;
    codePostal: string;
    telephone: string;
  };
  methodePaiement: string;
  factureUrl?: string;
}

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchCommandes();
  }, [router]);

  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/commandes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCommandes(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching commandes:", error);
      setLoading(false);
    }
  };

  const updateStatut = async (id: string, newStatut: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/commandes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatut }),
      });
      fetchCommandes();
    } catch (error) {
      console.error("Error updating statut:", error);
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "en_attente": return <Clock className="text-yellow-500" size={20} />;
      case "confirmee": return <CheckCircle className="text-blue-500" size={20} />;
      case "en_cours": return <Truck className="text-purple-500" size={20} />;
      case "livree": return <CheckCircle className="text-green-500" size={20} />;
      case "annulee": return <XCircle className="text-red-500" size={20} />;
      default: return <Package size={20} />;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "en_attente": return "bg-yellow-100 text-yellow-800";
      case "confirmee": return "bg-blue-100 text-blue-800";
      case "en_cours": return "bg-purple-100 text-purple-800";
      case "livree": return "bg-green-100 text-green-800";
      case "annulee": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 pb-12 pt-28 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Logistique</p>
              <h1 className="text-3xl font-bold text-slate-900">Gestion des commandes</h1>
              <p className="text-slate-500">
                Suivez les statuts, gérez les livraisons et gardez un œil sur les paiements.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
          {commandes.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-500 text-lg">Aucune commande disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Client</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Montant</th>
                    <th className="py-3 px-4 text-left">Statut</th>
                    <th className="py-3 px-4 text-left">Facture</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.map((commande) => (
                    <tr key={commande._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        {commande._id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{commande.utilisateur.username}</p>
                          <p className="text-sm text-gray-500">{commande.utilisateur.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(commande.dateCommande).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {commande.montantTotal.toFixed(2)} DT
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatutIcon(commande.statut)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(commande.statut)}`}>
                            {commande.statut.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {commande.factureUrl ? (
                          <a
                            href={commande.factureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Télécharger
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={commande.statut}
                          onChange={(e) => updateStatut(commande._id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="en_attente">En attente</option>
                          <option value="confirmee">Confirmée</option>
                          <option value="en_cours">En cours</option>
                          <option value="livree">Livrée</option>
                          <option value="annulee">Annulée</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}