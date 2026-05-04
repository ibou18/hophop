import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion — Hophop",
};

function LoginFallback() {
  return (
    <div
      className="min-h-[24rem] w-full max-w-md animate-pulse rounded-2xl bg-white/60 p-10 shadow-xl shadow-hh-earth-dk/[0.06] ring-1 ring-white/80"
      aria-hidden
    />
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
