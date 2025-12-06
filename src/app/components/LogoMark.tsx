"use client";

import { Sparkles } from "lucide-react";

interface LogoMarkProps {
  readonly size?: "sm" | "md" | "lg";
  readonly showTagline?: boolean;
  readonly className?: string;
}

export default function LogoMark({ size = "md", showTagline = true, className }: LogoMarkProps) {
  const sizing = {
    sm: "gap-2 px-2.5 py-2 text-sm",
    md: "gap-3 px-3 py-2.5",
    lg: "gap-3.5 px-3.5 py-3 text-lg",
  }[size];

  return (
    <span className={["logo-mark", sizing, className].filter(Boolean).join(" ")}>
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15 shadow-inner">
        <Sparkles size={size === "lg" ? 22 : 18} />
      </span>
      <span className="logotype">
        <span className="brand-name">Atelier Aura</span>
        {showTagline && <span className="brand-tagline">Mode &amp; design</span>}
      </span>
    </span>
  );
}
