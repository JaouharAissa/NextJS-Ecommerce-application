"use client";

interface LogoMarkProps {
  readonly size?: "sm" | "md" | "lg";
  readonly showTagline?: boolean;
  readonly className?: string;
}

export default function LogoMark({ size = "md", showTagline = true, className }: LogoMarkProps) {
  const textSize = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  }[size];

  return (
    <div className={`flex flex-col ${className || ""}`}>
      <span className={`font-serif font-bold tracking-tight text-black ${textSize}`}>
        FreshFits
      </span>
      {showTagline && (
        <span className="text-[0.4em] uppercase tracking-[0.3em] font-sans font-medium opacity-60 -mt-1">
          Paris • Tunis
        </span>
      )}
    </div>
  );
}
