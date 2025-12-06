"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface ProduitDetail {
  _id: string;
  nom: string;
  description: string;
  images: string[];
  prix: number;
  score_moyen: number;
  categorie?: {
    nom: string;
  };
}

interface Commentaire {
  _id: string;
  contenu: string;
  note: number;
  createdAt: string;
  updatedAt: string;
  utilisateur?: {
    _id: string;
    username: string;
    email: string;
    role?: string;
  };
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

const StarDisplay = ({ value }: { value: number }) => (
  <div className="flex items-center space-x-1">
    {[1, 2, 3, 4, 5].map((index) => (
      <Star
        key={index}
        size={18}
        className={index <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
      />
    ))}
  </div>
);

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const produitId = params?.id;

  const [product, setProduct] = useState<ProduitDetail | null>(null);
  const [comments, setComments] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingRating, setEditingRating] = useState(5);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const role = localStorage.getItem("role");
    setUserRole(role);
    const decoded = decodeToken(token);
    if (decoded?.userId) {
      setUserId(decoded.userId);
    }

    if (!produitId) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProduct(), fetchComments()]);
      setLoading(false);
    };

    loadData();
  }, [produitId, router]);

  const fetchProduct = async () => {
    if (!produitId) return;
    try {
      const res = await fetch(`/api/products/${produitId}`);
      if (!res.ok) {
        throw new Error("Produit introuvable");
      }
      const data: any = await res.json();

      // Handle migration from single image to images array
      const normalizedProduct: ProduitDetail = {
        ...data,
        images: data.images || (data.image ? [data.image] : ["/placeholder.jpg"]),
      };

      setProduct(normalizedProduct);
    } catch (error) {
      console.error("Error fetching product:", error);
      setFeedback("Impossible de charger le produit.");
    }
  };

  const fetchComments = async () => {
    if (!produitId) return;
    try {
      const res = await fetch(`/api/commentaires?produitId=${produitId}`);
      if (!res.ok) {
        throw new Error("Erreur chargement commentaires");
      }
      const data: Commentaire[] = await res.json();
      setComments(data);
    } catch (error) {
      console.error(error);
      setFeedback("Impossible de charger les commentaires.");
    }
  };

  const handleCreate = async () => {
    if (!newComment.trim()) {
      setFeedback("Veuillez écrire un commentaire.");
      return;
    }
    try {
      setFormLoading(true);
      setFeedback(null);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/commentaires", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          produitId,
          contenu: newComment.trim(),
          note: newRating,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Impossible d'ajouter le commentaire");
      }

      setNewComment("");
      setNewRating(5);
      await Promise.all([fetchComments(), fetchProduct()]);
      setFeedback("Commentaire ajouté !");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (comment: Commentaire) => {
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
    if (!editingContent.trim()) {
      setFeedback("Le commentaire ne peut pas être vide.");
      return;
    }

    try {
      setFormLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/commentaires/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contenu: editingContent.trim(),
          note: editingRating,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Impossible de modifier le commentaire");
      }

      cancelEdit();
      await Promise.all([fetchComments(), fetchProduct()]);
      setFeedback("Commentaire mis à jour.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/commentaires/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Impossible de supprimer le commentaire");
      }
      await Promise.all([fetchComments(), fetchProduct()]);
      setFeedback("Commentaire supprimé.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  const canInteract = useMemo(() => userRole !== "admin", [userRole]);

  const nextImage = () => {
    if (!product?.images) return;
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    if (!product?.images) return;
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-black" />
      </div>
    );
  }

  const renderInteractiveStars = (value: number, onChange: (note: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          type="button"
          key={index}
          onClick={() => onChange(index)}
          className="focus:outline-none hover:scale-110 transition"
        >
          <Star
            size={24}
            className={index <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );

  const productImages = product.images && product.images.length > 0 ? product.images : ["/placeholder.jpg"];

  return (
    <div className="min-h-screen bg-pattern pb-16">
      <div className="container-main py-6 lg:py-8">
        <button
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
          onClick={() => router.push("/home")}
        >
          <ArrowLeft size={18} className="mr-2" />
          Retour à la boutique
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="p-6">
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 group">
                <img
                  src={productImages[selectedImageIndex]}
                  alt={`${product.nom} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Arrows - only show if multiple images */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronRight size={24} />
                    </button>

                    {/* Image counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                      {selectedImageIndex + 1} / {productImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition ${selectedImageIndex === index
                          ? "border-black"
                          : "border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-8 flex flex-col space-y-6">
              <div>
                <span className="text-sm uppercase tracking-wider text-gray-500 font-semibold">
                  {product.categorie?.nom || "Produit"}
                </span>
                <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-4">{product.nom}</h1>
                <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-gray-200">
                <div className="flex items-center gap-2">
                  <StarDisplay value={Math.round(product.score_moyen || 0)} />
                  <span className="text-sm text-gray-600 font-medium">
                    {product.score_moyen?.toFixed(1) || "0.0"} / 5
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {comments.length} avis
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">{product.prix.toFixed(2)} DT</span>
              </div>

              <button
                onClick={() => router.push("/home")}
                className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition text-lg"
              >
                Retour à la boutique
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <section className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare size={28} className="text-black" />
              Avis des clients
            </h2>
            <span className="text-sm text-gray-500 font-medium">{comments.length} commentaire(s)</span>
          </div>

          {feedback && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-5 py-3 rounded-xl">
              {feedback}
            </div>
          )}

          {canInteract && (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Laisser un avis</h3>
              {renderInteractiveStars(newRating, setNewRating)}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partagez votre expérience avec ce produit..."
                rows={4}
                className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-black transition"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={handleCreate}
                  className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                  {formLoading ? "Envoi..." : "Publier mon avis"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Aucun commentaire pour le moment.</p>
                <p className="text-gray-400 text-sm mt-2">Soyez le premier à partager votre avis !</p>
              </div>
            )}
            {comments.map((comment) => {
              const isOwner = comment.utilisateur?._id === userId;
              const canDelete = isOwner || userRole === "admin";
              return (
                <div key={comment._id} className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {comment.utilisateur?.username || "Utilisateur"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {editingId !== comment._id && <StarDisplay value={comment.note} />}
                  </div>

                  {editingId === comment._id ? (
                    <div className="space-y-4">
                      {renderInteractiveStars(editingRating, setEditingRating)}
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-black focus:outline-none"
                      />
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={submitEdit}
                          className="px-6 py-2.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition"
                          disabled={formLoading}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-700 leading-relaxed text-base">{comment.contenu}</p>
                      {(isOwner || canDelete) && (
                        <div className="flex gap-3 justify-end text-sm pt-2 border-t border-gray-100">
                          {isOwner && (
                            <button
                              onClick={() => startEdit(comment)}
                              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                            >
                              Modifier
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(comment._id)}
                              className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
