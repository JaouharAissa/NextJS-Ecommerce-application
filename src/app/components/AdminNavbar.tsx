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
  Shield,
  Menu,
  X,
} from "lucide-react";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/categories", label: "Catégories", icon: Tag },
  { href: "/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/commentaires", label: "Commentaires", icon: MessageSquare },
] as const;

const isActive = (pathname: string, target: string) => {
  if (target === "/products") {
    return pathname.startsWith("/products");
  }
  if (target === "/commandes") {
    return pathname.startsWith("/commandes");
  }
  if (target === "/categories") {
    return pathname.startsWith("/categories");
  }
  if (target === "/commentaires") {
    return pathname.startsWith("/commentaires");
  }
  return pathname === target;
};

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-950 via-indigo-900 to-slate-900 text-white shadow-2xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 text-xl font-semibold tracking-wide">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
            <Shield className="text-blue-200" size={22} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="uppercase text-xs text-white/70">Administration</span>
            <span>ShopStyle</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {adminLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                isActive(pathname, href)
                  ? "bg-white text-slate-900 shadow-lg"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <span className="text-sm text-white/80">Connecté en tant qu’administrateur</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/90 hover:bg-red-400 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>

        <button
          className="lg:hidden text-white"
          onClick={() => setOpen(!open)}
          aria-label="Ouvrir le menu admin"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white/5 border-t border-white/10 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(pathname, href)
                    ? "bg-white text-slate-900 shadow"
                    : "text-white/80 hover:bg-white/10"
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-500/90 hover:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}



