"use client";

import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const links = [
  { name: "Boutique", href: "/home" },
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const adminPrefixes = ["/dashboard", "/products", "/categories", "/commandes", "/commentaires"];
  const hideNavbar =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/home" ||
    adminPrefixes.some((prefix) => pathname?.startsWith(prefix));

  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="page-shell">
          {!hideNavbar && <Navbar links={links} />}
          <main className="relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
