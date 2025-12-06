"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, LogOut, Menu, X, ListOrdered, LayoutDashboard } from "lucide-react";

type NavbarProps = {
  readonly links: readonly { readonly name: string; readonly href: string }[];
};

export default function Navbar({ links }: NavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const syncAuthState = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const storedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
      setIsAuthenticated(!!token);
      setRole(storedRole);
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
    router.push("/login");
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/60 shadow-lg">
      <div className="container-main py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-900">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl glass-surface text-blue-600">
            <Sparkles size={20} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-medium text-slate-500">ShopStyle</span>
            <span className="text-xl font-bold text-slate-900">Marketplace</span>
          </div>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" && (
            <Link href="/mes-commandes" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
              <ListOrdered size={16} />
              Mes commandes
            </Link>
          )}
          {role === "admin" && (
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commentaires" className="text-sm font-semibold text-slate-700 hover:text-blue-600">
              Commentaires
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commandes" className="text-sm font-semibold text-slate-700 hover:text-blue-600">
              Commandes admin
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="btn-primary px-4 py-2 rounded-xl shadow-md"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Bouton menu mobile */}
        <button
          className="md:hidden text-slate-900"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu mobile"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-xl px-4 pb-4 space-y-2 border-t border-slate-100 shadow-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-semibold text-slate-800"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" && (
            <Link
              href="/mes-commandes"
              className="block py-2 text-sm font-semibold text-slate-800"
              onClick={() => setIsOpen(false)}
            >
              Mes commandes
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/dashboard"
              className="block py-2 text-sm font-semibold text-slate-800"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/commentaires"
              className="block py-2 text-sm font-semibold text-slate-800"
              onClick={() => setIsOpen(false)}
            >
              Commentaires
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/commandes"
              className="block py-2 text-sm font-semibold text-slate-800"
              onClick={() => setIsOpen(false)}
            >
              Commandes admin
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-sm"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-xl text-center font-semibold shadow-sm"
              onClick={() => setIsOpen(false)}
            >
              Connexion
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
