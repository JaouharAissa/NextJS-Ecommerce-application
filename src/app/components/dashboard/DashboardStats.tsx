import { TrendingUp, Package, MessageSquare, AlertTriangle } from "lucide-react";

interface DashboardStatsProps {
    stats: {
        totalProducts: number;
        totalCategories: number;
        averagePrice: number;
        averageScore: number;
    };
    totalOrders: number;
    totalReviews: number;
    negativeReviewsCount: number;
}

export default function DashboardStats({ stats, totalOrders, totalReviews, negativeReviewsCount }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-gray-100 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Produits</span>
                    <Package size={18} className="text-gray-400" />
                </div>
                <p className="text-3xl font-serif font-medium">{stats.totalProducts}</p>
                <p className="text-xs text-gray-400 mt-2">Total catalogue</p>
            </div>

            <div className="p-6 border border-gray-100 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Commandes</span>
                    <TrendingUp size={18} className="text-gray-400" />
                </div>
                <p className="text-3xl font-serif font-medium">{totalOrders}</p>
                <p className="text-xs text-gray-400 mt-2">Commandes récentes</p>
            </div>

            <div className="p-6 border border-gray-100 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Avis Total</span>
                    <MessageSquare size={18} className="text-gray-400" />
                </div>
                <p className="text-3xl font-serif font-medium">{totalReviews}</p>
                <p className="text-xs text-gray-400 mt-2">Analysés par IA</p>
            </div>

            <div className="p-6 border border-gray-100 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Average Score</span>
                    <TrendingUp size={18} className="text-gray-400" />
                </div>
                <p className="text-3xl font-serif font-medium">{stats.averageScore.toFixed(1)}</p>
                <p className="text-xs text-gray-400 mt-2">Global Rating</p>
            </div>

            <div className={`p-6 border rounded-xl hover:shadow-sm transition-shadow ${negativeReviewsCount > 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-100"
                }`}>
                <div className="flex items-start justify-between mb-4">
                    <span className={`text-xs font-medium uppercase tracking-wider ${negativeReviewsCount > 0 ? "text-red-600" : "text-gray-500"
                        }`}>Negative Alerts</span>
                    <AlertTriangle size={18} className={negativeReviewsCount > 0 ? "text-red-500" : "text-gray-400"} />
                </div>
                <p className={`text-3xl font-serif font-medium ${negativeReviewsCount > 0 ? "text-red-700" : "text-black"}`}>
                    {negativeReviewsCount}
                </p>
                <p className={`text-xs mt-2 ${negativeReviewsCount > 0 ? "text-red-500" : "text-gray-400"}`}>
                    Products to watch
                </p>
            </div>
        </div>
    );
}
