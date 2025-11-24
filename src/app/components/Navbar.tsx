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
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-2xl backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15">
            <Sparkles size={22} />
          </span>
          ShopStyle
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-50 text-sm font-medium">
              {link.name}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" && (
            <Link href="/mes-commandes" className="flex items-center gap-2 hover:text-blue-50 text-sm font-medium">
              <ListOrdered size={16} />
              Mes commandes
            </Link>
          )}
          {role === "admin" && (
            <Link href="/dashboard" className="flex items-center gap-2 hover:text-blue-50 text-sm font-medium">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commentaires" className="hover:text-blue-50 text-sm font-medium">
              Commentaires
            </Link>
          )}
          {role === "admin" && (
            <Link href="/commandes" className="hover:text-blue-50 text-sm font-medium">
              Commandes admin
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition"
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
        <div className="md:hidden bg-blue-500/95 px-4 pb-4 space-y-2 border-t border-white/10">
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
              className="w-full bg-white text-blue-600 px-3 py-2 rounded-full text-sm font-semibold"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="block bg-white text-blue-600 px-3 py-2 rounded-full text-center font-semibold"
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
