// app/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";

interface Category {
  _id: string;
  nom: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const router = useRouter();

  useEffect(() => {
    // Vérifier que c'est un admin
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: categoryName }),
      });

      if (res.ok) {
        setCategoryName("");
        setEditingId(null);
        setShowForm(false);
        fetchCategories();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setCategoryName(category.nom);
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="max-w-5xl mx-auto px-4 pb-12 pt-28">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
              <Tag size={24} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Catalogue</p>
              <h1 className="text-3xl font-bold text-slate-900">Gestion des catégories</h1>
              <p className="text-slate-500 mt-1">
                Structurez vos univers produit pour un parcours client fluide.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/products")}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-slate-400 transition"
            >
              Gérer les produits
            </button>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setCategoryName("");
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl transition"
            >
              <Plus size={18} />
              Nouvelle catégorie
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Modifier la catégorie" : "Ajouter une catégorie"}
            </h2>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                type="text"
                placeholder="Nom de la catégorie (ex: Pantalons, Chaussures)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="border p-3 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
              >
                {editingId ? "Mettre à jour" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setCategoryName("");
                }}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Tag className="text-blue-600" size={24} />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {category.nom}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-dashed border-slate-200">
            <Tag className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-500 text-lg">Aucune catégorie disponible</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              Créer votre première catégorie
            </button>
          </div>
        )}
      </main>
    </div>
  );
}