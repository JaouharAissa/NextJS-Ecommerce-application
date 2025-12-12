"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Download } from "lucide-react";
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

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente": return "badge-warning";
      case "confirmee": return "badge-primary";
      case "en_cours": return "badge-accent";
      case "livree": return "badge-success";
      case "annulee": return "badge-error";
      default: return "badge-primary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <main className="container-main pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Orders</h1>
          <p className="text-[var(--foreground-muted)]">Track and manage all customer orders</p>
        </div>

        <div className="glass-card-static rounded-2xl overflow-hidden">
          {commandes.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto text-[var(--foreground-muted)] mb-4" size={48} />
              <p className="text-[var(--foreground-muted)]">No orders available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.map((commande) => (
                    <tr key={commande._id}>
                      <td className="font-mono text-xs text-[var(--foreground-muted)]">
                        #{commande._id.substring(0, 8)}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-white">{commande.utilisateur.username}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{commande.utilisateur.email}</p>
                        </div>
                      </td>
                      <td className="text-[var(--foreground-muted)]">
                        {new Date(commande.dateCommande).toLocaleDateString("en-US")}
                      </td>
                      <td className="font-semibold text-white">
                        {commande.montantTotal.toFixed(2)} DT
                      </td>
                      <td>
                        <span className={`badge ${getStatutBadge(commande.statut)}`}>
                          {commande.statut.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        {commande.factureUrl ? (
                          <a
                            href={commande.factureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
                          >
                            <Download size={16} />
                            <span className="text-xs uppercase tracking-wider">PDF</span>
                          </a>
                        ) : (
                          <span className="text-[var(--foreground-muted)]">—</span>
                        )}
                      </td>
                      <td>
                        <select
                          value={commande.statut}
                          onChange={(e) => updateStatut(commande._id, e.target.value)}
                          className="glass-input py-2 px-3 text-sm rounded-lg cursor-pointer"
                        >
                          <option value="en_attente">Pending</option>
                          <option value="confirmee">Confirmed</option>
                          <option value="en_cours">In Progress</option>
                          <option value="livree">Delivered</option>
                          <option value="annulee">Cancelled</option>
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