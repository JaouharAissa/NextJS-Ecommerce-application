// app/products/page.tsx (VERSION COMPLÈTE AVEC UPLOAD)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";

interface Product {
  _id: string;
  nom: string;
  description: string;
  image: string;
  prix: number;
  score_moyen: number;
  categorie: {
    _id: string;
    nom: string;
  };
}

interface Category {
  _id: string;
  nom: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    image: "",
    prix: "",
    categorie: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const catRes = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catRes.json();
      setCategories(catData);

      const prodRes = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prodData = await prodRes.json();
      setProducts(prodData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!selectedFile) return formData.image;

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formDataUpload = new FormData();
      formDataUpload.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      const data = await res.json();
      setUploading(false);
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploading(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload image d'abord si un fichier est sélectionné
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadImage();
      }

      const token = localStorage.getItem("token");
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          prix: parseFloat(formData.prix),
        }),
      });

      // Reset form
      setFormData({ nom: "", description: "", image: "", prix: "", categorie: "" });
      setSelectedFile(null);
      setPreviewUrl("");
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      nom: product.nom,
      description: product.description,
      image: product.image,
      prix: product.prix.toString(),
      categorie: product.categorie._id,
    });
    setPreviewUrl(product.image);
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
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

      <main className="max-w-7xl mx-auto px-4 pb-12 pt-28">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Catalogue</p>
            <h1 className="text-3xl font-bold text-slate-900">Gestion des produits</h1>
            <p className="text-slate-500 mt-2">
              Ajoutez de nouvelles références, mettez à jour les descriptions et gardez votre vitrine inspirante.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/categories")}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-slate-400 transition"
            >
              Gérer les catégories
            </button>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ nom: "", description: "", image: "", prix: "", categorie: "" });
                setSelectedFile(null);
                setPreviewUrl("");
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl transition"
            >
              <Plus size={18} />
              Nouveau produit
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nom du produit"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Prix (DT)"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />

              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.nom}
                  </option>
                ))}
              </select>

              {/* Upload Image */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6">
                <div className="flex flex-col items-center">
                  <Upload className="text-gray-400 mb-2" size={48} />
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">
                    Choisir une image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedFile ? selectedFile.name : "Aucun fichier sélectionné"}
                  </p>

                  {/* Preview */}
                  {previewUrl && (
                    <div className="mt-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-48 h-48 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  {uploading ? "Upload en cours..." : editingId ? "Mettre à jour" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Image</th>
                <th className="py-3 px-4 text-left">Nom</th>
                <th className="py-3 px-4 text-left">Catégorie</th>
                <th className="py-3 px-4 text-left">Prix</th>
                <th className="py-3 px-4 text-left">Score</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img
                      src={product.image || "/placeholder-product.jpg"}
                      alt={product.nom}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{product.nom}</td>
                  <td className="py-3 px-4">{product.categorie.nom}</td>
                  <td className="py-3 px-4">{product.prix.toFixed(2)} DT</td>
                  <td className="py-3 px-4">{product.score_moyen.toFixed(1)} ⭐</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun produit disponible
            </div>
          )}
        </div>
      </main>
    </div>
  );
}