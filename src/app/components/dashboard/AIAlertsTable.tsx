import { AlertTriangle, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";

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

interface AIAlertsTableProps {
    sentimentStats: ProductSentimentStats[];
}

export default function AIAlertsTable({ sentimentStats }: AIAlertsTableProps) {
    // Filter products with at least 1 review, sorted by negative percentage descending
    const productsWithReviews = sentimentStats
        .filter((stat) => stat.total > 0)
        .sort((a, b) => b.negatifPercent - a.negatifPercent);

    if (productsWithReviews.length === 0) {
        return (
            <div className="glass-card-static p-8 text-center rounded-2xl">
                <p className="text-[var(--foreground-muted)]">No sentiment data available yet.</p>
            </div>
        );
    }

    return (
        <div className="glass-card-static rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[var(--accent)]/20">
                        <AlertTriangle size={20} className="text-[var(--accent)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-heading font-bold text-white">AI Sentiment Analysis</h3>
                        <p className="text-xs text-[var(--foreground-muted)]">Sentiment breakdown by product</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/sentiments"
                    className="text-sm text-[var(--primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
                >
                    View All <ArrowRight size={14} />
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Reviews</th>
                            <th>Negative</th>
                            <th>Neg. Rate</th>
                            <th>Pos. Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productsWithReviews.slice(0, 5).map((stat) => {
                            const isAlert = stat.negatifPercent > 20;
                            return (
                                <tr
                                    key={stat.produitId}
                                    className={isAlert ? "bg-[var(--error)]/5" : ""}
                                >
                                    <td className="font-medium text-white">{stat.nom}</td>
                                    <td className="text-[var(--foreground-muted)]">{stat.total}</td>
                                    <td className={isAlert ? "text-[var(--error)] font-semibold" : "text-[var(--foreground-muted)]"}>
                                        {stat.negatifs}
                                    </td>
                                    <td>
                                        <div className={`flex items-center gap-2 font-semibold ${isAlert ? "text-[var(--error)]" : "text-[var(--success)]"}`}>
                                            {isAlert && <TrendingDown size={14} />}
                                            {stat.negatifPercent.toFixed(1)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span className="font-semibold text-[var(--success)]">
                                            {stat.positifPercent.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
