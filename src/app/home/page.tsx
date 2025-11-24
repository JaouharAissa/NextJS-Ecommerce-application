// app/home/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Star, Search, LogOut } from "lucide-react";

interface Product {
  _id: string;
  nom: string;
  description: string;
  image: string;
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
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    rue: "",
    ville: "",
    codePostal: "",
    pays: "Tunisie",
    telephone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"especes" | "carte" | "paypal">("especes");
  const [cardDetails, setCardDetails] = useState({ titulaire: "", numero: "", expiration: "" });
  const [paypalDetails, setPaypalDetails] = useState({ email: "", transactionId: "" });
  const [commentaire, setCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string; factureUrl?: string } | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token) {
      router.push("/login");
      return;
    }

    // Si c'est un admin, rediriger vers dashboard
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
      
      // Fetch categories
      const catRes = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const catData = await catRes.json();
      setCategories(catData);

      // Fetch products
      const prodRes = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      setProducts(prodData);
      
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
          image: product.image,
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

  const removeFavorite = (produitId: string) => {
    setFavoriteItems((prev) => prev.filter((item) => item._id !== produitId));
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
    setPaymentMethod("especes");
    setCardDetails({ titulaire: "", numero: "", expiration: "" });
    setPaypalDetails({ email: "", transactionId: "" });
    setCommentaire("");
    setHasAttemptedSubmit(false);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantite, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.prix * item.quantite, 0);
  const favoriteCount = favoriteItems.length;
  const isFavorite = (produitId: string) => favoriteItems.some((item) => item._id === produitId);

  const validateDeliveryInfo = () => {
    const requiredFields: Array<keyof typeof deliveryInfo> = ["rue", "ville", "codePostal", "pays", "telephone"];
    return requiredFields.every((field) => deliveryInfo[field].trim().length > 0);
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === "especes") {
      return true;
    }
    if (paymentMethod === "carte") {
      return (
        cardDetails.titulaire.trim().length > 0 &&
        cardDetails.numero.replace(/\s/g, "").length >= 12 &&
        cardDetails.expiration.trim().length >= 4
      );
    }
    if (paymentMethod === "paypal") {
      return (
        paypalDetails.email.trim().length > 0 &&
        paypalDetails.transactionId.trim().length > 0
      );
    }
    return false;
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

    if (!validatePaymentDetails()) {
      setFeedback({ type: "error", message: "Complétez les informations de paiement requises." });
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

      const paiementPayload =
        paymentMethod === "carte"
          ? {
              titulaire: cardDetails.titulaire,
              numeroCarte: cardDetails.numero,
              expiration: cardDetails.expiration,
            }
          : paymentMethod === "paypal"
          ? {
              paypalEmail: paypalDetails.email,
              transactionId: paypalDetails.transactionId,
            }
          : undefined;

      const response = await fetch("/api/commandes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            produit: item.produitId,
            quantite: item.quantite,
          })),
          adresseLivraison: deliveryInfo,
          methodePaiement: paymentMethod,
          commentaire,
          paiementDetails: paiementPayload,
        }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(responseBody.details || responseBody.error || "Échec de la commande");
      }

      resetCart();
      setIsCartOpen(false);
      setFeedback({
        type: "success",
        message: "Commande envoyée avec succès !",
        factureUrl: responseBody.factureUrl,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClasses = (hasError: boolean) =>
    `w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 ${
      hasError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
    }`;

  const deliveryFieldError = (value: string) => hasAttemptedSubmit && !value.trim();

  const cardFieldError = (field: keyof typeof cardDetails) => {
    if (paymentMethod !== "carte" || !hasAttemptedSubmit) return false;
    if (field === "numero") {
      return cardDetails.numero.replace(/\s/g, "").length < 12;
    }
    if (field === "expiration") {
      return cardDetails.expiration.trim().length < 4;
    }
    return !cardDetails[field].trim();
  };

  const paypalFieldError = (field: keyof typeof paypalDetails) =>
    paymentMethod === "paypal" && hasAttemptedSubmit && !paypalDetails[field].trim();

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.categorie._id === selectedCategory;
    const matchesSearch = product.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-2xl px-4 py-2 rounded-lg">
                ShopStyle
              </div>
              <button
                onClick={() => router.push("/mes-commandes")}
                className="text-sm font-semibold text-blue-600 underline md:hidden"
              >
                Mes commandes
              </button>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/mes-commandes")}
                className="hidden md:inline-flex items-center border border-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
              >
                Mes commandes
              </button>
              <button
                type="button"
                className="relative hover:text-red-500 transition"
                onClick={() => setIsFavoritesOpen(true)}
                aria-label="Ouvrir les favoris"
              >
                <Heart size={24} className={favoriteCount ? "fill-red-500 text-red-500" : "text-gray-700"} />
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {favoriteCount}
                </span>
              </button>
              <button
                type="button"
                className="relative hover:text-blue-600 transition"
                onClick={() => setIsCartOpen(true)}
                aria-label="Ouvrir le panier"
              >
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
              >
                <LogOut size={18} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-sm font-semibold text-gray-600 whitespace-nowrap mr-2">Catégories :</span>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-6 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tous les produits
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-6 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategory === cat._id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.nom}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedCategory === "all" 
              ? "Tous nos produits" 
              : categories.find(c => c._id === selectedCategory)?.nom}
          </h2>
          <p className="text-gray-600 mt-1">{filteredProducts.length} produits trouvés</p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/product/${product._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(`/product/${product._id}`);
                  }
                }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="relative h-64 bg-gray-200 overflow-hidden">
                  <img
                    src={product.image || "/placeholder-product.jpg"}
                    alt={product.nom}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    className={`absolute top-3 right-3 bg-white p-2 rounded-full shadow-md transition ${
                      isFavorite(product._id) ? "bg-red-50" : "hover:bg-gray-100"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product);
                    }}
                    aria-label="Ajouter aux favoris"
                  >
                    <Heart
                      size={20}
                      className={isFavorite(product._id) ? "text-red-500 fill-red-500" : "text-gray-600 hover:text-red-500"}
                    />
                  </button>
                  {product.score_moyen > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white px-2 py-1 rounded-full flex items-center space-x-1 shadow-md">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold">{product.score_moyen.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">
                    {product.nom}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      {product.prix.toFixed(2)} DT
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-2/3 lg:w-[28rem] bg-white z-50 shadow-2xl flex flex-col max-h-screen overflow-hidden">
            <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-semibold">Mon panier</h3>
                <p className="text-sm text-gray-500">{cartCount} article(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                Fermer
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {cartItems.length === 0 ? (
                  <p className="text-gray-500">Votre panier est vide.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.produitId} className="flex space-x-3 border rounded-lg p-3">
                      <img
                        src={item.image || "/placeholder-product.jpg"}
                        alt={item.nom}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.nom}</p>
                        <p className="text-sm text-gray-500">{item.prix.toFixed(2)} DT</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.produitId, -1)}
                            className="w-7 h-7 border rounded-full flex items-center justify-center text-lg"
                          >
                            -
                          </button>
                          <span>{item.quantite}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.produitId, 1)}
                            className="w-7 h-7 border rounded-full flex items-center justify-center text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.produitId)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t p-4 space-y-3">
              <h4 className="font-semibold">Informations de livraison</h4>
              <div className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-blue-900">Conditions de passation :</p>
                <p>• Tous les champs doivent être remplis pour valider la commande.</p>
                <p>• Paiement par carte : nom, numéro et expiration requis.</p>
                <p>• Paiement PayPal : email PayPal et ID de transaction requis.</p>
              </div>
              <input
                type="text"
                placeholder="Rue"
                value={deliveryInfo.rue}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, rue: e.target.value })}
                className={getInputClasses(deliveryFieldError(deliveryInfo.rue))}
              />
              <p className={`text-xs ${deliveryFieldError(deliveryInfo.rue) ? "text-red-600" : "text-gray-500"}`}>
                Indiquez la rue exacte pour éviter les retards.
              </p>
              <input
                type="text"
                placeholder="Ville"
                value={deliveryInfo.ville}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, ville: e.target.value })}
                className={getInputClasses(deliveryFieldError(deliveryInfo.ville))}
              />
              <p className={`text-xs ${deliveryFieldError(deliveryInfo.ville) ? "text-red-600" : "text-gray-500"}`}>
                Ville obligatoire pour planifier la livraison.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    placeholder="Code postal"
                    value={deliveryInfo.codePostal}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, codePostal: e.target.value })}
                    className={getInputClasses(deliveryFieldError(deliveryInfo.codePostal))}
                  />
                  <p className={`text-xs ${deliveryFieldError(deliveryInfo.codePostal) ? "text-red-600" : "text-gray-500"}`}>
                    Code postal requis.
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Téléphone"
                    value={deliveryInfo.telephone}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, telephone: e.target.value })}
                    className={getInputClasses(deliveryFieldError(deliveryInfo.telephone))}
                  />
                  <p className={`text-xs ${deliveryFieldError(deliveryInfo.telephone) ? "text-red-600" : "text-gray-500"}`}>
                    Numéro utilisé par le livreur en cas de besoin.
                  </p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Pays"
                value={deliveryInfo.pays}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, pays: e.target.value })}
                className={getInputClasses(deliveryFieldError(deliveryInfo.pays))}
              />
              <p className={`text-xs ${deliveryFieldError(deliveryInfo.pays) ? "text-red-600" : "text-gray-500"}`}>
                Choisissez le pays de livraison.
              </p>

              <div>
                <label className="text-sm font-medium text-gray-700">Méthode de paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "especes" | "carte" | "paypal")}
                  className={`mt-1 ${getInputClasses(false)}`}
                >
                  <option value="especes">Paiement à la livraison</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="paypal">PayPal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez le mode de paiement adapté. Les informations requises apparaissent automatiquement.
                </p>
              </div>

              {paymentMethod === "carte" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Titulaire de la carte"
                    value={cardDetails.titulaire}
                    onChange={(e) => setCardDetails((prev) => ({ ...prev, titulaire: e.target.value }))}
                    className={getInputClasses(cardFieldError("titulaire"))}
                  />
                  <p className={`text-xs ${cardFieldError("titulaire") ? "text-red-600" : "text-gray-500"}`}>
                    Nom inscrit sur la carte.
                  </p>
                  <input
                    type="text"
                    placeholder="Numéro de carte"
                    value={cardDetails.numero}
                    onChange={(e) => setCardDetails((prev) => ({ ...prev, numero: e.target.value }))}
                    className={getInputClasses(cardFieldError("numero"))}
                  />
                  <p className={`text-xs ${cardFieldError("numero") ? "text-red-600" : "text-gray-500"}`}>
                    12 chiffres minimum, sans espaces.
                  </p>
                  <input
                    type="text"
                    placeholder="Expiration (MM/AA)"
                    value={cardDetails.expiration}
                    onChange={(e) => setCardDetails((prev) => ({ ...prev, expiration: e.target.value }))}
                    className={getInputClasses(cardFieldError("expiration"))}
                  />
                  <p className={`text-xs ${cardFieldError("expiration") ? "text-red-600" : "text-gray-500"}`}>
                    Exemple : 04/27.
                  </p>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Email PayPal"
                    value={paypalDetails.email}
                    onChange={(e) => setPaypalDetails((prev) => ({ ...prev, email: e.target.value }))}
                    className={getInputClasses(paypalFieldError("email"))}
                  />
                  <p className={`text-xs ${paypalFieldError("email") ? "text-red-600" : "text-gray-500"}`}>
                    Utilisez l&apos;adresse PayPal qui a servi au paiement.
                  </p>
                  <input
                    type="text"
                    placeholder="ID de transaction PayPal"
                    value={paypalDetails.transactionId}
                    onChange={(e) => setPaypalDetails((prev) => ({ ...prev, transactionId: e.target.value }))}
                    className={getInputClasses(paypalFieldError("transactionId"))}
                  />
                  <p className={`text-xs ${paypalFieldError("transactionId") ? "text-red-600" : "text-gray-500"}`}>
                    Disponible dans le reçu PayPal.
                  </p>
                </div>
              )}

              <textarea
                placeholder="Commentaire (optionnel)"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />

              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{cartTotal.toFixed(2)} DT</span>
              </div>

              {feedback && (
                <p
                  className={`text-sm ${
                    feedback.type === "error" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {feedback.message}
                </p>
              )}
              {feedback?.factureUrl && (
                <a
                  href={feedback.factureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 underline"
                >
                  Télécharger ma facture
                </a>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || !cartItems.length}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isSubmitting ? "Envoi de la commande..." : "Passer la commande"}
              </button>
            </div>
          </div>
          </aside>
        </>
      )}

      {isFavoritesOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsFavoritesOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-2/3 lg:w-[24rem] bg-white z-50 shadow-2xl flex flex-col">
            <header className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Mes favoris</h3>
                <p className="text-sm text-gray-500">{favoriteCount} produit(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFavoritesOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                Fermer
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {favoriteItems.length === 0 ? (
                <p className="text-gray-500 text-sm">Vous n&apos;avez pas encore de favoris.</p>
              ) : (
                favoriteItems.map((item) => (
                  <div key={item._id} className="flex gap-3 border rounded-lg p-3">
                    <img
                      src={item.image || "/placeholder-product.jpg"}
                      alt={item.nom}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.nom}</p>
                      <p className="text-sm text-gray-500 mb-2">{item.prix.toFixed(2)} DT</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/product/${item._id}`);
                            setIsFavoritesOpen(false);
                          }}
                          className="text-blue-600 text-xs font-medium hover:underline"
                        >
                          Voir le produit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFavorite(item._id)}
                          className="text-red-500 text-xs font-medium hover:underline"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </>
      )}

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 ShopStyle. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}