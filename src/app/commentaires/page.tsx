"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, RefreshCcw, Search, Trash2 } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-4 pb-12 pt-28 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-fuchsia-100 text-fuchsia-600">
              <MessageSquare size={24} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Modération</p>
              <h1 className="text-3xl font-semibold text-slate-900">Commentaires utilisateurs</h1>
              <p className="text-slate-500 text-sm">
                Analysez les retours clients et suppressions en un clic.
              </p>
            </div>
          </div>
          <button
            onClick={() => void fetchComments()}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm hover:border-fuchsia-300 transition"
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par produit, utilisateur ou contenu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600" />
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                Aucun commentaire à afficher.
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div
                  key={comment._id}
                  className="border border-gray-100 rounded-xl p-4 sm:p-5 hover:border-blue-100 transition bg-gray-50/50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{comment.utilisateur?.username || "Utilisateur"}</p>
                      <p className="text-sm text-gray-500">{comment.utilisateur?.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                        {comment.note} / 5
                      </span>
                      {comment.sentiment && (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                          {comment.sentiment}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-gray-700 leading-relaxed">{comment.contenu}</p>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Produit :</span>
                      <button
                        onClick={() => comment.produit && router.push(`/product/${comment.produit._id}`)}
                        className="text-blue-600 hover:underline"
                        disabled={!comment.produit}
                      >
                        {comment.produit?.nom || "Produit supprimé"}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{new Date(comment.createdAt).toLocaleString("fr-FR")}</span>
                      <button
                        onClick={() => handleDelete(comment._id)}
                        disabled={deletingId === comment._id}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                      >
                        <Trash2 size={16} />
                        {deletingId === comment._id ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


