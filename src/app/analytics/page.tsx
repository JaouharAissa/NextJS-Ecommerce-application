"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AdminNavbar from "@/app/components/AdminNavbar";

interface ProductSentiment {
    produitId: string;
    nom: string;
    positif: number;
    negatif: number;
    neutre: number;
    total: number;
}

const COLORS = {
    positif: "#10b981",
    negatif: "#ef4444",
    neutre: "#f59e0b",
};

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
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="p-3 glass-button rounded-xl hover:bg-[var(--glass-bg-hover)] transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-white">Analytics</h1>
                        <p className="text-[var(--foreground-muted)]">Sentiment distribution by product</p>
                    </div>
                </div>

                {sentiments.length === 0 ? (
                    <div className="glass-card-static p-16 text-center rounded-2xl">
                        <p className="text-[var(--foreground-muted)]">No sentiment data available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {sentiments.map((sentiment, index) => {
                            const chartData = [
                                { name: "Positive", value: sentiment.positif, color: COLORS.positif },
                                { name: "Negative", value: sentiment.negatif, color: COLORS.negatif },
                                { name: "Neutral", value: sentiment.neutre, color: COLORS.neutre },
                            ].filter((item) => item.value > 0);

                            const positifPercent = sentiment.total > 0 ? (sentiment.positif / sentiment.total) * 100 : 0;
                            const negatifPercent = sentiment.total > 0 ? (sentiment.negatif / sentiment.total) * 100 : 0;
                            const neutrePercent = sentiment.total > 0 ? (sentiment.neutre / sentiment.total) * 100 : 0;

                            return (
                                <div
                                    key={sentiment.produitId}
                                    className="glass-card p-6 rounded-2xl"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <h3 className="text-xl font-heading font-bold text-white mb-4">{sentiment.nom}</h3>

                                    {chartData.length > 0 ? (
                                        <>
                                            <div className="h-48 mb-6">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={chartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={70}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                                            ))}
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

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <TrendingUp className="text-[var(--success)]" size={20} />
                                                        <span className="font-medium text-white">Positive</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-[var(--success)]">{sentiment.positif}</p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">{positifPercent.toFixed(1)}%</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <TrendingDown className="text-[var(--error)]" size={20} />
                                                        <span className="font-medium text-white">Negative</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-[var(--error)]">{sentiment.negatif}</p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">{negatifPercent.toFixed(1)}%</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <Minus className="text-[var(--warning)]" size={20} />
                                                        <span className="font-medium text-white">Neutral</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-[var(--warning)]">{sentiment.neutre}</p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">{neutrePercent.toFixed(1)}%</p>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-[var(--glass-border)]">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-white">Total Reviews</span>
                                                        <span className="text-xl font-bold text-gradient">
                                                            {sentiment.total}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-[var(--foreground-muted)]">No reviews for this product</p>
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
