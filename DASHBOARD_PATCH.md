// Fichier de patch pour le dashboard - À copier manuellement dans src/app/dashboard/page.tsx

**IMPORTANT**: Le fichier dashboard a des problèmes lors de l'édition automatique.

Pour restaurer toutes les fonctionnalités (camembert général, alertes, bouton analytics), 
vous devez:

1. **Ajouter les imports manquants** (ligne 19):
```tsx
import { Package, Tag, TrendingUp, MessageSquare, BarChart3, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts"; // Ajouter à la ligne 7
```

2. **Ajouter l'interface ProductSentimentStats** (après l'interface Stats, ligne 44):
```tsx
interface ProductSentimentStats {
  produitId: string;
  nom: string;
  total: number;
  positifs: number;
  negatifs: number;
  neutres: number;
  positifPercent: number;
  neutrePercent: number;
  negatifPercent: number;
  scoreGlobal: number;
}
```

3. **Ajouter les états** (ligne 56-58):
```tsx
const [productSentimentStats, setProductSentimentStats] = useState<ProductSentimentStats[]>([]);
const [alertProducts, setAlertProducts] = useState<ProductSentimentStats[]>([]);
```

4. **Ajouter la validation des produits** (ligne 77-82, remplacer):
```tsx
const prodData = await prodRes.json();
const validProdData: Product[] = Array.isArray(prodData) ? prodData : [];
setProducts(validProdData);
```

5. **Ajouter le fetch des sentiments** (après setStats, ligne 99):
```tsx
// Fetch sentiment stats
const statsRes = await fetch("/api/stats", {
  headers: { Authorization: `Bearer ${token}` },
});
if (statsRes.ok) {
  const statsData = await statsRes.json();
  if (statsData.sentimentParProduit) {
    setProductSentimentStats(statsData.sentimentParProduit);
    const alerts = statsData.sentimentParProduit.filter(
      (p: ProductSentimentStats) => p.negatifPercent > 30
    );
    setAlertProducts(alerts);
  }
}
```

6. **Ajouter le bouton Analytics** dans Quick Actions (ligne 218-250):
Changer `md:grid-cols-4` en `md:grid-cols-5` et ajouter:
```tsx
<button
  onClick={() => router.push("/analytics")}
  className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl hover:shadow-lg transition"
>
  <BarChart3 size={24} />
  <span>Analytics</span>
</button>
```

7. **Ajouter les Alertes et le Camembert** (après Quick Actions, avant Charts):
```tsx
{/* Alerts */}
{alertProducts.length > 0 && (
  <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
    <div className="flex items-center gap-3 mb-4">
      <AlertTriangle className="text-red-600" size={24} />
      <h3 className="text-lg font-bold text-red-900">Produits nécessitant attention</h3>
    </div>
    <div className="space-y-2">
      {alertProducts.map((p) => (
        <div key={p.produitId} className="flex justify-between items-center bg-white p-3 rounded">
          <span className="font-medium">{p.nom}</span>
          <span className="text-red-600 font-semibold">{p.negatifPercent.toFixed(1)}% négatif</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* Camembert Général */}
{productSentimentStats.length > 0 && (() => {
  const totalPositifs = productSentimentStats.reduce((sum, p) => sum + p.positifs, 0);
  const totalNegatifs = productSentimentStats.reduce((sum, p) => sum + p.negatifs, 0);
  const totalNeutres = productSentimentStats.reduce((sum, p) => sum + p.neutres, 0);
  const pieData = [
    { name: "Positif", value: totalPositifs, color: "#10b981" },
    { name: "Négatif", value: totalNegatifs, color: "#ef4444" },
    { name: "Neutre", value: totalNeutres, color: "#f59e0b" },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-xl font-bold mb-4">Sentiment Général</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
})()}
```

Ces modifications ajouteront:
- ✅ Camembert général des sentiments
- ✅ Alertes pour les produits avec sentiment négatif > 30%
- ✅ Bouton Analytics dans les actions rapides
- ✅ Fix du bug products.slice

Le fichier analytics (/analytics) est déjà créé et fonctionnel!
