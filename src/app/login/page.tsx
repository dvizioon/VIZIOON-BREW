import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { BrandMark } from "@/layout/brand";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams;
  const error = params.erro ? "E-mail ou senha inválidos." : undefined;
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -inset-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/assets/fundo.jpg)", filter: "blur(22px)" }}
        />
      </div>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundColor: "rgba(42, 22, 12, 0.4)" }} />
      <section className="relative w-full max-w-md rounded-lg bg-[#1a120e]/70 p-6 text-[#f6efe6] shadow-2xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <BrandMark className="size-20" />
          <h1 className="mt-4 font-display text-4xl">Vizioon Brew</h1>
        </div>
        <div className="mt-8 [&_input]:h-12 [&_input]:border-white/15 [&_input]:bg-black/25 [&_input]:text-base [&_input]:text-[#f6efe6] [&_label]:text-base">
          <LoginForm error={error} />
        </div>
      </section>
    </div>
  );
}
