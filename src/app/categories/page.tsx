"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Tag, ArrowRight } from "lucide-react";
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <AdminNavbar />

      <main className="container-main pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium mb-2">Catégories</h1>
          <p className="text-gray-500 text-sm">Gérez les univers de votre boutique</p>
        </div>

        <div className="mb-12 pb-8 border-b border-gray-100">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setCategoryName("");
            }}
            className="btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Nouvelle catégorie
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-50 p-8 mb-12 border border-gray-100">
            <h2 className="text-lg font-medium mb-6 uppercase tracking-wider">
              {editingId ? "Modifier la catégorie" : "Ajouter une catégorie"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Nom de la catégorie"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="flex-1 bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setCategoryName("");
                  }}
                  className="px-8 py-4 border border-gray-200 text-sm font-medium uppercase tracking-wider hover:bg-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-8 py-4 text-sm font-medium uppercase tracking-wider hover:bg-gray-900 transition-colors"
                >
                  {editingId ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category._id}
              className="group border border-gray-100 p-6 hover:border-black transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <Tag size={20} className="text-gray-400 group-hover:text-black transition-colors" />
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="p-2 hover:bg-gray-100 text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-medium">{category.nom}</h3>
              <div className="mt-4 flex items-center text-xs uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors">
                Voir les produits <ArrowRight size={14} className="ml-2" />
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-24 border border-dashed border-gray-200">
            <Tag className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 mb-4">Aucune catégorie disponible</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
            >
              Créer votre première catégorie
            </button>
          </div>
        )}
      </main>
    </div>
  );
}