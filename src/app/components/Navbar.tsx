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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const storedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
      setIsAuthenticated(!!token);
      setRole(storedRole);
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("scroll", handleScroll);
    };
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
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
      ? "bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--glass-border)]"
      : "bg-transparent"
      }`}>
      <div className="container-main h-20 flex items-center justify-between gap-8">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -ml-2 text-white hover:bg-[var(--glass-bg)] rounded-xl transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <span className="text-2xl font-display text-gradient tracking-wider">
            FRESHFITS
          </span>
        </Link>

        {/* Search Bar (Centered) */}
        {onSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <div className="glass-input flex items-center gap-3 w-full rounded-full">
              <Search className="text-[var(--foreground-muted)] flex-shrink-0" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-[var(--foreground-muted)]"
                value={searchValue || ""}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Desktop Navigation */}
        {links.length > 0 && (
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--foreground-muted)] hover:text-white transition-colors uppercase tracking-wider relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated && (
            <>
              {/* Favorites */}
              <Link
                href="/favorites"
                className="p-3 text-[var(--foreground-muted)] hover:text-[var(--pink)] hover:bg-[var(--glass-bg)] rounded-xl transition-all"
                title="Favorites"
              >
                <Heart size={20} />
              </Link>

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="p-3 text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:bg-[var(--glass-bg)] rounded-xl transition-all relative"
                title="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>

              {role === "admin" && (
                <Link
                  href="/dashboard"
                  className="hidden md:flex items-center gap-2 px-4 py-2 btn-gradient text-xs"
                >
                  Admin
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="hidden md:block p-3 text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          )}

          {!isAuthenticated && (
            <Link
              href="/login"
              className="btn-gradient px-6 py-2 text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-20 z-40 bg-[var(--background)]/95 backdrop-blur-xl md:hidden animate-fade-in">
          <div className="flex flex-col p-6 space-y-6">
            {/* Mobile Search */}
            {onSearch && (
              <div className="glass-input flex items-center gap-3 rounded-xl">
                <Search className="text-[var(--foreground-muted)] flex-shrink-0" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-[var(--foreground-muted)] py-1"
                  value={searchValue || ""}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            )}

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-2xl font-heading font-bold text-white hover:text-gradient transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <hr className="border-[var(--glass-border)]" />

            {isAuthenticated ? (
              <>
                <Link
                  href="/favorites"
                  className="flex items-center gap-4 text-lg text-[var(--foreground-muted)] hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Heart size={24} /> Favorites
                </Link>
                <button
                  onClick={() => { onCartClick?.(); setIsOpen(false); }}
                  className="flex items-center gap-4 text-lg text-[var(--foreground-muted)] hover:text-white transition-colors"
                >
                  <ShoppingBag size={24} /> Cart ({cartCount})
                </button>
                {role === "admin" && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-4 text-lg text-[var(--primary)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 text-lg text-[var(--error)] font-medium"
                >
                  <LogOut size={24} /> Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="btn-gradient w-full py-4 text-center"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
