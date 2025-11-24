"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        // Sauvegarder le token et le rôle
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        // ✅ Redirection selon le rôle
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
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="p-6 border rounded-lg shadow-lg bg-white w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white w-full py-2 rounded transition disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        {message && (
          <p className="mt-3 text-sm text-red-500 text-center">{message}</p>
        )}

        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}