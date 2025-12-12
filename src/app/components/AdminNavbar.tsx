"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Orders", href: "/commandes", icon: ShoppingCart },
  { name: "Reviews", href: "/commentaires", icon: MessageSquare },
  { name: "Sentiments", href: "/dashboard/sentiments", icon: BarChart3 },
];

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop & Mobile Top Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--glass-border)]"
          : "bg-[var(--background)]/50 backdrop-blur-md"
        }`}>
        <div className="container-main h-16 flex items-center justify-between gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-[var(--glass-bg)] rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="text-xl font-display text-gradient tracking-wider">
              FRESHFITS
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider px-2 py-1 glass-button rounded-lg">
              Admin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active
                      ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg shadow-[var(--primary)]/25"
                      : "text-[var(--foreground-muted)] hover:text-white hover:bg-[var(--glass-bg)]"
                    }`}
                >
                  <Icon size={18} />
                  <span className="hidden xl:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-72 bg-[var(--background)]/95 backdrop-blur-xl border-r border-[var(--glass-border)] z-50 lg:hidden animate-slide-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-display text-gradient">FRESHFITS</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-[var(--glass-bg)] rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                          ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white"
                          : "text-[var(--foreground-muted)] hover:text-white hover:bg-[var(--glass-bg)]"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span>{item.name}</span>
                      </div>
                      {active && <ChevronRight size={16} />}
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-6 left-6 right-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[var(--error)] hover:bg-[var(--error)]/10 rounded-xl transition-all text-sm font-medium border border-[var(--error)]/30"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
