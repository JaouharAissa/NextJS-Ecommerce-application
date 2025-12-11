"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, Star, ArrowLeft, MessageSquare, Send, User, X, Check } from "lucide-react";
import Navbar from "@/app/components/Navbar";

interface Comment {
  _id: string;
  contenu: string;
  note: number;
  createdAt: string;
  updatedAt: string;
  utilisateur?: {
    _id: string;
    username: string;
    email: string;
  };
}

interface Product {
  _id: string;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  categorie?: {
    nom: string;
  };
  score_moyen: number;
}

const decodeToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload as { userId: string; role: string };
  } catch (error) {
    console.warn("Unable to decode token", error);
    return null;
  }
};

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();

  // Data state
  const [product, setProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // User state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // UI state
  const [selectedImage, setSelectedImage] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Comment form state
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Edit comment state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingRating, setEditingRating] = useState(5);

  // Links for Navbar
  const links = [
    { name: "Accueil", href: "/" },
    { name: "Boutique", href: "/home" },
    { name: "Contact", href: "/contact" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUserRole(decoded.role);
        setUserId(decoded.userId);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProduct(), fetchComments()]);
    setLoading(false);
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Produit non trouvé");
      const data = await res.json();

      // Ensure images is an array
      const normalizedProduct = {
        ...data,
        images: data.images && data.images.length > 0 ? data.images : (data.image ? [data.image] : []),
      };

      setProduct(normalizedProduct);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/commentaires?produitId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item: any) => item._id === product._id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    alert("Produit ajouté au panier");
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/commentaires", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          produitId: id,
          contenu: newComment,
          note: rating,
        }),
      });

      if (res.ok) {
        setNewComment("");
        setRating(5);
        await Promise.all([fetchComments(), fetchProduct()]);
        setFeedback("Commentaire ajouté !");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment._id);
    setEditingContent(comment.contenu);
    setEditingRating(comment.note);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
    setEditingRating(5);
  };

  const submitEdit = async () => {
    if (!editingId) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/commentaires/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contenu: editingContent,
          note: editingRating,
        }),
      });

      if (res.ok) {
        cancelEdit();
        await Promise.all([fetchComments(), fetchProduct()]);
        setFeedback("Commentaire mis à jour !");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/commentaires/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await Promise.all([fetchComments(), fetchProduct()]);
        setFeedback("Commentaire supprimé.");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white text-black font-sans">


      <main className="container-main pt-24 pb-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] w-full bg-gray-100 overflow-hidden">
              <img
                src={product.images[selectedImage]}
                alt={product.nom}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-[3/4] w-full bg-gray-100 overflow-hidden transition-all ${selectedImage === idx ? "ring-1 ring-black" : "opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col h-full">
            <div className="border-b border-gray-200 pb-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {product.categorie?.nom}
                </span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-black text-black" />
                  <span className="text-sm font-medium">{product.score_moyen?.toFixed(1) || "0.0"}</span>
                  <span className="text-xs text-gray-400">({comments.length} avis)</span>
                </div>
              </div>

              <h1 className="text-4xl font-serif font-medium mb-4">{product.nom}</h1>
              <p className="text-2xl font-light mb-6">{product.prix.toFixed(2)} DT</p>

              <p className="text-gray-600 leading-relaxed text-sm">
                {product.description}
              </p>
            </div>

            <div className="space-y-6">
              <button
                onClick={handleAddToCart}
                className="w-full bg-black text-white py-4 text-sm font-medium uppercase tracking-wider hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                Ajouter au panier
              </button>

              <div className="grid grid-cols-3 gap-4 text-center text-xs uppercase tracking-wider text-gray-500 pt-8">
                <div>Livraison Gratuite</div>
                <div>Retour sous 30 jours</div>
                <div>Paiement Sécurisé</div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-16 pt-16 border-t border-gray-200">
              <h3 className="text-xl font-serif font-medium mb-8">Avis Clients</h3>

              {feedback && (
                <div className="mb-6 p-4 bg-gray-50 text-sm text-gray-600 flex items-center gap-2">
                  <Check size={16} />
                  {feedback}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-12">
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Votre note</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          size={20}
                          className={`${star <= rating ? "fill-black text-black" : "text-gray-300"
                            } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    className="w-full border-b border-gray-300 py-3 pr-12 text-sm focus:border-black focus:outline-none transition-colors resize-none bg-transparent placeholder:text-gray-400"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="absolute right-0 bottom-3 text-black disabled:text-gray-300 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-8">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment._id} className="group">
                      {editingId === comment._id ? (
                        <div className="bg-gray-50 p-6 space-y-4">
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEditingRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  size={16}
                                  className={`${star <= editingRating ? "fill-black text-black" : "text-gray-300"
                                    }`}
                                />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-black"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={cancelEdit} className="text-xs uppercase tracking-wider text-gray-500 hover:text-black">Annuler</button>
                            <button onClick={submitEdit} className="text-xs uppercase tracking-wider text-black font-medium">Enregistrer</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{comment.utilisateur?.username || "Anonyme"}</span>
                              <span className="text-xs text-gray-400">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < comment.note ? "fill-black text-black" : "text-gray-200"}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">{comment.contenu}</p>

                          {(userId === comment.utilisateur?._id || userRole === "admin") && (
                            <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {userId === comment.utilisateur?._id && (
                                <button onClick={() => startEdit(comment)} className="text-xs text-gray-400 hover:text-black">Modifier</button>
                              )}
                              <button onClick={() => handleDelete(comment._id)} className="text-xs text-gray-400 hover:text-red-600">Supprimer</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic">Aucun avis pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
