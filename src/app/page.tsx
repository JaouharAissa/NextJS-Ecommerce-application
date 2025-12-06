import { ArrowRight, ShieldCheck, Sparkles, Star, Truck, ShoppingBag } from "lucide-react";

const highlights = [
  {
    title: "Sélection pointue",
    description: "Une collection moderne pensée pour les looks quotidiens et les moments forts.",
    icon: <Sparkles className="text-blue-600" size={20} />, 
  },
  {
    title: "Expérience fluide",
    description: "Interface épurée, navigation rapide et paiement sécurisé en quelques clics.",
    icon: <ArrowRight className="text-indigo-600" size={20} />, 
  },
  {
    title: "Livraison soignée",
    description: "Suivi en temps réel et emballage premium pour protéger vos favoris.",
    icon: <Truck className="text-teal-600" size={20} />, 
  },
];

const perks = [
  {
    title: "Qualité garantie",
    description: "Des pièces vérifiées avec des matériaux durables et responsables.",
    icon: ShieldCheck,
  },
  {
    title: "Service dédié",
    description: "Une équipe à l'écoute pour suivre vos commandes et vos retours.",
    icon: Star,
  },
  {
    title: "Paiement sécurisé",
    description: "Chiffrement de bout en bout et partenaires de confiance.",
    icon: ShoppingBag,
  },
];

export default function Home() {
  return (
    <div className="page-shell bg-pattern">
      <main className="container-main py-16 lg:py-24 space-y-16">
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 relative">
            <span className="pill text-blue-700 bg-white/70 border-blue-100 inline-flex">
              <Sparkles size={18} />
              Bienvenue sur ShopStyle
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Une expérience e-commerce épurée pour des achats inspirants
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Explorez la boutique, suivez vos commandes et découvrez des pièces qui reflètent votre style. Le tout dans une interface unifiée et moderne.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/home"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 shadow-lg"
              >
                Accéder à la boutique
                <ArrowRight size={18} />
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold shadow-sm hover:-translate-y-[1px] transition"
              >
                Se connecter
              </a>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-xl">
              <div className="section-card bg-white">
                <p className="text-3xl font-extrabold text-slate-900">+2k</p>
                <p className="text-sm text-slate-500">Produits inspirants</p>
              </div>
              <div className="section-card bg-white">
                <p className="text-3xl font-extrabold text-slate-900">24/7</p>
                <p className="text-sm text-slate-500">Paiement sécurisé</p>
              </div>
              <div className="section-card bg-white">
                <p className="text-3xl font-extrabold text-slate-900">4.8/5</p>
                <p className="text-sm text-slate-500">Avis clients</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 via-indigo-50 to-white rounded-[2rem] blur-3xl" aria-hidden />
            <div className="relative section-card bg-white/80 border border-white shadow-2xl rounded-[2rem] overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-blue-600 font-semibold">ShopStyle</p>
                    <p className="text-xl font-bold text-slate-900">Expérience Premium</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {highlights.map((item) => (
                    <div key={item.title} className="p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-inner">
                          {item.icon}
                        </span>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-lg">
                  <div>
                    <p className="text-sm text-white/80">Prêt à commencer ?</p>
                    <p className="text-lg font-semibold">Créez un compte et personnalisez vos listes.</p>
                  </div>
                  <a
                    href="/register"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-700 font-semibold shadow-md"
                  >
                    S'inscrire
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card bg-white/90 border border-white/80 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-6 mb-8">
            <div className="space-y-2">
              <p className="pill bg-blue-50 text-blue-700 border-blue-100">Pourquoi ShopStyle</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Une esthétique cohérente sur toutes vos pages</h2>
              <p className="text-slate-600 max-w-3xl">
                Navigation, fiches produit, panier et paiements partagent désormais la même identité visuelle. Chaque écran reste clair, respirant et prêt pour vos contenus.
              </p>
            </div>
            <a
              href="/home"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold shadow-md hover:-translate-y-[1px] transition"
            >
              Explorer les produits
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk) => (
              <div key={perk.title} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/80 shadow-sm flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center text-blue-700">
                  <perk.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{perk.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{perk.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
