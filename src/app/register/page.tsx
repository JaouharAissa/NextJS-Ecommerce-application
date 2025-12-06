"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
      <div className="w-full max-w-md">
        <div className="glass-card bg-white/90 text-slate-900 p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-2">
              <CheckCircle2 size={28} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Créer un compte</h1>
            <p className="text-gray-600">Rejoignez ShopStyle dès aujourd'hui</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                placeholder="Choisissez un nom d'utilisateur unique"
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${usernameError
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched({ ...touched, username: true })}
                required
              />
              {usernameError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> {usernameError}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Entrez votre adresse email valide"
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${emailError
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                required
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Créez un mot de passe sécurisé (min. 8 caractères)"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 outline-none transition-all pr-12 ${passwordError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Force du mot de passe:</span>
                    <span className={`text-xs font-medium ${passwordStrength.label === "Fort" ? "text-green-600" :
                        passwordStrength.label === "Moyen" ? "text-yellow-600" : "text-red-600"
                      }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}

              {passwordError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Créez un mot de passe sécurisé (min. 8 caractères)"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 outline-none transition-all pr-12 ${confirmPasswordError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> {confirmPasswordError}
                </p>
              )}
              {!confirmPasswordError && confirmPassword && password === confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Les mots de passe correspondent
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </button>

            {message && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${message.includes("réussie") || message.includes("successful")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                {message.includes("réussie") || message.includes("successful") ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span className="text-sm">{message}</span>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
