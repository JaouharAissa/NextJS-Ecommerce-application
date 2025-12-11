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
import { Package, Tag, TrendingUp, MessageSquare, AlertTriangle, PieChart as PieChartIcon, ArrowRight } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";
import DashboardStats from "@/app/components/dashboard/DashboardStats";
import AIAlertsTable from "@/app/components/dashboard/AIAlertsTable";

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
  averageScore: number;
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
  positif: "#000000", // Black for positive
  neutre: "#9ca3af",  // Gray for neutral
  negatif: "#ef4444", // Red for negative (keep for alerts)
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    averagePrice: 0,
    averageScore: 0,
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
      setProducts(Array.isArray(prodData) ? prodData : []);

      // Fetch categories
      const catRes = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catRes.json();

      // Calculate stats
      const avgPrice = prodData.length > 0
        ? prodData.reduce((sum: number, p: Product) => sum + p.prix, 0) / prodData.length
        : 0;

      const avgScore = prodData.length > 0
        ? prodData.reduce((sum: number, p: Product) => sum + (p.score_moyen || 0), 0) / prodData.length
        : 0;

      setStats({
        totalProducts: prodData.length,
        totalCategories: catData.length,
        averagePrice: avgPrice,
        averageScore: avgScore,
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
      </div>
    );
  }

  const totalReviews = productSentimentStats.reduce((acc, curr) => acc + curr.total, 0);
  const negativeReviewsCount = productSentimentStats.filter(s => s.negatifPercent > 20 && s.total > 0).length;

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <AdminNavbar />

      <main className="container-main pb-16 pt-24 space-y-12">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Vue d'ensemble</p>
            <h1 className="text-4xl font-serif font-medium">Tableau de bord</h1>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Date</p>
              <p className="text-xl font-light">{new Date().toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <DashboardStats
          stats={stats}
          totalOrders={recentOrders.length} // Note: This is just recent orders count, ideally should be total orders from API
          totalReviews={totalReviews}
          negativeReviewsCount={negativeReviewsCount}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Global Sentiment */}
          <div>
            <h2 className="text-xl font-serif font-medium mb-6 border-b border-gray-100 pb-4">Analyse des Sentiments</h2>
            {productSentimentStats.length > 0 ? (() => {
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
                { name: "Positif", value: globalStats.positifs },
                { name: "Neutre", value: globalStats.neutres },
                { name: "Négatif", value: globalStats.negatifs },
              ].filter((item) => item.value > 0);

              return (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => {
                          const colorKey = entry.name === "Positif" ? "positif" : entry.name === "Neutre" ? "neutre" : "negatif";
                          return <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[colorKey]} stroke="none" />;
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0px', boxShadow: 'none' }}
                        itemStyle={{ color: '#000', fontSize: '12px', textTransform: 'uppercase' }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              );
            })() : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50">
                Pas de données
              </div>
            )}
          </div>

          {/* Price Distribution */}
          <div>
            <h2 className="text-xl font-serif font-medium mb-6 border-b border-gray-100 pb-4">Distribution des Prix</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="nom" hide />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0px' }}
                  />
                  <Bar dataKey="prix" fill="#000000" radius={[0, 0, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-serif font-medium mb-6 border-b border-gray-100 pb-4">Score Moyen par Produit</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="nom" hide />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} domain={[0, 5]} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0px' }}
                  />
                  <Bar dataKey="score_moyen" fill="#000000" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-medium">Commandes Récentes</h2>
            <button onClick={() => router.push("/commandes")} className="text-sm font-medium underline underline-offset-4 hover:text-gray-600">
              Voir tout
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-4 font-medium text-xs uppercase tracking-wider text-gray-500">Client</th>
                  <th className="py-4 font-medium text-xs uppercase tracking-wider text-gray-500">Date</th>
                  <th className="py-4 font-medium text-xs uppercase tracking-wider text-gray-500">Montant</th>
                  <th className="py-4 font-medium text-xs uppercase tracking-wider text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="font-medium">{order.utilisateur?.username || "—"}</div>
                        <div className="text-xs text-gray-500">{order.utilisateur?.email}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {new Date(order.dateCommande).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4 font-medium">
                        {order.montantTotal?.toFixed(2)} DT
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium uppercase tracking-wide border ${order.statut === "livré" ? "border-green-200 text-green-700 bg-green-50" :
                          order.statut === "annulé" ? "border-red-200 text-red-700 bg-red-50" :
                            "border-gray-200 text-gray-700 bg-gray-50"
                          }`}>
                          {order.statut?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">Aucune commande récente</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Alerts Section (Moved to bottom) */}
        <AIAlertsTable sentimentStats={productSentimentStats} />
      </main>
    </div>
  );
}