"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, User, Mail, Lock } from "lucide-react";
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
    if (value.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Only letters, numbers, and underscores allowed";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
    return "";
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(value)) return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(value)) return "Must contain at least one number";
    if (!/[\W_]/.test(value)) return "Must contain at least one special character";
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

    if (strength <= 2) return { label: "Weak", color: "from-[var(--error)] to-[var(--error)]", width: "33%", textColor: "text-[var(--error)]" };
    if (strength <= 4) return { label: "Medium", color: "from-[var(--warning)] to-[var(--warning)]", width: "66%", textColor: "text-[var(--warning)]" };
    return { label: "Strong", color: "from-[var(--success)] to-[var(--primary)]", width: "100%", textColor: "text-[var(--success)]" };
  };

  const usernameError = touched.username ? validateUsername(username) : "";
  const emailError = touched.email ? validateEmail(email) : "";
  const passwordError = touched.password ? validatePassword(password) : "";
  const confirmPasswordError = touched.confirmPassword && password !== confirmPassword
    ? "Passwords do not match"
    : "";

  const isFormValid =
    !validateUsername(username) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    password === confirmPassword &&
    password.length > 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      setMessage("Please fix the errors before continuing");
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
      setMessage("Registration successful! Redirecting...");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setMessage(data.error || "An error occurred");
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

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
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Create Account</h2>
            <p className="text-[var(--foreground-muted)] text-sm">
              Join the FreshFits community
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">
                Username
              </label>
              <div className={`glass-input flex items-center gap-3 ${usernameError ? "border-[var(--error)]" : ""}`}>
                <User
                  className={`text-[var(--foreground-muted)] flex-shrink-0 transition-all duration-300 ${username ? 'opacity-0 w-0' : 'opacity-100'}`}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Your username"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[var(--foreground-muted)]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched({ ...touched, username: true })}
                  required
                />
              </div>
              {usernameError && (
                <p className="text-xs text-[var(--error)] flex items-center gap-1">
                  <XCircle size={12} /> {usernameError}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">
                Email
              </label>
              <div className={`glass-input flex items-center gap-3 ${emailError ? "border-[var(--error)]" : ""}`}>
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
                  onBlur={() => setTouched({ ...touched, email: true })}
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-[var(--error)] flex items-center gap-1">
                  <XCircle size={12} /> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">
                Password
              </label>
              <div className={`glass-input flex items-center gap-3 ${passwordError ? "border-[var(--error)]" : ""}`}>
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
                  onBlur={() => setTouched({ ...touched, password: true })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--foreground-muted)] hover:text-white transition-colors flex-shrink-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && passwordStrength && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Strength</span>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${passwordStrength.textColor}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${passwordStrength.color} transition-all duration-500 rounded-full`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}

              {passwordError && (
                <p className="text-xs text-[var(--error)] flex items-center gap-1">
                  <XCircle size={12} /> {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">
                Confirm Password
              </label>
              <div className={`glass-input flex items-center gap-3 ${confirmPasswordError ? "border-[var(--error)]" : ""}`}>
                <Lock
                  className={`text-[var(--foreground-muted)] flex-shrink-0 transition-all duration-300 ${confirmPassword ? 'opacity-0 w-0' : 'opacity-100'}`}
                  size={18}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[var(--foreground-muted)]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[var(--foreground-muted)] hover:text-white transition-colors flex-shrink-0"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-[var(--error)] flex items-center gap-1">
                  <XCircle size={12} /> {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${message.includes("successful")
                ? "bg-[var(--success)]/20 border border-[var(--success)]/30"
                : "bg-[var(--error)]/20 border border-[var(--error)]/30"
                }`}>
                {message.includes("successful") ? (
                  <CheckCircle2 size={18} className="text-[var(--success)] flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-[var(--error)] flex-shrink-0" />
                )}
                <span className={`text-sm ${message.includes("successful") ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                  {message}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent"></div>
            <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-[var(--foreground-muted)] text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[var(--primary)] hover:text-[var(--accent)] transition-colors font-medium"
              >
                Sign in
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
