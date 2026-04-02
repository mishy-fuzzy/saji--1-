"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TeamInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function processInvite() {
      if (!token) {
        setStatus("error");
        setMessage("No invitation token provided");
        return;
      }

      try {
        const response = await fetch(
          `/api/admin/team-promotions/accept?token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          setStatus("error");
          const data = await response.json().catch(() => ({}));
          setMessage(
            data.error ||
              `Failed to process invitation (${response.status})`
          );
          return;
        }

        setStatus("success");
        setMessage("Invitation accepted! Redirecting...");

        // Redirect after short delay
        setTimeout(() => {
          window.location.href = "/team-login";
        }, 2000);
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Failed to process invitation"
        );
      }
    }

    processInvite();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Team Invitation
        </h1>

        {status === "loading" && (
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Processing your invitation...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <p className="text-green-600 dark:text-green-400 font-semibold mb-2">
              Invitation Accepted
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {message}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="mb-4 text-4xl">❌</div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
              Invalid Invitation
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {message}
            </p>
            <a
              href="/team-login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Go to Team Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
