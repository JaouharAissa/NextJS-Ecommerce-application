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

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const router = useRouter();

  useEffect(() => {
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
        alert(error.error || "Error saving category");
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
    if (!confirm("Delete this category?")) return;

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
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Categories</h1>
          <p className="text-[var(--foreground-muted)]">Manage your store's product categories</p>
        </div>

        <div className="mb-8">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setCategoryName("");
            }}
            className="btn-gradient"
          >
            <Plus size={18} />
            New Category
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-card-static p-6 rounded-2xl mb-8 animate-fade-in">
            <h2 className="text-lg font-heading font-bold text-white mb-4">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="glass-input flex-1"
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
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gradient">
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="glass-card p-6 rounded-2xl group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-[var(--accent)]/20">
                  <Tag size={24} className="text-[var(--accent)]" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="p-2 hover:bg-[var(--error)]/10 text-[var(--error)] rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-heading font-bold text-white">{category.nom}</h3>
              <div className="mt-4 flex items-center text-xs uppercase tracking-wider text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition-colors cursor-pointer">
                View products <ArrowRight size={14} className="ml-2" />
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="glass-card-static p-16 text-center rounded-2xl">
            <Tag className="mx-auto text-[var(--foreground-muted)] mb-4" size={48} />
            <p className="text-[var(--foreground-muted)] mb-4">No categories available</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
            >
              Create your first category
            </button>
          </div>
        )}
      </main>
    </div>
  );
}