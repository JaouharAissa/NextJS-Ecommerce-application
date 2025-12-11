"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Search, X, Plus, Minus, ChevronDown, Filter } from "lucide-react";

interface Product {
  _id: string;
  nom: string;
  description: string;
  image?: string;
  images?: string[];
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

interface CartItem {
  produitId: string;
  nom: string;
  image: string;
  prix: number;
  quantite: number;
}

import Navbar from "@/app/components/Navbar";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "rating">("price-asc");
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState({
    rue: "",
    ville: "",
    codePostal: "",
    pays: "Tunisie",
    telephone: "",
  });
  const [commentaire, setCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string; factureUrl?: string } | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const router = useRouter();

  const navLinks = [
    { name: "Home", href: "/home" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role === "admin") {
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [router]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem("favorites");
      if (storedFavorites) {
        setFavoriteItems(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favoriteItems));
  }, [favoriteItems]);

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
      setProducts(Array.isArray(prodData) ? prodData : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.produitId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.produitId === product._id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [
        ...prev,
        {
          produitId: product._id,
          nom: product.nom,
          image: product.image || product.images?.[0] || "",
          prix: product.prix,
          quantite: 1,
        },
      ];
    });
    setFeedback(null);
    setIsCartOpen(true);
  };

  const updateQuantity = (produitId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.produitId === produitId
            ? { ...item, quantite: Math.max(1, item.quantite + delta) }
            : item
        )
        .filter((item) => item.quantite > 0)
    );
  };

  const removeFromCart = (produitId: string) => {
    setCartItems((prev) => prev.filter((item) => item.produitId !== produitId));
  };

  const toggleFavorite = (product: Product) => {
    setFavoriteItems((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      if (exists) {
        return prev.filter((item) => item._id !== product._id);
      }
      return [...prev, product];
    });
  };

  const handleCheckout = async () => {
    setHasAttemptedSubmit(true);
    if (!cartItems.length) {
      setFeedback({ type: "error", message: "Ajoutez au moins un produit au panier." });
      return;
    }

    if (!validateDeliveryInfo()) {
      setFeedback({ type: "error", message: "Merci de remplir toutes les informations de livraison." });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            produitId: item.produitId,
            quantite: item.quantite,
          })),
          adresseLivraison: deliveryInfo,
          commentaire,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Impossible de démarrer le paiement Stripe.");
      }

      window.location.href = data.url as string;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateDeliveryInfo = () => {
    const requiredFields: Array<keyof typeof deliveryInfo> = ["rue", "ville", "codePostal", "pays", "telephone"];
    return requiredFields.every((field) => deliveryInfo[field].trim().length > 0);
  };

  const getInputClasses = (hasError: boolean) =>
    `w-full border-b p-4 text-base bg-transparent placeholder:text-gray-400 focus:outline-none focus:border-black transition ${hasError ? "border-red-500" : "border-gray-200"}`;

  const deliveryFieldError = (value: string) => hasAttemptedSubmit && !value.trim();

  const cartCount = cartItems.reduce((total, item) => total + item.quantite, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.prix * item.quantite, 0);
  const favoriteCount = favoriteItems.length;
  const isFavorite = (produitId: string) => favoriteItems.some((item) => item._id === produitId);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === "all" || product.categorie._id === selectedCategory;
      const matchesSearch =
        product.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.prix - b.prix;
        case "price-desc":
          return b.prix - a.prix;
        case "rating":
          return b.score_moyen - a.score_moyen;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar
        links={navLinks}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />
      {/* Header / Filter Bar */}
      <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="container-main py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-base font-medium whitespace-nowrap px-8 py-4 rounded-full transition-colors ${selectedCategory === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`text-base font-medium whitespace-nowrap px-8 py-4 rounded-full transition-colors ${selectedCategory === cat._id ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Sort Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-full text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <Filter size={18} />
                Sort by
                <ChevronDown size={16} />
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden group-hover:block animate-fade-in z-50">
                <button
                  onClick={() => setSortBy("price-asc")}
                  className={`w-full text-left px-6 py-3 text-base hover:bg-gray-50 ${sortBy === "price-asc" ? "font-bold text-black" : "text-gray-600"}`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => setSortBy("price-desc")}
                  className={`w-full text-left px-6 py-3 text-base hover:bg-gray-50 ${sortBy === "price-desc" ? "font-bold text-black" : "text-gray-600"}`}
                >
                  Price: High to Low
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  className={`w-full text-left px-6 py-3 text-base hover:bg-gray-50 ${sortBy === "rating" ? "font-bold text-black" : "text-gray-600"}`}
                >
                  Top Rated
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="container-main py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-gray-400 text-lg">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => {
              const productImage = (product.images && product.images.length > 0)
                ? product.images[0]
                : product.image || null;

              return (
                <div
                  key={product._id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/product/${product._id}`)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-4">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={product.nom}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        No Image
                      </div>
                    )}

                    {/* Quick Add Button (Desktop) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="absolute bottom-4 right-4 bg-white text-black p-3 shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white"
                    >
                      <Plus size={20} />
                    </button>

                    {/* Favorite Button */}
                    <button
                      type="button"
                      className="absolute top-4 right-4 text-white drop-shadow-md hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product);
                      }}
                    >
                      <Heart
                        size={24}
                        className={isFavorite(product._id) ? "fill-white" : ""}
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:underline underline-offset-4 decoration-gray-400">
                        {product.nom}
                      </h3>
                      <span className="text-sm font-semibold">{product.prix.toFixed(2)} DT</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Minimalist Cart Sidebar */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[600px] bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
            <header className="p-8 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-2xl font-serif font-bold">Cart ({cartCount})</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart size={64} className="mb-4 opacity-20" />
                  <p className="text-lg">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {cartItems.map((item) => (
                    <div key={item.produitId} className="flex gap-6">
                      <div className="w-24 h-32 bg-gray-100 flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <img src={item.image} alt={item.nom} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-lg">{item.nom}</h4>
                            <button onClick={() => removeFromCart(item.produitId)} className="text-gray-400 hover:text-black">
                              <X size={20} />
                            </button>
                          </div>
                          <p className="text-base text-gray-500 mt-1">{item.prix.toFixed(2)} DT</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-200">
                            <button onClick={() => updateQuantity(item.produitId, -1)} className="p-2 hover:bg-gray-50"><Minus size={16} /></button>
                            <span className="w-10 text-center text-sm font-medium">{item.quantite}</span>
                            <button onClick={() => updateQuantity(item.produitId, 1)} className="p-2 hover:bg-gray-50"><Plus size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="mt-12 space-y-8">
                  <h3 className="font-serif font-bold text-xl border-b border-gray-100 pb-4">Delivery Details</h3>
                  <div className="space-y-6">
                    <input
                      type="text"
                      placeholder="Address"
                      value={deliveryInfo.rue}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, rue: e.target.value })}
                      className={getInputClasses(deliveryFieldError(deliveryInfo.rue))}
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <input
                        type="text"
                        placeholder="City"
                        value={deliveryInfo.ville}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, ville: e.target.value })}
                        className={getInputClasses(deliveryFieldError(deliveryInfo.ville))}
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={deliveryInfo.codePostal}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, codePostal: e.target.value })}
                        className={getInputClasses(deliveryFieldError(deliveryInfo.codePostal))}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Phone"
                      value={deliveryInfo.telephone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, telephone: e.target.value })}
                      className={getInputClasses(deliveryFieldError(deliveryInfo.telephone))}
                    />
                    <textarea
                      placeholder="Delivery Note (optional)"
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      className="w-full border-b p-4 text-base bg-transparent placeholder:text-gray-400 focus:outline-none focus:border-black transition border-gray-200 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-8 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium text-gray-600">Total</span>
                  <span className="text-2xl font-bold">{cartTotal.toFixed(2)} DT</span>
                </div>

                {feedback && (
                  <p className={`text-sm mb-6 p-3 ${feedback.type === "error" ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>
                    {feedback.message}
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-5 text-base font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Checkout"}
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
