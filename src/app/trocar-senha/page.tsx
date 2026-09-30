import type { Metadata } from "next";
import { PasswordForm } from "@/components/password-form";

export const metadata: Metadata = { title: "Alterar senha" };

export default function PasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <PasswordForm />
    </div>
  );
}
