"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag } from "lucide-react";

interface Product {
    _id: string;
    nom: string;
    prix: number;
    images: string[];
    categorie: { _id: string; nom: string };
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load favorites from localStorage
        const storedFavorites = localStorage.getItem("favorites");
        if (storedFavorites) {
            try {
                setFavorites(JSON.parse(storedFavorites));
            } catch (e) {
                console.error("Error parsing favorites", e);
            }
        }
        setLoading(false);
    }, []);

    const removeFavorite = (id: string) => {
        const updatedFavorites = favorites.filter((p) => p._id !== id);
        setFavorites(updatedFavorites);
        localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    };

    const navLinks = [
        { name: "Home", href: "/home" },
        { name: "Products", href: "/products" },
        { name: "Categories", href: "/categories" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">


            <main className="container-main py-12">
                <h1 className="text-3xl font-serif font-bold mb-8 text-black">My Favorites</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-medium text-gray-900 mb-4">Your favorites list is empty</h2>
                        <p className="text-gray-500 mb-8">Explore our collections to find what you love.</p>
                        <Link
                            href="/products"
                            className="inline-block bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                        >
                            Discover Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {favorites.map((product) => (
                            <div key={product._id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
                                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                    {product.images && product.images[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.nom}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeFavorite(product._id)}
                                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                        title="Remove from favorites"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="p-4">
                                    <div className="mb-2">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {product.categorie?.nom || "Collection"}
                                        </span>
                                    </div>
                                    <Link href={`/product/${product._id}`}>
                                        <h3 className="font-medium text-gray-900 mb-1 truncate hover:underline">
                                            {product.nom}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="font-semibold text-black">{product.prix} TND</span>
                                        <Link
                                            href={`/product/${product._id}`}
                                            className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                                        >
                                            <ShoppingBag size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
