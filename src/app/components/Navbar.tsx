"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X, ShoppingBag, User, Heart, Search } from "lucide-react";

type NavbarProps = {
  readonly links?: readonly { readonly name: string; readonly href: string }[];
  readonly onSearch?: (query: string) => void;
  readonly searchValue?: string;
  readonly cartCount?: number;
  readonly onCartClick?: () => void;
};

export default function Navbar({ links = [], onSearch, searchValue, cartCount = 0, onCartClick }: NavbarProps) {
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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="container-main h-20 flex items-center justify-between gap-8">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -ml-2 text-black hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <span className="text-2xl font-serif font-bold tracking-tight text-black group-hover:opacity-80 transition-opacity">
            FreshFits
          </span>
        </Link>

        {/* Search Bar (Centered) */}
        {onSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-100 border-none rounded-full focus:ring-1 focus:ring-black placeholder:text-gray-400 text-sm transition-all hover:bg-gray-200 focus:bg-white"
              value={searchValue || ""}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}

        {/* Desktop Navigation (Optional) */}
        {links.length > 0 && (
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors uppercase tracking-wider relative after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[1px] after:bg-black after:transition-all hover:after:w-full"
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {isAuthenticated && (
            <>
              {/* Favorites */}
              <Link
                href="/favorites"
                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Favorites"
              >
                <Heart size={20} />
              </Link>

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-all relative"
                title="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>

              {role === "admin" && (
                <Link
                  href="/dashboard"
                  className="hidden md:block px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-gray-800 transition-colors"
                >
                  Admin
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="hidden md:block p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          )}

          {!isAuthenticated && (
            <Link
              href="/login"
              className="px-6 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all hover:shadow-lg"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-20 z-40 bg-white md:hidden animate-fade-in border-t border-gray-100">
          <div className="flex flex-col p-6 space-y-6">
            {/* Mobile Search */}
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-full focus:ring-1 focus:ring-black placeholder:text-gray-400 text-sm"
                  value={searchValue || ""}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            )}

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-2xl font-serif font-medium text-black"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-gray-100" />
            {isAuthenticated ? (
              <>
                <Link href="/favorites" className="flex items-center gap-3 text-lg text-gray-600" onClick={() => setIsOpen(false)}>
                  <Heart size={20} /> Favorites
                </Link>
                <button onClick={() => { onCartClick?.(); setIsOpen(false); }} className="flex items-center gap-3 text-lg text-gray-600">
                  <ShoppingBag size={20} /> Cart ({cartCount})
                </button>
                {role === "admin" && (
                  <Link href="/dashboard" className="flex items-center gap-3 text-lg text-gray-600" onClick={() => setIsOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-3 text-lg text-red-500 font-medium">
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="text-lg font-medium text-black" onClick={() => setIsOpen(false)}>
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
