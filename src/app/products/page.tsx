"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Star } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <AdminNavbar />

      <main className="container-main pb-16 pt-24">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Catalogue</p>
          <h1 className="text-3xl font-serif font-medium">Gestion des produits</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-12 pb-8 border-b border-gray-100">
          <button
            onClick={() => router.push("/categories")}
            className="px-6 py-3 rounded-none border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors uppercase tracking-wider"
          >
            Gérer les catégories
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors uppercase tracking-wider"
          >
            <Plus size={16} />
            Nouveau produit
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-12 bg-gray-50 p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-serif font-medium">
                {editingId ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Nom du produit</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full border-b border-gray-300 bg-transparent py-2 text-lg focus:border-black focus:outline-none transition-colors placeholder:text-gray-300"
                    placeholder="Ex: Chemise en lin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Prix (DT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                    className="w-full border-b border-gray-300 bg-transparent py-2 text-lg focus:border-black focus:outline-none transition-colors placeholder:text-gray-300"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full border-b border-gray-300 bg-transparent py-2 text-base focus:border-black focus:outline-none transition-colors"
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
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 bg-white p-4 text-sm focus:border-black focus:outline-none transition-colors resize-y min-h-[100px]"
                  rows={4}
                  placeholder="Description détaillée du produit..."
                  required
                />
              </div>

              {/* Multi-Image Upload */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">Images (1-5)</label>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Existing Images */}
                  {formData.images.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group aspect-[3/4] bg-white border border-gray-200">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, true)}
                        className="absolute top-2 right-2 bg-white text-black p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* New Previews */}
                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative group aspect-[3/4] bg-white border border-gray-200">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, false)}
                        className="absolute top-2 right-2 bg-white text-black p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  {formData.images.length + selectedFiles.length < 5 && (
                    <label className="aspect-[3/4] border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-white transition-colors bg-transparent">
                      <Upload className="text-gray-400 mb-2" size={24} />
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Ajouter</span>
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
                <p className="text-xs text-gray-400 mt-2">
                  Formats acceptés: JPG, PNG, WEBP. Max 5 images.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-black text-white px-8 py-3 text-sm font-medium uppercase tracking-wider hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {uploading ? "Upload en cours..." : editingId ? "Mettre à jour" : "Créer le produit"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 text-sm font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-4 text-xs font-medium uppercase tracking-wider text-gray-500 w-[40%]">Produit</th>
                <th className="py-4 text-xs font-medium uppercase tracking-wider text-gray-500">Catégorie</th>
                <th className="py-4 text-xs font-medium uppercase tracking-wider text-gray-500">Prix</th>
                <th className="py-4 text-xs font-medium uppercase tracking-wider text-gray-500">Score</th>
                <th className="py-4 text-xs font-medium uppercase tracking-wider text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product._id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-4 pr-6">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-16 bg-gray-100 flex-shrink-0 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.nom}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.nom}</p>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600">
                    {product.categorie.nom}
                  </td>
                  <td className="py-4 font-medium text-gray-900">{product.prix.toFixed(2)} DT</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{product.score_moyen.toFixed(1)}</span>
                      <Star size={14} className="text-gray-400 fill-gray-400" />
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
            <div className="text-center py-24 border-t border-gray-100">
              <p className="text-gray-400">Aucun produit dans le catalogue.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}