import { AlertTriangle, ArrowRight, TrendingDown } from "lucide-react";
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
            <div className="border border-gray-100 bg-white rounded-xl p-8 text-center">
                <p className="text-gray-500">No sentiment data available yet.</p>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/5 rounded-full text-black">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif font-medium text-gray-900">AI Sentiment Analysis</h3>
                        <p className="text-sm text-gray-500">Sentiment breakdown by product</p>
                    </div>
                </div>
                <Link href="/dashboard/sentiments" className="text-sm font-medium underline underline-offset-4 hover:text-gray-600">
                    Show All
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="py-4 px-6 text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                            <th className="py-4 px-6 text-xs font-medium uppercase tracking-wider text-gray-500">Total Reviews</th>
                            <th className="py-4 px-6 text-xs font-medium uppercase tracking-wider text-gray-500">Negative</th>
                            <th className="py-4 px-6 text-xs font-medium uppercase tracking-wider text-gray-500">Negative Rate</th>
                            <th className="py-4 px-6 text-xs font-medium uppercase tracking-wider text-gray-500">Positive Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {productsWithReviews.slice(0, 5).map((stat) => {
                            const isAlert = stat.negatifPercent > 20;
                            return (
                                <tr key={stat.produitId} className={`hover:bg-gray-50 transition-colors ${isAlert ? "bg-red-50/30" : ""}`}>
                                    <td className="py-4 px-6 font-medium text-gray-900">{stat.nom}</td>
                                    <td className="py-4 px-6 text-gray-600">{stat.total}</td>
                                    <td className={`py-4 px-6 font-medium ${isAlert ? "text-red-600" : "text-gray-600"}`}>{stat.negatifs}</td>
                                    <td className="py-4 px-6">
                                        <div className={`flex items-center gap-2 font-bold ${isAlert ? "text-red-600" : "text-green-600"}`}>
                                            {isAlert ? <TrendingDown size={16} /> : null}
                                            {stat.negatifPercent.toFixed(1)}%
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 font-bold text-green-600">
                                            {stat.positifPercent.toFixed(1)}%
                                        </div>
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
