"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        if (data.role === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/home");
        }
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group">
            <h1 className="text-4xl font-display text-gradient tracking-wider">
              FRESHFITS
            </h1>
            <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-300 mt-2 mx-auto rounded-full"></div>
          </Link>
        </div>

        {/* Glass Card */}
        <div className="glass-card-static p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-[var(--foreground-muted)] text-sm">
              Sign in to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">
                Email
              </label>
              <div className="glass-input flex items-center gap-3">
                <Mail
                  className={`text-[var(--foreground-muted)] flex-shrink-0 transition-all duration-300 ${email ? 'opacity-0 w-0' : 'opacity-100'}`}
                  size={18}
                />
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[var(--foreground-muted)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">
                Password
              </label>
              <div className="glass-input flex items-center gap-3">
                <Lock
                  className={`text-[var(--foreground-muted)] flex-shrink-0 transition-all duration-300 ${password ? 'opacity-0 w-0' : 'opacity-100'}`}
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[var(--foreground-muted)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--foreground-muted)] hover:text-white transition-colors flex-shrink-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {message && (
              <div className="p-4 rounded-lg bg-[var(--error)]/20 border border-[var(--error)]/30 flex items-center gap-3 animate-fade-in">
                <AlertCircle size={18} className="text-[var(--error)] flex-shrink-0" />
                <span className="text-sm text-[var(--error)]">{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  Sign In
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent"></div>
            <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-[var(--foreground-muted)] text-sm">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-[var(--primary)] hover:text-[var(--accent)] transition-colors font-medium"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-xs text-[var(--foreground-muted)]">
          ©2025 FreshFits. Premium Streetwear.
        </p>
      </div>
    </div>
  );
}