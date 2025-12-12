"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, Star, ArrowLeft, Send, X, Check, Heart } from "lucide-react";
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

  const [product, setProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingRating, setEditingRating] = useState(5);

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
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();

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

  const handleAddToCart = async () => {
    if (!product) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // D'abord récupérer le panier actuel
      const getRes = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });

      let currentCart = [];
      if (getRes.ok) {
        const data = await getRes.json();
        currentCart = data.cart || [];
      }

      // Vérifier si le produit existe déjà dans le panier
      const existingIndex = currentCart.findIndex(
        (item: any) => item.produitId === product._id
      );

      if (existingIndex > -1) {
        currentCart[existingIndex].quantite += 1;
      } else {
        currentCart.push({
          produitId: product._id,
          nom: product.nom,
          image: product.images?.[0] || "",
          prix: product.prix,
          quantite: 1,
        });
      }

      // Sauvegarder le panier mis à jour
      await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cart: currentCart })
      });

      setFeedback("Added to cart!");
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setFeedback("Error adding to cart");
      setTimeout(() => setFeedback(null), 3000);
    }
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
        setFeedback("Comment added!");
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
        setFeedback("Comment updated!");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/commentaires/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await Promise.all([fetchComments(), fetchProduct()]);
        setFeedback("Comment deleted.");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
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

  if (!product) return null;

  return (
    <div className="min-h-screen">
      <main className="container-main pt-8 pb-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-3 text-base uppercase tracking-wider text-[var(--foreground-muted)] hover:text-white transition-colors mb-8 glass-button px-6 py-3 rounded-2xl font-semibold"
        >
          <ArrowLeft size={22} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] w-full glass-card-static overflow-hidden rounded-2xl">
              <img
                src={product.images[selectedImage]}
                alt={product.nom}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-[3/4] w-full rounded-xl overflow-hidden transition-all ${selectedImage === idx
                      ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]"
                      : "opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="glass-card-static p-8 rounded-2xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="badge badge-primary">
                  {product.categorie?.nom}
                </span>
                <div className="flex items-center gap-2">
                  <Star size={18} className="fill-[var(--warning)] text-[var(--warning)]" />
                  <span className="font-semibold">{product.score_moyen?.toFixed(1) || "0.0"}</span>
                  <span className="text-sm text-[var(--foreground-muted)]">({comments.length} reviews)</span>
                </div>
              </div>

              <h1 className="text-3xl font-heading font-bold text-white mb-4">{product.nom}</h1>
              <p className="text-3xl font-bold text-gradient mb-6">{product.prix.toFixed(2)} DT</p>

              <p className="text-[var(--foreground-muted)] leading-relaxed mb-8">
                {product.description}
              </p>

              <button
                onClick={handleAddToCart}
                className="btn-gradient w-full py-4 text-base"
              >
                <ShoppingBag size={20} />
                Add to Cart
              </button>

              {feedback && (
                <div className="mt-4 p-4 bg-[var(--success)]/20 border border-[var(--success)]/30 rounded-xl flex items-center gap-2 text-[var(--success)] animate-fade-in">
                  <Check size={18} />
                  <span>{feedback}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center text-xs uppercase tracking-wider text-[var(--foreground-muted)] pt-8 mt-8 border-t border-[var(--glass-border)]">
                <div className="glass-button p-3 rounded-xl">Free Shipping</div>
                <div className="glass-button p-3 rounded-xl">30 Day Returns</div>
                <div className="glass-button p-3 rounded-xl">Secure Payment</div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="glass-card-static p-8 rounded-2xl">
              <h3 className="text-xl font-heading font-bold text-white mb-6">Customer Reviews</h3>

              {/* Add Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-8">
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={24}
                          className={`${star <= rating
                            ? "fill-[var(--warning)] text-[var(--warning)]"
                            : "text-[var(--foreground-muted)]"
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
                    placeholder="Share your experience..."
                    className="glass-input w-full pr-12 resize-none"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="absolute right-4 bottom-4 text-[var(--primary)] disabled:text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment._id} className="glass-button p-4 rounded-xl group">
                      {editingId === comment._id ? (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEditingRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  size={18}
                                  className={`${star <= editingRating
                                    ? "fill-[var(--warning)] text-[var(--warning)]"
                                    : "text-[var(--foreground-muted)]"
                                    }`}
                                />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="glass-input w-full resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-3">
                            <button onClick={cancelEdit} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                            <button onClick={submitEdit} className="btn-gradient px-4 py-2 text-sm">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-white">{comment.utilisateur?.username || "Anonymous"}</span>
                              <span className="text-xs text-[var(--foreground-muted)]">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < comment.note ? "fill-[var(--warning)] text-[var(--warning)]" : "text-[var(--foreground-muted)]"}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[var(--foreground-muted)] text-sm">{comment.contenu}</p>

                          {(userId === comment.utilisateur?._id || userRole === "admin") && (
                            <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {userId === comment.utilisateur?._id && (
                                <button onClick={() => startEdit(comment)} className="text-xs text-[var(--primary)] hover:text-[var(--accent)]">
                                  Edit
                                </button>
                              )}
                              <button onClick={() => handleDelete(comment._id)} className="text-xs text-[var(--error)] hover:text-red-400">
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--foreground-muted)] text-center py-8">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
