"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const router = useRouter();

  // Validation functions
  const validateUsername = (value: string) => {
    if (value.length < 3) return "Le nom d'utilisateur doit contenir au moins 3 caractères";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Seuls les lettres, chiffres et underscore sont autorisés";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email invalide";
    return "";
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
    if (!/[A-Z]/.test(value)) return "Doit contenir au moins une majuscule";
    if (!/[a-z]/.test(value)) return "Doit contenir au moins une minuscule";
    if (!/[0-9]/.test(value)) return "Doit contenir au moins un chiffre";
    return "";
  };

  const getPasswordStrength = (value: string) => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;

    if (strength <= 2) return { label: "Faible", color: "bg-red-500", width: "33%" };
    if (strength <= 4) return { label: "Moyen", color: "bg-yellow-500", width: "66%" };
    return { label: "Fort", color: "bg-green-500", width: "100%" };
  };

  const usernameError = touched.username ? validateUsername(username) : "";
  const emailError = touched.email ? validateEmail(email) : "";
  const passwordError = touched.password ? validatePassword(password) : "";
  const confirmPasswordError = touched.confirmPassword && password !== confirmPassword
    ? "Les mots de passe ne correspondent pas"
    : "";

  const isFormValid =
    !validateUsername(username) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    password === confirmPassword &&
    password.length > 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      setMessage("Veuillez corriger les erreurs avant de continuer");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (res.ok) {
      setMessage("Inscription réussie ! Redirection...");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setMessage(data.error || "Une erreur est survenue");
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

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
            <h1 className="text-2xl font-medium uppercase tracking-wider">Créer un compte</h1>
            <p className="text-sm text-gray-500">Rejoignez notre communauté</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                placeholder="Votre nom d'utilisateur"
                className={`w-full border-b py-3 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-gray-300 ${usernameError ? "border-red-300" : "border-gray-300 focus:border-black"
                  }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched({ ...touched, username: true })}
                required
              />
              {usernameError && (
                <p className="text-xs text-red-500 mt-1">{usernameError}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Email
              </label>
              <input
                type="email"
                placeholder="votre@email.com"
                className={`w-full border-b py-3 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-gray-300 ${emailError ? "border-red-300" : "border-gray-300 focus:border-black"
                  }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                required
              />
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full border-b py-3 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-gray-300 pr-10 ${passwordError ? "border-red-300" : "border-gray-300 focus:border-black"
                    }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Force</span>
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${passwordStrength.label === "Fort" ? "text-green-600" :
                      passwordStrength.label === "Moyen" ? "text-yellow-600" : "text-red-600"
                      }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-0.5 bg-gray-100 w-full">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}

              {passwordError && (
                <p className="text-xs text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full border-b py-3 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-gray-300 pr-10 ${confirmPasswordError ? "border-red-300" : "border-gray-300 focus:border-black"
                    }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-red-500 mt-1">{confirmPasswordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-4 text-sm font-medium uppercase tracking-wider hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {isLoading ? "Inscription..." : "S'inscrire"}
            </button>

            {message && (
              <div className={`p-3 text-xs flex items-center gap-2 ${message.includes("réussie") || message.includes("successful")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
                }`}>
                {message.includes("réussie") || message.includes("successful") ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{message}</span>
              </div>
            )}
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Vous avez déjà un compte?{" "}
              <Link href="/login" className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
