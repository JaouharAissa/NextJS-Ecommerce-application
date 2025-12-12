"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Search, ArrowLeft, AlertTriangle } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";

interface ProductSentimentStats {
  produitId: string;
  nom: string;
  image?: string;
  total: number;
  positifs: number;
  negatifs: number;
  neutres: number;
  positifPercent: number;
  neutrePercent: number;
  negatifPercent: number;
  scoreGlobal: number;
  noteMoyenne: number;
}

const COLORS = {
  positif: "#10b981",
  neutre: "#f59e0b",
  negatif: "#ef4444",
};

export default function SentimentsPage() {
  const [productStats, setProductStats] = useState<ProductSentimentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/stats/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Error loading statistics");
      }

      const data = await res.json();
      setProductStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productStats;
    const query = searchQuery.toLowerCase();
    return productStats.filter(
      (p) =>
        p.nom.toLowerCase().includes(query) ||
        p.produitId.toLowerCase().includes(query)
    );
  }, [productStats, searchQuery]);

  const productsToWatch = productStats.filter((p) => p.total >= 5 && p.negatifPercent >= 40);

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

      <main className="container-main pb-16 pt-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-3 glass-button rounded-xl hover:bg-[var(--glass-bg-hover)] transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-heading font-bold text-white">
                Sentiment Analysis
              </h1>
              <p className="text-[var(--foreground-muted)]">
                Review distribution for each product
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-12"
            />
          </div>
        </div>

        {/* Alerts */}
        {productsToWatch.length > 0 && (
          <div className="glass-card-static p-6 rounded-2xl border-l-4 border-[var(--error)]">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-[var(--error)]" size={24} />
              <h2 className="text-lg font-heading font-bold text-white">
                Products to Watch ({productsToWatch.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsToWatch.map((product) => (
                <div
                  key={product.produitId}
                  className="p-4 glass-button rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30"
                >
                  <p className="font-semibold text-white mb-1">{product.nom}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {product.total} reviews • {product.negatifPercent.toFixed(1)}% negative
                  </p>
                  <p className="text-xs text-[var(--error)] font-medium mt-2">
                    Score: {product.scoreGlobal.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid with Charts */}
        {filteredProducts.length === 0 ? (
          <div className="glass-card-static p-16 text-center rounded-2xl">
            <p className="text-lg text-[var(--foreground-muted)]">
              {searchQuery ? "No products found" : "No products with reviews"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const pieData = [
                { name: "Positive", value: product.positifs },
                { name: "Neutral", value: product.neutres },
                { name: "Negative", value: product.negatifs },
              ].filter((item) => item.value > 0);

              return (
                <div
                  key={product.produitId}
                  className="glass-card p-6 rounded-2xl space-y-4"
                >
                  {/* Product Info */}
                  <div className="text-center space-y-2">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.nom}
                        className="w-16 h-16 mx-auto rounded-xl object-cover"
                      />
                    )}
                    <h3 className="font-heading font-bold text-white">{product.nom}</h3>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {product.total} reviews • Avg: {product.noteMoyenne?.toFixed(1) || "0.0"} ⭐
                    </p>
                  </div>

                  {/* Pie Chart */}
                  {pieData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) =>
                              `${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => {
                              const colorKey =
                                entry.name === "Positive"
                                  ? "positif"
                                  : entry.name === "Neutral"
                                    ? "neutre"
                                    : "negatif";
                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[colorKey as keyof typeof COLORS]}
                                  stroke="transparent"
                                />
                              );
                            })}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--background-secondary)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-[var(--foreground-muted)]">
                      <p>No data</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 pt-4 border-t border-[var(--glass-border)]">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground-muted)]">Positive:</span>
                      <span className="font-semibold text-[var(--success)]">
                        {product.positifPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground-muted)]">Neutral:</span>
                      <span className="font-semibold text-[var(--warning)]">
                        {product.neutrePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground-muted)]">Negative:</span>
                      <span className="font-semibold text-[var(--error)]">
                        {product.negatifPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[var(--glass-border)]">
                      <span className="font-semibold text-white">Global Score:</span>
                      <span
                        className={`font-bold ${product.scoreGlobal >= 0.5
                          ? "text-[var(--success)]"
                          : product.scoreGlobal >= 0
                            ? "text-[var(--warning)]"
                            : "text-[var(--error)]"
                          }`}
                      >
                        {product.scoreGlobal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
