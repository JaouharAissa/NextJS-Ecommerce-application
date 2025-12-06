// app/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";

interface Product {
  _id: string;
  nom: string;
  description: string;
  images: string[];
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
    images: [] as string[],
    prix: "",
    categorie: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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

      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/products", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const catData = await catRes.json();
      const prodData = await prodRes.json();

      setCategories(Array.isArray(catData) ? catData : []);

      // Handle migration from single image to images array on the frontend if needed
      const normalizedProducts = (Array.isArray(prodData) ? prodData : []).map((p: any) => ({
        ...p,
        images: p.images || (p.image ? [p.image] : []),
      }));

      setProducts(normalizedProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit to 5 images total (existing + new)
      const totalImages = formData.images.length + files.length;
      if (totalImages > 5) {
        alert("Vous ne pouvez avoir que 5 images maximum par produit.");
        return;
      }

      setSelectedFiles((prev) => [...prev, ...files]);

      // Create previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrls((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const uploadedUrls: string[] = [];

      // Upload files one by one (simple implementation)
      for (const file of selectedFiles) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataUpload,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        uploadedUrls.push(data.url);
      }

      setUploading(false);
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      setUploading(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Upload new images
      let newImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        newImageUrls = await uploadImages();
      }

      // 2. Combine existing and new images
      const finalImages = [...formData.images, ...newImageUrls];

      if (finalImages.length === 0) {
        alert("Veuillez ajouter au moins une image.");
        return;
      }

      const token = localStorage.getItem("token");
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          images: finalImages,
          prix: parseFloat(formData.prix),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      // Reset form
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error instanceof Error ? error.message : "Une erreur est survenue");
    }
  };

  const resetForm = () => {
    setFormData({ nom: "", description: "", images: [], prix: "", categorie: "" });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      nom: product.nom,
      description: product.description,
      images: product.images || [],
      prix: product.prix.toString(),
      categorie: product.categorie._id,
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <AdminNavbar />

      <main className="container-main pb-16 pt-20 lg:pt-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <p className="text-sm uppercase tracking-wider text-gray-500 mb-1">Catalogue</p>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des produits</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/categories")}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Gérer les catégories
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Nouveau produit
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-card p-6 lg:p-8 mb-8 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix (DT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                    className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  rows={4}
                  required
                />
              </div>

              {/* Multi-Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images (1-5)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6">

                  {/* Image Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    {/* Existing Images */}
                    {formData.images.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, true)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Existant
                        </span>
                      </div>
                    ))}

                    {/* New Previews */}
                    {previewUrls.map((url, index) => (
                      <div key={`new-${index}`} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, false)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                          Nouveau
                        </span>
                      </div>
                    ))}

                    {/* Upload Button */}
                    {formData.images.length + selectedFiles.length < 5 && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition aspect-square">
                        <Upload className="text-gray-400 mb-2" size={24} />
                        <span className="text-sm text-gray-500 font-medium">Ajouter</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Formats acceptés: JPG, PNG, WEBP. Max 5 images.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 transition flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Upload en cours...
                    </>
                  ) : editingId ? (
                    "Mettre à jour le produit"
                  ) : (
                    "Créer le produit"
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
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
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Produit</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Catégorie</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Prix</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Score</th>
                <th className="py-4 px-6 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.nom}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.nom}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {product.categorie.nom}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">{product.prix.toFixed(2)} DT</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <span className="font-semibold text-gray-900">{product.score_moyen.toFixed(1)}</span>
                      <Star size={16} fill="currentColor" />
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Aucun produit</h3>
              <p className="text-gray-500 mt-1">Commencez par ajouter votre premier produit.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Star({ size = 24, fill = "none", className = "" }: { size?: number; fill?: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}