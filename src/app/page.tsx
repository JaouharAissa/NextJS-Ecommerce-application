"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, ShoppingBag, HeartHandshake } from "lucide-react";

const highlights = [
  {
    title: "Collections inspirées",
    description: "Une sélection soignée de pièces iconiques pour sublimer chaque saison.",
    icon: <Sparkles className="w-5 h-5 text-blue-200" />,
  },
  {
    title: "Paiement sécurisé",
    description: "Transactions protégées et notifications en temps réel pour vos commandes.",
    icon: <ShieldCheck className="w-5 h-5 text-blue-200" />,
  },
  {
    title: "Expérience unifiée",
    description: "Une interface fluide où vos favoris, commandes et recommandations se rencontrent.",
    icon: <HeartHandshake className="w-5 h-5 text-blue-200" />,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-pattern text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
              ShopStyle Studio
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Une expérience e-commerce immersive et minimaliste.
              </h1>
              <p className="text-lg text-slate-200 max-w-2xl">
                Explorez une boutique pensée pour rester simple, rapide et élégante. Retrouvez vos catégories, gérez vos commandes et
                profitez d&apos;une navigation cohérente sur toutes les pages.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-2 shadow-xl"
              >
                Accéder à la boutique
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="glass-button inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold"
              >
                Créer un compte
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {highlights.map((item) => (
                <div key={item.title} className="glass-card p-5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-blue-50">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/15">
                      {item.icon}
                    </span>
                    {item.title}
                  </div>
                  <p className="mt-3 text-sm text-slate-200 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-blue-500/40 via-indigo-500/30 to-emerald-400/30 blur-3xl rounded-full" />
            <div className="relative glass-card p-8 border-white/15">
              <div className="flex items-center gap-3 mb-6 text-blue-100">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 grid place-items-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em]">Navigation</p>
                  <h2 className="text-2xl font-bold">Pages harmonisées</h2>
                </div>
              </div>

              <div className="space-y-4 text-slate-100 text-sm">
                <p className="leading-relaxed">
                  Chaque écran adopte une même identité visuelle : surfaces translucides, contrastes assumés et hiérarchie claire.
                  Retrouvez instantanément vos repères, que vous soyez sur la page d&apos;accueil, la boutique, ou la gestion des commandes.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs text-blue-100">
                  <div className="surface-panel p-4 flex flex-col gap-2">
                    <span className="font-semibold">Connexion</span>
                    <span className="text-slate-200">Formulaire lumineux, CTA nets et retours immédiats.</span>
                  </div>
                  <div className="surface-panel p-4 flex flex-col gap-2">
                    <span className="font-semibold">Boutique</span>
                    <span className="text-slate-200">Filtres, favoris et panier dans une barre cohérente.</span>
                  </div>
                </div>
                <p className="flex items-center gap-2 text-blue-100 font-semibold">
                  <Sparkles size={16} />
                  Une toile moderne pour vos contenus existants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
