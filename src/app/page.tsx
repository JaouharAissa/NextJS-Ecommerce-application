"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/uploads/1764162011711-65024461-8_U2_A0307_fa368d5921.jpg"
          alt="Background"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center p-8 max-w-md w-full animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-4 tracking-tight">
          FreshFits
        </h1>
        <p className="text-lg text-gray-200 mb-10 font-light tracking-wide">
          Fashion & Elegance. Redefined.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/login"
            className="w-full bg-white text-black py-4 rounded-full font-semibold uppercase tracking-widest hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="w-full bg-transparent border-2 border-white text-white py-4 rounded-full font-semibold uppercase tracking-widest hover:bg-white/10 transition-all transform hover:scale-105"
          >
            Sign Up
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-gray-400 text-sm z-10">
        &copy; {new Date().getFullYear()} FreshFits. All rights reserved.
      </div>
    </div>
  );
}
