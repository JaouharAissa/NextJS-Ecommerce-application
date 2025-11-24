"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Registration successful! Redirecting...");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleRegister} className="p-6 border rounded w-80">
        <h1 className="text-xl font-bold mb-4">Register</h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-2 mb-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-500 text-white w-full py-2 rounded"
        >
          Register
        </button>

        {message && (
          <p className="mt-2 text-sm text-red-500">{message}</p>
        )}
      </form>
    </div>
  );
}
