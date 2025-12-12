"use client";

import { usePathname } from "next/navigation";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const adminPrefixes = ["/dashboard", "/products", "/categories", "/commandes", "/commentaires"];
  const isAdminPage = pathname && adminPrefixes.some((prefix) => pathname.startsWith(prefix));

  return (
    <html lang="fr">
      <body className="antialiased">
        {/* Floating Gradient Orbs Background - on ALL pages */}
        <div className="floating-orbs" aria-hidden="true">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
