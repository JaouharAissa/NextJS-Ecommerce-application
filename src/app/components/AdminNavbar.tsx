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
} from "lucide-react";
import LogoMark from "./LogoMark";

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="container-main">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/dashboard" className="flex items-center gap-3">
            <LogoMark size="sm" className="shadow-lg" />
          </Link>

          <div className="hidden lg:flex items-center gap-2 text-white">
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/10 ${
                  isActive(pathname, href)
                    ? "bg-white/20 text-white shadow-md"
                    : "text-slate-100 hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <span className="text-sm text-slate-100">Admin</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>

          <button
            className="lg:hidden text-white p-2 border border-white/15 rounded-xl bg-white/10"
            onClick={() => setOpen(!open)}
            aria-label="Ouvrir le menu admin"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-white/10 bg-slate-900/60 backdrop-blur">
            <div className="px-4 py-4 space-y-2">
              {adminLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-white/10 ${
                    isActive(pathname, href)
                      ? "bg-white/20 text-white"
                      : "text-slate-100 hover:bg-white/10"
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
                className="w-full flex items-center justify-center gap-2 bg-white text-blue-700 px-4 py-3 rounded-lg text-sm font-semibold transition-colors mt-2"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}




