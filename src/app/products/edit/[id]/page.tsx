"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "@/app/components/AdminNavbar";

interface ProductResponse {
  nom: string;
  prix: number;
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Produit introuvable");
        }
        const data: ProductResponse = await res.json();
        setName(data.nom);
        setPrice(data.prix.toString());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: name, prix: parseFloat(price) }),
      });
      router.push("/products");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="max-w-3xl mx-auto px-4 pb-12 pt-28">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Produits</p>
            <h1 className="text-3xl font-bold text-slate-900">Modifier le produit</h1>
            <p className="text-slate-500 mt-2">Mettez à jour les informations et le prix du produit sélectionné.</p>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nom</label>
              <input
                type="text"
                placeholder="Nom du produit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Prix (DT)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Prix"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="flex-1 min-w-[180px] bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="flex-1 min-w-[180px] bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}