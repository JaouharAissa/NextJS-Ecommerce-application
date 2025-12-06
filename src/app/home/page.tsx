// app/home/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Star, Search, LogOut, X, Plus, Minus, Filter, Package, Sparkles } from "lucide-react";

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

  const resetCart = () => {
    setCartItems([]);
    setDeliveryInfo({
      rue: "",
      ville: "",
      codePostal: "",
      pays: "Tunisie",
      telephone: "",
    });
    setCommentaire("");
    setHasAttemptedSubmit(false);
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
    `w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 transition ${hasError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
    }`;

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
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <section className="relative">
        <div className="container-main pt-10 pb-8 lg:pt-14 lg:pb-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="pill text-xs font-semibold tracking-wide uppercase">ShopStyle</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-white/80 text-sm">
                  <Sparkles size={16} />
                  Nouveautés sélectionnées
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/mes-commandes")}
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/10 text-white/90 hover:text-white hover:-translate-y-0.5 transition"
                >
                  Mes commandes
                </button>
                <button
                  type="button"
                  className="relative inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 border border-white/15 text-white hover:shadow-lg hover:-translate-y-0.5 transition"
                  onClick={() => setFavoriteItems(favoriteItems.length > 0 ? [] : favoriteItems)}
                >
                  <Heart size={20} className={favoriteCount ? "fill-rose-400 text-rose-400" : ""} />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {favoriteCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="relative inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 border border-white/15 text-white hover:shadow-lg hover:-translate-y-0.5 transition"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-700 font-semibold shadow-lg hover:-translate-y-0.5 transition"
                >
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.35em] text-white/60 font-semibold">Votre dressing digital</p>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  Explorez des pièces modernes, sélectionnées pour une expérience fluide.
                </h1>
                <p className="text-lg text-white/70 max-w-2xl">
                  Parcourez les catégories, créez vos favoris et préparez votre panier dans une interface harmonisée.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="glass-button px-4 py-3 rounded-2xl text-left">
                    <p className="text-sm text-white/60">Produits</p>
                    <p className="text-2xl font-bold text-white">{products.length}</p>
                  </div>
                  <div className="glass-button px-4 py-3 rounded-2xl text-left">
                    <p className="text-sm text-white/60">Catégories</p>
                    <p className="text-2xl font-bold text-white">{categories.length}</p>
                  </div>
                  <div className="glass-button px-4 py-3 rounded-2xl text-left">
                    <p className="text-sm text-white/60">Favoris</p>
                    <p className="text-2xl font-bold text-white">{favoriteCount}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Search size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Recherche éclair</p>
                    <p className="text-xl font-bold text-gray-900">Trouvez la pièce parfaite</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, catégorie ou description..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="badge-soft">{categories.length} catégories curatées</span>
                  <span className="badge-soft">
                    <Package size={16} />
                    {products.length} références
                  </span>
                  <span className="badge-soft">
                    <Sparkles size={16} />
                    Expérience harmonisée
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat._id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                    >
                      {cat.nom}
                    </button>
                  ))}
                  {categories.length > 4 && (
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                      +{categories.length - 4} autres
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-main -mt-4 lg:-mt-6">
        <div className="section-shell backdrop-blur px-4 py-4 lg:px-6 lg:py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
              <Filter size={18} className="text-white/70 flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all font-semibold text-sm ${selectedCategory === "all"
                  ? "bg-white text-blue-700 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
                  }`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all font-semibold text-sm ${selectedCategory === cat._id
                    ? "bg-white text-blue-700 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                >
                  {cat.nom}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold cursor-pointer shadow-sm"
            >
              <option value="default">Trier par</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="rating">Mieux notés</option>
            </select>
          </div>
        </div>
      </section>
      {/* Products Grid */}
      <main className="container-main py-8 lg:py-12">
        <div className="mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {selectedCategory === "all"
              ? "Tous nos produits"
              : categories.find((c) => c._id === selectedCategory)?.nom}
          </h2>
          <p className="text-gray-600 text-lg">{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}</p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 lg:py-32">
            <div className="glass-card p-12 lg:p-16 max-w-md mx-auto rounded-2xl">
              <Package size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 text-xl lg:text-2xl font-semibold mb-2">Aucun produit trouvé</p>
              <p className="text-gray-500 text-sm">Essayez de modifier vos critères de recherche</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 animate-fade-in">
            {filteredProducts.map((product, index) => {
              // Utiliser images[0] ou image (selon le modèle MongoDB)
              const productImage = (product.images && product.images.length > 0) 
                ? product.images[0] 
                : product.image || null;
              
              // Placeholder SVG si pas d'image
              const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`
                <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                  <rect width="400" height="300" fill="#f3f4f6"/>
                  <text x="50%" y="50%" font-family="Arial" font-size="18" fill="#9ca3af" text-anchor="middle" dy=".3em">
                    ${product.nom}
                  </text>
                </svg>
              `)}`;

              return (
                <div
                  key={product._id}
                  className="glass-card overflow-hidden hover-lift cursor-pointer group rounded-2xl"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Product Image */}
                  <div
                    className="relative h-80 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 overflow-hidden"
                    onClick={() => router.push(`/product/${product._id}`)}
                  >
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={product.nom}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = placeholderSvg;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                        <div className="text-center p-6">
                          <Package size={48} className="mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500 font-medium text-sm">{product.nom}</p>
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Favorite Button */}
                    <button
                      type="button"
                      className={`absolute top-4 right-4 p-2.5 glass-button rounded-full transition-all hover:scale-125 ${isFavorite(product._id) ? "bg-white/40" : ""
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product);
                      }}
                    >
                      <Heart
                        size={20}
                        className={isFavorite(product._id) ? "text-red-500 fill-red-500" : "text-gray-700"}
                      />
                    </button>

                    {/* Rating Badge */}
                    {product.score_moyen > 0 && (
                      <div className="absolute bottom-4 left-4 glass-button px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-900">{product.score_moyen.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6 space-y-4">
                    <div onClick={() => router.push(`/product/${product._id}`)} className="space-y-2">
                      <h3 className="font-bold text-gray-900 text-xl line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.nom}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {product.prix.toFixed(2)} DT
                        </span>
                        {product.score_moyen > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-gray-600">{product.score_moyen.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="btn-primary text-sm px-6 py-3 flex items-center gap-2 rounded-xl font-semibold hover:scale-105 transition-transform"
                      >
                        <ShoppingCart size={18} />
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Glassmorphism Cart Sidebar */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 animate-fade-in"
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-2/3 lg:w-[36rem] glass-card z-50 shadow-2xl flex flex-col animate-slide-in border-l border-white/20">
            <header className="p-8 border-b border-white/20 glass">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Mon panier</h3>
                  <p className="text-sm text-gray-600 mt-1">{cartCount} article(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="glass-button p-3 rounded-xl hover:scale-110 transition-all"
                >
                  <X size={24} className="text-gray-700" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
              {cartItems.length === 0 ? (
                <div className="text-center py-20">
                  <div className="glass-button p-8 rounded-2xl inline-block">
                    <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">Votre panier est vide</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {                  cartItems.map((item) => (
                    <div key={item.produitId} className="glass-card p-5 flex gap-4 hover-lift rounded-xl">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.nom}
                          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package size={32} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-1">{item.nom}</p>
                        <p className="text-sm text-blue-600 font-semibold">{item.prix.toFixed(2)} DT</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.produitId, -1)}
                            className="w-9 h-9 glass-button rounded-xl flex items-center justify-center hover:scale-110 transition-all"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-gray-900 min-w-[2rem] text-center">{item.quantite}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.produitId, 1)}
                            className="w-9 h-9 glass-button rounded-xl flex items-center justify-center hover:scale-110 transition-all"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.produitId)}
                        className="text-red-500 hover:text-red-700 hover:scale-110 transition-all"
                      >
                        <X size={22} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-4">Informations de livraison</h4>
                  <input
                    type="text"
                    placeholder="Numéro et nom de la rue"
                    value={deliveryInfo.rue}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, rue: e.target.value })}
                    className={getInputClasses(deliveryFieldError(deliveryInfo.rue))}
                  />
                  <input
                    type="text"
                    placeholder="Nom de votre ville"
                    value={deliveryInfo.ville}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, ville: e.target.value })}
                    className={getInputClasses(deliveryFieldError(deliveryInfo.ville))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Ex: 1000, 2000..."
                      value={deliveryInfo.codePostal}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, codePostal: e.target.value })}
                      className={getInputClasses(deliveryFieldError(deliveryInfo.codePostal))}
                    />
                    <input
                      type="text"
                      placeholder="Ex: +216 XX XXX XXX"
                      value={deliveryInfo.telephone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, telephone: e.target.value })}
                      className={getInputClasses(deliveryFieldError(deliveryInfo.telephone))}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Sélectionnez votre pays"
                    value={deliveryInfo.pays}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, pays: e.target.value })}
                    className={getInputClasses(deliveryFieldError(deliveryInfo.pays))}
                  />
                  <textarea
                    placeholder="Instructions spéciales pour la livraison (optionnel)"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    className="w-full glass-card border-0 p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-8 border-t border-white/20 glass space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {cartTotal.toFixed(2)} DT
                  </span>
                </div>

                {feedback && (
                  <p
                    className={`text-sm p-4 rounded-xl font-medium ${feedback.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                  >
                    {feedback.message}
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      Procéder au paiement
                    </>
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