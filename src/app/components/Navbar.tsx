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
    <nav className="sticky top-0 z-50 glass-nav">
      <div className="container-main py-3 md:py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 text-xl md:text-2xl font-semibold tracking-tight text-white">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 border border-white/15 shadow-lg">
            <Sparkles size={22} />
          </span>
          ShopStyle
        </Link>

        <div className="hidden md:flex items-center space-x-4 text-sm text-slate-100">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-full hover:bg-white/10 transition font-medium"
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" && (
            <Link
              href="/mes-commandes"
              className="px-3 py-2 rounded-full hover:bg-white/10 transition font-medium flex items-center gap-2"
            >
              <ListOrdered size={16} />
              Mes commandes
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-full hover:bg-white/10 transition font-medium flex items-center gap-2"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commentaires" className="px-3 py-2 rounded-full hover:bg-white/10 transition font-medium">
              Commentaires
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commandes" className="px-3 py-2 rounded-full hover:bg-white/10 transition font-medium">
              Commandes admin
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-700 font-semibold shadow-lg hover:-translate-y-0.5 transition"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-700 font-semibold shadow-lg hover:-translate-y-0.5 transition"
            >
              Connexion
            </Link>
          )}
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2 text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu mobile"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-gradient-to-b from-slate-900/90 to-slate-900/80 px-4 pb-4 space-y-2 border-t border-white/10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-white/90 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" && (
            <Link
              href="/mes-commandes"
              className="block py-2 text-sm font-medium text-white/90 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Mes commandes
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/dashboard"
              className="block py-2 text-sm font-medium text-white/90 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/commentaires"
              className="block py-2 text-sm font-medium text-white/90 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Commentaires
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/commandes"
              className="block py-2 text-sm font-medium text-white/90 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Commandes admin
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full bg-white text-blue-700 px-3 py-2 rounded-full text-sm font-semibold"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="block bg-white text-blue-700 px-3 py-2 rounded-full text-center font-semibold"
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
