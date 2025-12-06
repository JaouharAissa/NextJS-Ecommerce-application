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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Package, Tag, TrendingUp, MessageSquare, AlertTriangle, PieChart as PieChartIcon } from "lucide-react";
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

interface ProductSentimentStats {
  produitId: string;
  nom: string;
  total: number;
  positifs: number;
  negatifs: number;
  neutres: number;
  positifPercent: number;
  negatifPercent: number;
  scoreGlobal: number;
}

const SENTIMENT_COLORS = {
  positif: "#10b981",
  neutre: "#f59e0b",
  negatif: "#ef4444",
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    averagePrice: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Commande[]>([]);
  const [productSentimentStats, setProductSentimentStats] = useState<ProductSentimentStats[]>([]);
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
      const prodData = await prodRes.json();
      // Ensure products is always an array
      setProducts(Array.isArray(prodData) ? prodData : []);

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

      // Fetch sentiment stats
      const sentimentRes = await fetch("/api/stats/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sentimentRes.ok) {
        const sentimentData = await sentimentRes.json();
        setProductSentimentStats(Array.isArray(sentimentData) ? sentimentData : []);
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
    <div className="min-h-screen bg-pattern">
      <AdminNavbar />

      <main className="container-main pb-16 pt-20 lg:pt-24 space-y-12 lg:space-y-16">
        <section className="glass-card bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-2xl px-6 py-8 lg:px-8 lg:py-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
          <div className="glass-card p-6 rounded-xl hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Produits</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="text-blue-600" size={32} />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Catégories</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Tag className="text-green-600" size={32} />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Prix Moyen</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.averagePrice.toFixed(2)} DT
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="text-purple-600" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-xl p-6 lg:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/commandes")}
              className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              <Package size={20} />
              <span className="font-medium">Suivre les commandes</span>
            </button>
            <button
              onClick={() => router.push("/products")}
              className="flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              <Package size={20} />
              <span className="font-medium">Gérer les produits</span>
            </button>
            <button
              onClick={() => router.push("/categories")}
              className="flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
            >
              <Tag size={20} />
              <span className="font-medium">Gérer les catégories</span>
            </button>
            <button
              onClick={() => router.push("/commentaires")}
              className="flex items-center justify-center gap-3 bg-pink-600 text-white px-6 py-4 rounded-lg hover:bg-pink-700 transition-all shadow-sm hover:shadow-md"
            >
              <MessageSquare size={20} />
              <span className="font-medium">Modérer les avis</span>
            </button>
            <button
              onClick={() => router.push("/dashboard/sentiments")}
              className="flex items-center justify-center gap-3 bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              <PieChartIcon size={20} />
              <span className="font-medium">Analyse des sentiments</span>
            </button>
          </div>
        </div>

        {/* Camembert global des sentiments et Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camembert global */}
          {productSentimentStats.length > 0 && (() => {
            const globalStats = productSentimentStats.reduce(
              (acc, p) => ({
                positifs: acc.positifs + p.positifs,
                negatifs: acc.negatifs + p.negatifs,
                neutres: acc.neutres + p.neutres,
              }),
              { positifs: 0, negatifs: 0, neutres: 0 }
            );
            const total = globalStats.positifs + globalStats.negatifs + globalStats.neutres;
            const pieData = [
              { name: "Positif", value: globalStats.positifs, percent: total > 0 ? (globalStats.positifs / total) * 100 : 0 },
              { name: "Neutre", value: globalStats.neutres, percent: total > 0 ? (globalStats.neutres / total) * 100 : 0 },
              { name: "Négatif", value: globalStats.negatifs, percent: total > 0 ? (globalStats.negatifs / total) * 100 : 0 },
            ].filter((item) => item.value > 0);

            return (
              <div className="glass-card p-6 rounded-2xl hover-lift">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Répartition globale des sentiments</h2>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${percent.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => {
                          const colorKey =
                            entry.name === "Positif"
                              ? "positif"
                              : entry.name === "Neutre"
                              ? "neutre"
                              : "negatif";
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={SENTIMENT_COLORS[colorKey as keyof typeof SENTIMENT_COLORS]}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{globalStats.positifs}</p>
                    <p className="text-sm text-gray-600">Positifs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{globalStats.neutres}</p>
                    <p className="text-sm text-gray-600">Neutres</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{globalStats.negatifs}</p>
                    <p className="text-sm text-gray-600">Négatifs</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Alertes produits à surveiller */}
          {(() => {
            const alertProducts = productSentimentStats.filter(
              (p) => p.total >= 5 && p.negatifPercent >= 40
            );
            return alertProducts.length > 0 ? (
              <div className="glass-card p-6 rounded-2xl border-l-4 border-red-500 hover-lift">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-red-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">
                    Produits à surveiller ({alertProducts.length})
                  </h2>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alertProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.produitId}
                      className="p-4 glass-button rounded-xl bg-red-50 border border-red-200 hover-lift"
                    >
                      <p className="font-bold text-gray-900 mb-1">{product.nom}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {product.total} avis • {product.negatifPercent.toFixed(1)}% négatifs
                        </span>
                        <span className="text-red-600 font-semibold">
                          Score: {product.scoreGlobal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {alertProducts.length > 5 && (
                    <button
                      onClick={() => router.push("/dashboard/sentiments")}
                      className="w-full p-3 glass-button rounded-xl text-blue-600 font-semibold hover:bg-blue-50 transition"
                    >
                      Voir tous les produits ({alertProducts.length})
                    </button>
                  )}
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Charts */}
        {Array.isArray(products) && products.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Prix des produits */}
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Prix des Produits</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Array.isArray(products) ? products.slice(0, 10) : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nom" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '0.5rem',
                      padding: '0.5rem'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="prix" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scores moyens */}
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Scores Moyens</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Array.isArray(products) ? products.slice(0, 10) : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nom" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 5]} stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '0.5rem',
                      padding: '0.5rem'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="score_moyen" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Products */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Produits Récents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Catégorie</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prix</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(products) && products.length > 0 ? (
                  products.slice(0, 5).map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">{product.nom}</td>
                      <td className="py-4 px-6 text-gray-600">{product.categorie?.nom || "—"}</td>
                      <td className="py-4 px-6 text-gray-900 font-semibold">{product.prix?.toFixed(2) || "0.00"} DT</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          {product.score_moyen?.toFixed(1) || "0.0"} ⭐
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      Aucun produit disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Commandes récentes</h2>
              <p className="text-sm text-gray-600 mt-1">Dernières commandes passées sur la boutique.</p>
            </div>
            <button
              onClick={() => router.push("/commandes")}
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
            >
              Voir tout →
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>Aucune commande enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{order.utilisateur?.username || "—"}</p>
                        <p className="text-sm text-gray-500">{order.utilisateur?.email}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(order.dateCommande).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {order.montantTotal?.toFixed(2)} DT
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
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