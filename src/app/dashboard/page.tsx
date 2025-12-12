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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Package, Tag, TrendingUp, MessageSquare, AlertTriangle, Star, ArrowRight } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";
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

      const prodRes = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prodData = await prodRes.json();
      setProducts(Array.isArray(prodData) ? prodData : []);

      const catRes = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catRes.json();

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
      }

      const sentimentRes = await fetch("/api/stats/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sentimentRes.ok) {
        const sentimentData = await sentimentRes.json();
        setProductSentimentStats(Array.isArray(sentimentData) ? sentimentData : []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
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

  const totalReviews = productSentimentStats.reduce((acc, curr) => acc + curr.total, 0);
  const negativeReviewsCount = productSentimentStats.filter(s => s.negatifPercent > 20 && s.total > 0).length;

  const globalStats = productSentimentStats.reduce(
    (acc, p) => ({
      positifs: acc.positifs + p.positifs,
      negatifs: acc.negatifs + p.negatifs,
      neutres: acc.neutres + p.neutres,
    }),
    { positifs: 0, negatifs: 0, neutres: 0 }
  );

  const pieData = [
    { name: "Positive", value: globalStats.positifs },
    { name: "Neutral", value: globalStats.neutres },
    { name: "Negative", value: globalStats.negatifs },
  ].filter((item) => item.value > 0);

  // Score Moyenne par Produit data (top 8 products by score)
  const scoreData = products
    .filter(p => p.score_moyen > 0)
    .sort((a, b) => b.score_moyen - a.score_moyen)
    .slice(0, 8)
    .map(p => ({
      nom: p.nom.length > 12 ? p.nom.substring(0, 12) + '...' : p.nom,
      score: p.score_moyen,
      fullName: p.nom,
    }));

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, icon: Package, color: "var(--primary)" },
    { label: "Categories", value: stats.totalCategories, icon: Tag, color: "var(--accent)" },
    { label: "Avg Price", value: `${stats.averagePrice.toFixed(0)} DT`, icon: TrendingUp, color: "var(--success)" },
    { label: "Total Reviews", value: totalReviews, icon: MessageSquare, color: "var(--pink)" },
  ];

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <main className="container-main pb-16 pt-8 space-y-8">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">Overview</p>
            <h1 className="text-3xl font-heading font-bold text-white">Dashboard</h1>
          </div>
          <div className="glass-card-static px-4 py-2 rounded-xl">
            <p className="text-sm text-[var(--foreground-muted)]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="stat-card hover-lift">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label mt-1">{stat.label}</p>
              </div>
            );
          })}
        </section>

        {/* Alert */}
        {negativeReviewsCount > 0 && (
          <div className="glass-card-static p-4 border-l-4 border-[var(--warning)] rounded-xl flex items-center gap-4">
            <AlertTriangle size={24} className="text-[var(--warning)]" />
            <div>
              <p className="font-medium text-white">{negativeReviewsCount} products with high negative sentiment</p>
              <p className="text-sm text-[var(--foreground-muted)]">Review these products in the Sentiments page</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/sentiments")}
              className="ml-auto btn-ghost text-sm"
            >
              View <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Pie Chart */}
          <div className="glass-card-static p-6 rounded-2xl">
            <h2 className="text-lg font-heading font-bold text-white mb-6">Sentiment Analysis</h2>
            {pieData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => {
                        const colorKey = entry.name === "Positive" ? "positif" : entry.name === "Neutral" ? "neutre" : "negatif";
                        return <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[colorKey]} stroke="transparent" />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[var(--foreground-muted)]">
                No sentiment data
              </div>
            )}
            <div className="flex justify-center gap-6 mt-4">
              {[
                { name: "Positive", color: SENTIMENT_COLORS.positif },
                { name: "Neutral", color: SENTIMENT_COLORS.neutre },
                { name: "Negative", color: SENTIMENT_COLORS.negatif },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-[var(--foreground-muted)]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Moyenne par Produit */}
          <div className="glass-card-static p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Star className="text-[var(--warning)]" size={20} />
              <h2 className="text-lg font-heading font-bold text-white">Score Moyenne par Produit</h2>
            </div>
            {scoreData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--glass-border)" />
                    <XAxis type="number" domain={[0, 5]} stroke="var(--foreground-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="nom" type="category" width={80} stroke="var(--foreground-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'var(--glass-bg)' }}
                      contentStyle={{
                        backgroundColor: 'var(--background-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(2)} / 5`,
                        props.payload.fullName
                      ]}
                    />
                    <Bar dataKey="score" fill="url(#gradientScore)" radius={[0, 4, 4, 0]} barSize={20} />
                    <defs>
                      <linearGradient id="gradientScore" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--warning)" />
                        <stop offset="100%" stopColor="var(--success)" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[var(--foreground-muted)]">
                No product scores yet
              </div>
            )}
          </div>
        </div>

        {/* AI Sentiment Analysis Table */}
        <AIAlertsTable sentimentStats={productSentimentStats} />

        {/* Recent Orders Table */}
        <section className="glass-card-static rounded-2xl overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-[var(--glass-border)]">
            <h2 className="text-lg font-heading font-bold text-white">Recent Orders</h2>
            <button onClick={() => router.push("/commandes")} className="text-sm text-[var(--primary)] hover:text-[var(--accent)] transition-colors">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <div>
                          <p className="font-medium text-white">{order.utilisateur?.username || "—"}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{order.utilisateur?.email}</p>
                        </div>
                      </td>
                      <td className="text-[var(--foreground-muted)]">
                        {new Date(order.dateCommande).toLocaleDateString("en-US")}
                      </td>
                      <td className="font-semibold text-white">
                        {order.montantTotal?.toFixed(2)} DT
                      </td>
                      <td>
                        <span className={`badge ${order.statut === "livree" ? "badge-success" :
                            order.statut === "annulee" ? "badge-error" :
                              "badge-warning"
                          }`}>
                          {order.statut?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[var(--foreground-muted)]">No recent orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}