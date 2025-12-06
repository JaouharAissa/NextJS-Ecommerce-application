"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  HeartHandshake,
  Layers,
  SlidersHorizontal,
  Palette,
} from "lucide-react";
import LogoMark from "./components/LogoMark";

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

const productShowcase = [
  {
    name: "Blazer minimal",
    image: "/uploads/1764162011711-65024461-8_U2_A0307_fa368d5921.jpg",
    tone: "from-white/30 via-white/10 to-cyan-100/20",
  },
  {
    name: "Tailleur urbain",
    image: "/uploads/1764162242266-963892956-07687575833-A6M.webp",
    tone: "from-indigo-100/40 via-purple-50/30 to-white/10",
  },
  {
    name: "Coupe décontractée",
    image: "/uploads/1764162546443-117641503-03696512802-a6m.webp",
    tone: "from-slate-50/50 via-white/20 to-emerald-50/40",
  },
];

const flows = [
  {
    title: "Parcours client",
    description: "Navigation claire, filtres doux, focus sur les visuels et micro-interactions discrètes.",
    icon: <SlidersHorizontal className="w-5 h-5" />,
  },
  {
    title: "Gestion admin",
    description: "Dashboard harmonisé, accès rapide aux catégories, produits et commandes en un clic.",
    icon: <Layers className="w-5 h-5" />,
  },
  {
    title: "Palette cohérente",
    description: "Soft gradients, typographie nette et composants réutilisables pour tout l’écosystème.",
    icon: <Palette className="w-5 h-5" />,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-pattern text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 lg:py-24 space-y-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <LogoMark />
              <span className="badge-soft">Maison moderne</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Design minimal, expérience mode immersive.
              </h1>
              <p className="text-lg text-slate-200 max-w-2xl">
                Un univers inspiré des maisons contemporaines : typographie nette, gradients doux et navigation cohérente. Chaque page
                utilisateur ou admin conserve la même élégance pour rester fluide et intuitive.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 shadow-xl">
                Accéder à la boutique
                <ArrowRight size={18} />
              </Link>
              <Link href="/register" className="btn-ghost inline-flex items-center gap-2 font-semibold">
                Créer un compte
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {highlights.map((item) => (
                <div key={item.title} className="card-soft">
                  <div className="flex items-center gap-3 text-sm font-semibold text-blue-50">
                    <span className="icon-pill">{item.icon}</span>
                    {item.title}
                  </div>
                  <p className="mt-3 text-sm text-slate-200 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-shell">
            <div className="flex items-center justify-between mb-6 text-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 grid place-items-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em]">Parcours harmonisé</p>
                  <h2 className="text-2xl font-bold">Tous les écrans coordonnés</h2>
                </div>
              </div>
              <span className="stat-blend">
                <ShieldCheck size={18} />
                Paiement sécurisé
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {productShowcase.map((item, index) => (
                <div
                  key={item.name}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.tone}`} />
                  <div className="relative p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-100">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                        <Sparkles size={14} /> Highlight
                      </span>
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div className="relative h-36 rounded-xl overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={index === 0}
                      />
                    </div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <span className="text-xs text-slate-200">Textures clean & silhouettes nettes</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 panel-grid">
              {flows.map((flow) => (
                <div key={flow.title} className="card-soft">
                  <div className="flex items-center gap-3 text-sm font-semibold text-blue-50">
                    <span className="icon-pill">{flow.icon}</span>
                    {flow.title}
                  </div>
                  <p className="mt-3 text-sm text-slate-200 leading-relaxed">{flow.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-blue-100 font-semibold">
              <Sparkles size={16} />
              Une toile moderne pour vos pages produits, catégories, checkout et dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
