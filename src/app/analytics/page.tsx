"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ProductSentiment {
    produitId: string;
    nom: string;
    positif: number;
    negatif: number;
    neutre: number;
    total: number;
}

export default function AnalyticsPage() {
    const [sentiments, setSentiments] = useState<ProductSentiment[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "admin") {
            router.push("/login");
            return;
        }

        fetchSentiments();
    }, [router]);

    const fetchSentiments = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/stats", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.sentimentParProduit) {
                    setSentiments(data.sentimentParProduit);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching sentiments:", error);
            setLoading(false);
        }
    };

    const COLORS = {
        positif: "#10b981",
        negatif: "#ef4444",
        neutre: "#f59e0b",
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pattern">
                <div className="glass-card p-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pattern">
            {/* Glass Navbar */}
            <header className="glass-nav sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center gap-3 glass-button px-5 py-3 rounded-xl hover:scale-105 transition-all"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-semibold text-gray-700">Retour au tableau de bord</span>
                        </button>

                        <h1 className="text-3xl font-bold text-gradient-blue">Analytics</h1>

                        <div className="w-48"></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                <div className="mb-10 animate-fade-in">
                    <h2 className="text-4xl font-bold text-white mb-2">Répartition des sentiments par produit</h2>
                    <p className="text-white/80 text-lg">Analyse détaillée des avis clients pour chaque produit</p>
                </div>

                {sentiments.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <p className="text-gray-600 text-lg">Aucune donnée de sentiment disponible</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {sentiments.map((sentiment, index) => {
                            const chartData = [
                                { name: "Positif", value: sentiment.positif, color: COLORS.positif },
                                { name: "Négatif", value: sentiment.negatif, color: COLORS.negatif },
                                { name: "Neutre", value: sentiment.neutre, color: COLORS.neutre },
                            ].filter((item) => item.value > 0);

                            const positifPercent = sentiment.total > 0 ? (sentiment.positif / sentiment.total) * 100 : 0;
                            const negatifPercent = sentiment.total > 0 ? (sentiment.negatif / sentiment.total) * 100 : 0;
                            const neutrePercent = sentiment.total > 0 ? (sentiment.neutre / sentiment.total) * 100 : 0;

                            return (
                                <div
                                    key={sentiment.produitId}
                                    className="glass-card p-6 hover-lift animate-scale-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{sentiment.nom}</h3>

                                    {chartData.length > 0 ? (
                                        <>
                                            <div className="h-64 mb-6">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={chartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <TrendingUp className="text-green-500" size={20} />
                                                        <span className="font-semibold text-gray-700">Positif</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-green-600">{sentiment.positif}</p>
                                                        <p className="text-xs text-gray-500">{positifPercent.toFixed(1)}%</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <TrendingDown className="text-red-500" size={20} />
                                                        <span className="font-semibold text-gray-700">Négatif</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-red-600">{sentiment.negatif}</p>
                                                        <p className="text-xs text-gray-500">{negatifPercent.toFixed(1)}%</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <Minus className="text-yellow-500" size={20} />
                                                        <span className="font-semibold text-gray-700">Neutre</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-yellow-600">{sentiment.neutre}</p>
                                                        <p className="text-xs text-gray-500">{neutrePercent.toFixed(1)}%</p>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-gray-200/50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-gray-700">Total des avis</span>
                                                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {sentiment.total}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Aucun avis pour ce produit</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
