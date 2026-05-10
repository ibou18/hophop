import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Hophop",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
