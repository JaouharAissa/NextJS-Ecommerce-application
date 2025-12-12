"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, RefreshCcw, Search, Star } from "lucide-react";
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
        throw new Error("Session expired. Please log in again.");
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
        throw new Error(data.error || "Unable to fetch comments.");
      }

      const data: AdminComment[] = await res.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      setDeletingId(commentId);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Session expired. Please log in again.");
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
        throw new Error(data.error || "Unable to delete.");
      }

      setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setDeletingId(null);
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positif":
      case "positive":
        return "badge-success";
      case "negatif":
      case "negative":
        return "badge-error";
      default:
        return "badge-warning";
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
    <div className="min-h-screen">
      <AdminNavbar />

      <div className="container-main pt-8 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Reviews</h1>
            <p className="text-[var(--foreground-muted)]">Moderate customer reviews</p>
          </div>
          <button
            onClick={() => void fetchComments()}
            className="btn-ghost"
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mb-6">
          <div className="max-w-md">
            <div className="glass-input flex items-center gap-3">
              <Search className="text-[var(--foreground-muted)] flex-shrink-0" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[var(--foreground-muted)]"
              />
            </div>
          </div>
          {error && <p className="text-sm text-[var(--error)] mt-2">{error}</p>}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="glass-card-static py-16 text-center rounded-2xl">
              <MessageSquare className="mx-auto text-[var(--foreground-muted)] mb-4" size={48} />
              <p className="text-[var(--foreground-muted)]">No comments found.</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment._id}
                className="glass-card p-6 rounded-2xl group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">{comment.utilisateur?.username || "User"}</span>
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
                  <div className="flex items-center gap-3">
                    {comment.sentiment && (
                      <span className={`badge ${getSentimentBadge(comment.sentiment)}`}>
                        {comment.sentiment}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(comment._id)}
                      disabled={deletingId === comment._id}
                      className="text-xs uppercase tracking-wider text-[var(--error)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deletingId === comment._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                <p className="text-[var(--foreground-muted)] mb-4">{comment.contenu}</p>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">Product:</span>
                    <button
                      onClick={() => comment.produit && router.push(`/product/${comment.produit._id}`)}
                      className="text-sm font-medium text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
                      disabled={!comment.produit}
                    >
                      {comment.produit?.nom || "Deleted product"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
