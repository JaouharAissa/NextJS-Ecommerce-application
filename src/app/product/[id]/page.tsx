"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Star } from "lucide-react";

interface ProduitDetail {
  _id: string;
  nom: string;
  description: string;
  image: string;
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
      const data: ProduitDetail = await res.json();
      setProduct(data);
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

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600" />
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
          className="focus:outline-none"
        >
          <Star
            size={24}
            className={index <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          onClick={() => router.push("/home")}
        >
          <ArrowLeft size={18} className="mr-2" />
          Retour à la boutique
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-80 md:h-full">
              <img
                src={product.image || "/placeholder-product.jpg"}
                alt={product.nom}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col space-y-4">
              <span className="text-sm uppercase text-blue-500 font-semibold">
                {product.categorie?.nom || "Produit"}
              </span>
              <h1 className="text-3xl font-bold text-gray-900">{product.nom}</h1>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-semibold text-blue-600">{product.prix.toFixed(2)} DT</span>
                <div className="flex items-center space-x-2">
                  <StarDisplay value={Math.round(product.score_moyen || 0)} />
                  <span className="text-sm text-gray-500">
                    ({product.score_moyen?.toFixed(1) || "0.0"} / 5)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <MessageSquare size={22} className="mr-2 text-blue-600" />
              Avis des clients
            </h2>
            <span className="text-sm text-gray-500">{comments.length} commentaire(s)</span>
          </div>

          {feedback && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded">
              {feedback}
            </div>
          )}

          {canInteract && (
            <div className="bg-white rounded-xl shadow p-5 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Laisser un avis</h3>
              {renderInteractiveStars(newRating, setNewRating)}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                rows={4}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {formLoading ? "Envoi..." : "Publier"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Aucun commentaire pour le moment. Soyez le premier !
              </div>
            )}
            {comments.map((comment) => {
              const isOwner = comment.utilisateur?._id === userId;
              const canDelete = isOwner || userRole === "admin";
              return (
                <div key={comment._id} className="bg-white rounded-lg shadow p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {comment.utilisateur?.username || "Utilisateur"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    {editingId !== comment._id && <StarDisplay value={comment.note} />}
                  </div>

                  {editingId === comment._id ? (
                    <div className="space-y-3">
                      {renderInteractiveStars(editingRating, setEditingRating)}
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={submitEdit}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          disabled={formLoading}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-700 leading-relaxed">{comment.contenu}</p>
                      {(isOwner || canDelete) && (
                        <div className="flex gap-2 justify-end text-sm">
                          {isOwner && (
                            <button
                              onClick={() => startEdit(comment)}
                              className="px-3 py-1 rounded border border-blue-100 text-blue-600 hover:bg-blue-50"
                            >
                              Modifier
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(comment._id)}
                              className="px-3 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50"
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

