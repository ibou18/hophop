import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion — Hophop",
};

function LoginFallback() {
  return (
    <div
      className="w-full max-w-md rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/30 bg-white p-10 min-h-[22rem] animate-pulse"
      aria-hidden
    />
  );
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
