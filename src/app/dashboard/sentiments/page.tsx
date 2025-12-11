"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
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
        throw new Error("Erreur lors du chargement des statistiques");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <AdminNavbar />

      <main className="container-main pb-16 pt-20 lg:pt-24 space-y-12 lg:space-y-16">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-3 glass-button rounded-xl hover:scale-110 transition-all"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Sentiment Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Visualize review distribution for each product
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Type a product name to see stats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-card border-0 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Alertes produits à surveiller */}
        {productStats.filter((p) => p.total >= 5 && p.negatifPercent >= 40).length > 0 && (
          <div className="glass-card p-6 rounded-2xl border-l-4 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">
                Products to Watch ({productStats.filter((p) => p.total >= 5 && p.negatifPercent >= 40).length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productStats
                .filter((p) => p.total >= 5 && p.negatifPercent >= 40)
                .map((product) => (
                  <div
                    key={product.produitId}
                    className="p-4 glass-button rounded-xl hover-lift bg-red-50 border border-red-200"
                  >
                    <p className="font-bold text-gray-900 mb-1">{product.nom}</p>
                    <p className="text-sm text-gray-600">
                      {product.total} reviews • {product.negatifPercent.toFixed(1)}% negative
                    </p>
                    <p className="text-xs text-red-600 font-medium mt-2">
                      Score: {product.scoreGlobal.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Liste des produits avec camemberts */}
        {filteredProducts.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl">
            <p className="text-lg text-gray-600 font-medium">
              {searchQuery ? "No products found" : "No products with comments"}
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
                  className="glass-card p-6 rounded-2xl hover-lift space-y-4"
                >
                  {/* Product Info */}
                  <div className="text-center space-y-2">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.nom}
                        className="w-20 h-20 mx-auto rounded-xl object-cover"
                      />
                    )}
                    <h3 className="font-bold text-lg text-gray-900">{product.nom}</h3>
                    <p className="text-sm text-gray-600">
                      {product.total} reviews • Avg Rating: {product.noteMoyenne?.toFixed(1) || "0.0"} ⭐
                    </p>
                  </div>

                  {/* Pie Chart */}
                  {pieData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
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
                                />
                              );
                            })}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      <p>No data</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Positive:</span>
                      <span className="font-semibold text-green-600">
                        {product.positifPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Neutral:</span>
                      <span className="font-semibold text-yellow-600">
                        {product.neutrePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Negative:</span>
                      <span className="font-semibold text-red-600">
                        {product.negatifPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Global Score:</span>
                      <span
                        className={`font-bold ${product.scoreGlobal >= 0.5
                          ? "text-green-600"
                          : product.scoreGlobal >= 0
                            ? "text-yellow-600"
                            : "text-red-600"
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


