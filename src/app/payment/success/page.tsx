"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "idle"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("Session Stripe manquante.");
      return;
    }

    const confirmOrder = async () => {
      try {
        setStatus("loading");
        const token = localStorage.getItem("token");
        if (!token) {
          setStatus("error");
          setErrorMessage("Veuillez vous reconnecter pour voir votre commande.");
          return;
        }

        const res = await fetch("/api/stripe/confirm-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Erreur lors de la confirmation.");
          return;
        }

        setStatus("success");
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Erreur inconnue."
        );
      }
    };

    void confirmOrder();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern px-4">
      <div className="max-w-md w-full glass-card p-8 md:p-10 space-y-6 text-center">
        {status === "loading" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-r-transparent" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Confirmation en cours...
            </h1>
            <p className="text-gray-600">
              Merci de patienter pendant que nous validons votre commande.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600">
              Paiement confirmé !
            </h1>
            <p className="text-gray-600">
              Votre commande a bien été enregistrée. Vous pouvez la consulter
              dans la section &quot;Mes commandes&quot;.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                type="button"
                onClick={() => router.push("/mes-commandes")}
                className="btn-primary px-6 py-3 text-sm font-semibold"
              >
                Voir mes commandes
              </button>
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Retour à la boutique
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-600">
              Problème avec votre paiement
            </h1>
            <p className="text-gray-600 mb-4">
              {errorMessage || "Une erreur est survenue lors de la validation."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="btn-primary px-6 py-3 text-sm font-semibold"
            >
              Retour à la boutique
            </button>
          </>
        )}

        {status === "idle" && (
          <>
            <h1 className="text-xl font-semibold text-gray-800">
              Redirection...
            </h1>
          </>
        )}
      </div>
    </div>
  );
}



