// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Package, Tag, TrendingUp, MessageSquare } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";

interface Product {
  _id: string;
  nom: string;
  prix: number;
  categorie: {
    nom: string;
  };
  score_moyen: number;
}

interface Stats {
  totalProducts: number;
  totalCategories: number;
  averagePrice: number;
}

interface Commande {
  _id: string;
  utilisateur: {
    username: string;
    email: string;
  };
  montantTotal: number;
  statut: string;
  dateCommande: string;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    averagePrice: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch products
      const prodRes = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prodData: Product[] = await prodRes.json();
      setProducts(prodData);

      // Fetch categories
      const catRes = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catRes.json();

      // Calculate stats
      const avgPrice = prodData.length > 0
        ? prodData.reduce((sum, p) => sum + p.prix, 0) / prodData.length
        : 0;

      setStats({
        totalProducts: prodData.length,
        totalCategories: catData.length,
        averagePrice: avgPrice,
      });

      const ordersRes = await fetch("/api/commandes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordersRes.ok) {
        const ordersData: Commande[] = await ordersRes.json();
        setRecentOrders(ordersData.slice(0, 6));
      } else {
        setRecentOrders([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Erreur chargement données :", error);
      setLoading(false);
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
        <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-3xl shadow-2xl px-6 py-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Tableau de bord</p>
            <h1 className="text-3xl lg:text-4xl font-bold mt-3">Salut, Admin 👋</h1>
            <p className="text-white/80 mt-3 max-w-2xl">
              Suivez les performances de ShopStyle, modérez les retours clients et pilotez les opérations depuis un seul espace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-xs uppercase text-white/70">Produits actifs</p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-xs uppercase text-white/70">Catégories</p>
              <p className="text-3xl font-bold">{stats.totalCategories}</p>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Produits</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
              <Package className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Catégories</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalCategories}</p>
              </div>
              <Tag className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Prix Moyen</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.averagePrice.toFixed(2)} DT
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={40} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
          <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/commandes")}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 rounded-2xl hover:shadow-lg transition"
            >
              <Package size={24} />
              <span>Suivre les commandes</span>
            </button>
            <button
              onClick={() => router.push("/products")}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-2xl hover:shadow-lg transition"
            >
              <Package size={24} />
              <span>Gérer les produits</span>
            </button>
            <button
              onClick={() => router.push("/categories")}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-6 py-4 rounded-2xl hover:shadow-lg transition"
            >
              <Tag size={24} />
              <span>Gérer les catégories</span>
            </button>
            <button
              onClick={() => router.push("/commentaires")}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white px-6 py-4 rounded-2xl hover:shadow-lg transition"
            >
              <MessageSquare size={24} />
              <span>Modérer les avis</span>
            </button>
          </div>
        </div>

        {/* Charts */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Prix des produits */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Prix des Produits</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={products.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="prix" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scores moyens */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Scores Moyens</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={products.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score_moyen" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow-md mt-8 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Produits Récents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Nom</th>
                  <th className="py-3 px-4 text-left">Catégorie</th>
                  <th className="py-3 px-4 text-left">Prix</th>
                  <th className="py-3 px-4 text-left">Score</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product) => (
                  <tr key={product._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{product.nom}</td>
                    <td className="py-3 px-4">{product.categorie.nom}</td>
                    <td className="py-3 px-4">{product.prix.toFixed(2)} DT</td>
                    <td className="py-3 px-4">{product.score_moyen.toFixed(1)} ⭐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md mt-8 overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Commandes récentes</h2>
              <p className="text-sm text-gray-500">Dernières commandes passées sur la boutique.</p>
            </div>
            <button
              onClick={() => router.push("/commandes")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Voir tout
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-6 text-gray-500">Aucune commande enregistrée pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Client</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Montant</th>
                    <th className="py-3 px-4 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium">{order.utilisateur?.username || "—"}</p>
                        <p className="text-sm text-gray-500">{order.utilisateur?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(order.dateCommande).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {order.montantTotal?.toFixed(2)} DT
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 capitalize">
                          {order.statut?.replace("_", " ")}
                        </span>
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