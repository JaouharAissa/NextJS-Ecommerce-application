"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/" className="text-2xl font-serif font-bold tracking-tight text-black">
            FreshFits
          </Link>
        </div>

        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium uppercase tracking-wider">Connexion</h1>
            <p className="text-sm text-gray-500">Accédez à votre espace personnel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Email
              </label>
              <input
                type="email"
                placeholder="votre@email.com"
                className="w-full border-b border-gray-300 py-3 text-sm focus:border-black focus:outline-none transition-colors bg-transparent placeholder:text-gray-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border-b border-gray-300 py-3 text-sm focus:border-black focus:outline-none transition-colors bg-transparent placeholder:text-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className="p-3 bg-gray-50 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-4 text-sm font-medium uppercase tracking-wider hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}