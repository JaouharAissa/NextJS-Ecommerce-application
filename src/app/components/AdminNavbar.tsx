"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  ClipboardList,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Plus,
  BarChart2,
  Search
} from "lucide-react";
import LogoMark from "./LogoMark";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/categories", label: "Catégories", icon: Tag },
  { href: "/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/commentaires", label: "Commentaires", icon: MessageSquare },
  { href: "/dashboard/sentiments", label: "Sentiment Analysis", icon: BarChart2 },
] as const;

const quickActions = [
  { label: "Ajouter un produit", href: "/products?action=new", icon: Plus },
  { label: "Suivre les commandes", href: "/commandes", icon: ClipboardList },
  { label: "Modérer les avis", href: "/commentaires", icon: MessageSquare },
  { label: "Analyser les sentiments", href: "/analytics", icon: BarChart2 },
];

const isActive = (pathname: string, target: string) => {
  if (target === "/products") return pathname.startsWith("/products");
  if (target === "/commandes") return pathname.startsWith("/commandes");
  if (target === "/categories") return pathname.startsWith("/categories");
  if (target === "/commentaires") return pathname.startsWith("/commentaires");
  return pathname === target;
};

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white border-b border-gray-800">
      <div className="container-main">
        <div className="flex items-center justify-between h-18 lg:h-22">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-sm">
              <LogoMark size="sm" className="text-black" showTagline={false} />
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {adminLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium uppercase tracking-wider transition-colors py-2 ${isActive(pathname, href)
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-300 hover:text-white transition-colors px-4 py-2 border border-gray-700 rounded hover:border-gray-500"
              >
                Actions Rapides
              </button>

              {showQuickActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 text-black animate-in fade-in zoom-in-95 duration-200">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                      onClick={() => setShowQuickActions(false)}
                    >
                      <action.icon size={16} className="text-gray-500" />
                      {action.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>

          <button
            className="lg:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Ouvrir le menu admin"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden fixed inset-0 top-16 bg-gray-900 z-40">
            <div className="p-6 space-y-6">
              {adminLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-4 text-lg font-medium ${isActive(pathname, href) ? "text-white" : "text-gray-400"
                    }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={20} />
                  {label}
                </Link>
              ))}

              <hr className="border-gray-800" />

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Actions Rapides</p>
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 text-gray-300 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    <action.icon size={18} />
                    {action.label}
                  </Link>
                ))}
              </div>

              <hr className="border-gray-800" />

              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-4 text-lg font-medium text-red-400 w-full"
              >
                <LogOut size={20} />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}




