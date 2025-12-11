"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, XCircle, Truck, Download } from "lucide-react";
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

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "en_attente": return "bg-gray-100 text-gray-600";
      case "confirmee": return "bg-black text-white";
      case "en_cours": return "bg-gray-800 text-white";
      case "livree": return "bg-green-100 text-green-800";
      case "annulee": return "bg-red-50 text-red-600";
      default: return "bg-gray-50 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <AdminNavbar />

      <main className="container-main pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">Commandes</h1>
            <p className="text-gray-500 text-sm">Suivi des commandes et livraisons</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100">
          {commandes.length === 0 ? (
            <div className="text-center py-24">
              <Package className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Aucune commande disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-medium">
                  <tr>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Client</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Montant</th>
                    <th className="py-4 px-6">Statut</th>
                    <th className="py-4 px-6">Facture</th>
                    <th className="py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commandes.map((commande) => (
                    <tr key={commande._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-gray-500">
                        #{commande._id.substring(0, 8)}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium">{commande.utilisateur.username}</p>
                          <p className="text-xs text-gray-500">{commande.utilisateur.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {new Date(commande.dateCommande).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4 px-6 font-medium">
                        {commande.montantTotal.toFixed(2)} DT
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatutColor(commande.statut)}`}>
                          {commande.statut.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {commande.factureUrl ? (
                          <a
                            href={commande.factureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                          >
                            <Download size={14} />
                            PDF
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={commande.statut}
                          onChange={(e) => updateStatut(commande._id, e.target.value)}
                          className="bg-transparent border-b border-gray-200 py-1 text-xs focus:outline-none focus:border-black transition-colors cursor-pointer"
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