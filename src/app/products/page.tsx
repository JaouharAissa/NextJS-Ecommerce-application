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
      const totalImages = formData.images.length + files.length;
      if (totalImages > 5) {
        alert("Maximum 5 images per product.");
        return;
      }

      setSelectedFiles((prev) => [...prev, ...files]);

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
      let newImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        newImageUrls = await uploadImages();
      }

      const finalImages = [...formData.images, ...newImageUrls];

      if (finalImages.length === 0) {
        alert("Please add at least one image.");
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
        throw new Error(errorData.error || "Error saving product");
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
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
    if (!confirm("Delete this product?")) return;

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
        <div className="glass-card p-8">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <main className="container-main pb-16 pt-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] mb-1">Catalog</p>
          <h1 className="text-3xl font-heading font-bold text-white">Products Management</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => router.push("/categories")}
            className="btn-ghost"
          >
            Manage Categories
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn-gradient"
          >
            <Plus size={18} />
            New Product
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-card-static p-8 rounded-2xl mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-bold text-white">
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-[var(--glass-bg)] rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="glass-input w-full"
                    placeholder="e.g. Linen Shirt"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Price (DT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                    className="glass-input w-full"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Category</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="glass-input w-full"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-input w-full resize-none"
                  rows={4}
                  placeholder="Detailed product description..."
                  required
                />
              </div>

              {/* Multi-Image Upload */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)] mb-4">Images (1-5)</label>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {formData.images.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group aspect-[3/4] glass-card-static rounded-xl overflow-hidden">
                      <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index, true)}
                        className="absolute top-2 right-2 p-1.5 bg-[var(--background)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--error)]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative group aspect-[3/4] glass-card-static rounded-xl overflow-hidden">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index, false)}
                        className="absolute top-2 right-2 p-1.5 bg-[var(--background)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--error)]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {formData.images.length + selectedFiles.length < 5 && (
                    <label className="aspect-[3/4] glass-button rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors">
                      <Upload className="text-[var(--foreground-muted)] mb-2" size={24} />
                      <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">Add</span>
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
                <p className="text-xs text-[var(--foreground-muted)] mt-2">Formats: JPG, PNG, WEBP. Max 5 images.</p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-[var(--glass-border)]">
                <button type="submit" disabled={uploading} className="btn-gradient">
                  {uploading ? "Uploading..." : editingId ? "Update" : "Create Product"}
                </button>
                <button type="button" onClick={resetForm} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="glass-card-static rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th className="w-[40%]">Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Score</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="group">
                    <td>
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-12 bg-[var(--background-secondary)] rounded-lg flex-shrink-0 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.nom} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.nom}</p>
                          <p className="text-sm text-[var(--foreground-muted)] line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-[var(--foreground-muted)]">{product.categorie.nom}</td>
                    <td className="font-semibold text-white">{product.prix.toFixed(2)} DT</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{product.score_moyen.toFixed(1)}</span>
                        <Star size={14} className="fill-[var(--warning)] text-[var(--warning)]" />
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors"
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
              <div className="text-center py-16 text-[var(--foreground-muted)]">
                No products in catalog.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}