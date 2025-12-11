"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, RefreshCcw, Search, Trash2, Star, ArrowRight } from "lucide-react";
import AdminNavbar from "@/app/components/AdminNavbar";

interface AdminComment {
  readonly _id: string;
  readonly contenu: string;
  readonly note: number;
  readonly sentiment?: string;
  readonly createdAt: string;
  readonly produit?: {
    readonly _id: string;
    readonly nom: string;
    readonly image?: string;
  };
  readonly utilisateur?: {
    readonly _id: string;
    readonly username: string;
    readonly email: string;
  };
}

export default function CommentairesAdminPage() {
  const router = useRouter();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    void fetchComments(token);
  }, [router]);

  const fetchComments = async (token?: string) => {
    try {
      setLoading(true);
      setError(null);
      const authToken = token ?? localStorage.getItem("token");
      if (!authToken) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      const res = await fetch("/api/commentaires", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Impossible de récupérer les commentaires.");
      }

      const data: AdminComment[] = await res.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      setDeletingId(commentId);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      const res = await fetch(`/api/commentaires/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Suppression impossible.");
      }

      setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredComments = useMemo(() => {
    if (!search.trim()) return comments;
    const term = search.toLowerCase();
    return comments.filter((comment) => {
      const userMatch = comment.utilisateur?.username?.toLowerCase().includes(term);
      const productMatch = comment.produit?.nom?.toLowerCase().includes(term);
      const contentMatch = comment.contenu.toLowerCase().includes(term);
      return userMatch || productMatch || contentMatch;
    });
  }, [comments, search]);

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <AdminNavbar />

      <div className="container-main pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">Commentaires</h1>
            <p className="text-gray-500 text-sm">Modération des avis clients</p>
          </div>
          <button
            onClick={() => void fetchComments()}
            className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-0 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border-b border-gray-200 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-gray-400"
            />
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black" />
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="py-16 text-center text-gray-400 border border-dashed border-gray-200">
              Aucun commentaire trouvé.
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment._id}
                className="group border border-gray-100 p-6 hover:border-black transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.utilisateur?.username || "Utilisateur"}</span>
                      <span className="text-xs text-gray-400">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < comment.note ? "fill-black text-black" : "text-gray-200"}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(comment._id)}
                      disabled={deletingId === comment._id}
                      className="text-xs uppercase tracking-wider text-red-500 hover:text-red-700"
                    >
                      {deletingId === comment._id ? "Suppression..." : "Supprimer"}
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-4">{comment.contenu}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Produit:</span>
                    <button
                      onClick={() => comment.produit && router.push(`/product/${comment.produit._id}`)}
                      className="text-xs font-medium hover:underline"
                      disabled={!comment.produit}
                    >
                      {comment.produit?.nom || "Produit supprimé"}
                    </button>
                  </div>
                  {comment.sentiment && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 uppercase tracking-wider">
                      {comment.sentiment}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


