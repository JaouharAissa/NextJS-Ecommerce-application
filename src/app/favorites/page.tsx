"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ShoppingBag, Heart, Sparkles, ArrowLeft } from "lucide-react";
import Navbar from "@/app/components/Navbar";

interface Product {
    _id: string;
    nom: string;
    prix: number;
    images: string[];
    image?: string;
    categorie: { _id: string; nom: string };
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        // Charger les favoris depuis l'API
        const loadFavorites = async () => {
            try {
                const res = await fetch("/api/favorites", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setFavorites(data.favorites || []);
                }
            } catch (error) {
                console.error("Error loading favorites:", error);
            }
            setLoading(false);
        };

        loadFavorites();
    }, [router]);

    const removeFavorite = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            // Mise à jour optimiste
            setFavorites(favorites.filter((p) => p._id !== id));

            // Appeler l'API pour retirer le favori
            const res = await fetch("/api/favorites", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ productId: id })
            });

            if (res.ok) {
                const data = await res.json();
                setFavorites(data.favorites || []);
            }
        } catch (error) {
            console.error("Error removing favorite:", error);
        }
    };

    const navLinks = [
        { name: "Home", href: "/home" },
    ];

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
            <Navbar links={navLinks} />

            <main className="container-main py-12">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-3 text-base uppercase tracking-wider text-[var(--foreground-muted)] hover:text-white transition-colors mb-8 glass-button px-6 py-3 rounded-2xl font-semibold"
                >
                    <ArrowLeft size={22} />
                    Back
                </button>

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="text-[var(--pink)]" size={28} />
                        <h1 className="text-3xl font-heading font-bold text-white">My Favorites</h1>
                    </div>
                    <p className="text-[var(--foreground-muted)]">
                        {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
                    </p>
                </div>

                {favorites.length === 0 ? (
                    <div className="glass-card-static p-16 text-center rounded-2xl">
                        <Heart className="mx-auto text-[var(--foreground-muted)] mb-4" size={64} />
                        <h2 className="text-xl font-heading font-bold text-white mb-2">
                            Your favorites list is empty
                        </h2>
                        <p className="text-[var(--foreground-muted)] mb-8">
                            Explore our collections to find what you love.
                        </p>
                        <Link href="/home" className="btn-gradient">
                            <Sparkles size={18} />
                            Discover Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map((product, index) => {
                            const productImage = product.images?.[0] || product.image || null;

                            return (
                                <div
                                    key={product._id}
                                    className="product-card-modern group"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {/* Image Container */}
                                    <div className="product-image-container-modern">
                                        {productImage ? (
                                            <img
                                                src={productImage}
                                                alt={product.nom}
                                                className="product-image-modern"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
                                                No Image
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        <div className="product-overlay">
                                            <Link
                                                href={`/product/${product._id}`}
                                                className="btn-gradient w-full py-3 text-sm text-center"
                                            >
                                                <ShoppingBag size={16} />
                                                View Product
                                            </Link>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFavorite(product._id)}
                                            className="absolute top-4 right-4 p-2 glass-button rounded-xl text-[var(--error)] hover:bg-[var(--error)]/20 transition-all"
                                            title="Remove from favorites"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4 px-3 py-1 glass-button rounded-lg text-xs uppercase tracking-wider">
                                            {product.categorie?.nom || "Collection"}
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-5">
                                        <Link href={`/product/${product._id}`}>
                                            <h3 className="font-heading font-semibold text-white group-hover:text-[var(--primary)] transition-colors line-clamp-1 mb-2">
                                                {product.nom}
                                            </h3>
                                        </Link>
                                        <span className="text-lg font-bold text-gradient">
                                            {product.prix.toFixed(2)} DT
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
