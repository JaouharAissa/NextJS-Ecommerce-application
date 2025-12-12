"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Search, X, Plus, Minus, ChevronDown, Filter, Star, Sparkles } from "lucide-react";

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

    // Charger le panier depuis l'API
    const loadCart = async () => {
      try {
        const res = await fetch("/api/cart", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setCartItems(data.cart || []);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    };

    loadCart();
  }, [router]);

  // Sauvegarder le panier dans la base de données avec debounce
  useEffect(() => {
    const saveCart = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ cart: cartItems })
        });
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    };

    // Debounce pour éviter trop de requêtes
    const timeoutId = setTimeout(saveCart, 800);
    return () => clearTimeout(timeoutId);
  }, [cartItems]);

  useEffect(() => {
    // Charger les favoris depuis l'API
    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/favorites", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setFavoriteItems(data.favorites || []);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    };

    loadFavorites();
  }, []);

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

  const toggleFavorite = async (product: Product) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Mise à jour optimiste du state local
      setFavoriteItems((prev) => {
        const exists = prev.some((item) => item._id === product._id);
        if (exists) {
          return prev.filter((item) => item._id !== product._id);
        }
        return [...prev, product];
      });

      // Appeler l'API pour persister le changement
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id })
      });

      if (res.ok) {
        const data = await res.json();
        // Synchroniser avec les données du serveur
        setFavoriteItems(data.favorites || []);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleCheckout = async () => {
    setHasAttemptedSubmit(true);
    if (!cartItems.length) {
      setFeedback({ type: "error", message: "Add at least one product to cart." });
      return;
    }

    if (!validateDeliveryInfo()) {
      setFeedback({ type: "error", message: "Please fill all delivery information." });
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
        throw new Error(data.error || "Unable to start Stripe payment.");
      }

      window.location.href = data.url as string;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateDeliveryInfo = () => {
    const requiredFields: Array<keyof typeof deliveryInfo> = ["rue", "ville", "codePostal", "pays", "telephone"];
    return requiredFields.every((field) => deliveryInfo[field].trim().length > 0);
  };

  const deliveryFieldError = (value: string) => hasAttemptedSubmit && !value.trim();

  const cartCount = cartItems.reduce((total, item) => total + item.quantite, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.prix * item.quantite, 0);
  const isFavorite = (produitId: string) => favoriteItems.some((item) => item._id === produitId);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        links={navLinks}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero Section */}
      <section className="container-main py-12">
        <div className="glass-card-static p-8 md:p-12 text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-display text-gradient mb-4">
            DISCOVER THE LATEST
          </h1>
          <p className="text-[var(--foreground-muted)] text-lg max-w-2xl mx-auto">
            Premium streetwear collection curated for the modern lifestyle
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-20 z-40">
        <div className="container-main">
          <div className="glass-card-static p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-8 py-4 rounded-2xl text-lg font-semibold whitespace-nowrap transition-all ${selectedCategory === "all"
                  ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg"
                  : "glass-button hover:text-white"
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-8 py-4 rounded-2xl text-lg font-semibold whitespace-nowrap transition-all ${selectedCategory === cat._id
                    ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg"
                    : "glass-button hover:text-white"
                    }`}
                >
                  {cat.nom}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 px-8 py-4 glass-button rounded-2xl text-lg font-semibold">
                <Filter size={22} />
                Sort by
                <ChevronDown size={18} />
              </button>
              <div className="absolute right-0 mt-2 w-72 glass-card-static rounded-2xl py-3 hidden group-hover:block animate-fade-in z-50">
                {[
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                  { value: "rating", label: "Top Rated" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as any)}
                    className={`w-full text-left px-6 py-4 text-lg hover:bg-[var(--glass-bg)] transition-colors ${sortBy === option.value ? "text-[var(--primary)] font-bold" : "text-[var(--foreground-muted)]"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="container-main py-12">
        {filteredProducts.length === 0 ? (
          <div className="glass-card-static p-16 text-center">
            <Sparkles size={48} className="mx-auto text-[var(--foreground-muted)] mb-4" />
            <p className="text-[var(--foreground-muted)] text-lg">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
              const productImage = (product.images && product.images.length > 0)
                ? product.images[0]
                : product.image || null;

              return (
                <div
                  key={product._id}
                  className="product-card-modern cursor-pointer group stagger-children"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => router.push(`/product/${product._id}`)}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="btn-gradient w-full py-3 text-sm"
                      >
                        <Plus size={16} />
                        Add to Cart
                      </button>
                    </div>

                    {/* Favorite Button */}
                    <button
                      className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isFavorite(product._id)
                        ? "bg-[var(--pink)] text-white"
                        : "glass-button text-white hover:bg-[var(--pink)]"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product);
                      }}
                    >
                      <Heart size={18} className={isFavorite(product._id) ? "fill-white" : ""} />
                    </button>

                    {/* Rating Badge */}
                    {product.score_moyen > 0 && (
                      <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-1 glass-button rounded-lg text-xs">
                        <Star size={12} className="fill-[var(--warning)] text-[var(--warning)]" />
                        <span className="font-medium">{product.score_moyen.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-heading font-semibold text-white group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                        {product.nom}
                      </h3>
                      <span className="text-lg font-bold text-gradient whitespace-nowrap">
                        {product.prix.toFixed(2)} DT
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-[var(--background)]/95 backdrop-blur-xl z-50 flex flex-col animate-slide-in border-l border-[var(--glass-border)]">
            <header className="p-6 flex items-center justify-between border-b border-[var(--glass-border)]">
              <h2 className="text-2xl font-heading font-bold text-white">
                Cart <span className="text-[var(--primary)]">({cartCount})</span>
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-[var(--glass-bg)] rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--foreground-muted)]">
                  <ShoppingCart size={64} className="mb-4 opacity-30" />
                  <p className="text-lg">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.produitId} className="glass-card-static p-4 flex gap-4">
                      <div className="w-20 h-24 bg-[var(--background-secondary)] rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <img src={item.image} alt={item.nom} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white">{item.nom}</h4>
                            <button
                              onClick={() => removeFromCart(item.produitId)}
                              className="text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-[var(--primary)]">{item.prix.toFixed(2)} DT</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.produitId, -1)}
                            className="p-2 glass-button rounded-lg hover:bg-[var(--glass-bg-hover)]"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantite}</span>
                          <button
                            onClick={() => updateQuantity(item.produitId, 1)}
                            className="p-2 glass-button rounded-lg hover:bg-[var(--glass-bg-hover)]"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="mt-8 space-y-6">
                  <h3 className="font-heading font-bold text-lg text-white border-b border-[var(--glass-border)] pb-3">
                    Delivery Details
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Address"
                      value={deliveryInfo.rue}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, rue: e.target.value })}
                      className={`glass-input w-full ${deliveryFieldError(deliveryInfo.rue) ? "border-[var(--error)]" : ""}`}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        value={deliveryInfo.ville}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, ville: e.target.value })}
                        className={`glass-input w-full ${deliveryFieldError(deliveryInfo.ville) ? "border-[var(--error)]" : ""}`}
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={deliveryInfo.codePostal}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, codePostal: e.target.value })}
                        className={`glass-input w-full ${deliveryFieldError(deliveryInfo.codePostal) ? "border-[var(--error)]" : ""}`}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Phone"
                      value={deliveryInfo.telephone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, telephone: e.target.value })}
                      className={`glass-input w-full ${deliveryFieldError(deliveryInfo.telephone) ? "border-[var(--error)]" : ""}`}
                    />
                    <textarea
                      placeholder="Delivery Note (optional)"
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      className="glass-input w-full resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-[var(--glass-border)] bg-[var(--background-secondary)]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[var(--foreground-muted)]">Total</span>
                  <span className="text-2xl font-bold text-gradient">{cartTotal.toFixed(2)} DT</span>
                </div>

                {feedback && (
                  <div className={`p-3 rounded-lg mb-4 text-sm ${feedback.type === "error"
                    ? "bg-[var(--error)]/20 text-[var(--error)] border border-[var(--error)]/30"
                    : "bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30"
                    }`}>
                    {feedback.message}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="btn-gradient w-full py-4 text-base disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    "Checkout"
                  )}
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
