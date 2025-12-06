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
    <nav className="sticky top-0 z-40 glass-nav">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 border border-white/15 shadow-lg">
            <Sparkles size={22} />
          </span>
          ShopStyle
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-100">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.name}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" && (
            <Link href="/mes-commandes" className="flex items-center gap-2 hover:text-white transition-colors">
              <ListOrdered size={16} />
              Mes commandes
            </Link>
          )}
          {role === "admin" && (
            <Link href="/dashboard" className="flex items-center gap-2 hover:text-white transition-colors">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commentaires" className="hover:text-white transition-colors">
              Commentaires
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commandes" className="hover:text-white transition-colors">
              Commandes admin
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-white text-blue-700 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Bouton menu mobile */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu mobile"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="md:hidden bg-slate-900/90 px-4 pb-4 space-y-2 border-t border-white/10 text-slate-100">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" && (
            <Link
              href="/mes-commandes"
              className="block py-2 text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Mes commandes
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/dashboard"
              className="block py-2 text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/commentaires"
              className="block py-2 text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Commentaires
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/commandes"
              className="block py-2 text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Commandes admin
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full bg-white text-blue-700 px-3 py-2 rounded-full text-sm font-semibold shadow-md"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="block bg-white text-blue-700 px-3 py-2 rounded-full text-center font-semibold shadow-md"
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
