"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";

export function LoginForm({ error: initialError }: { error?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      setPending(false);
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.replace(result?.url || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <Field label="E-mail">
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Senha">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="mt-2 justify-self-start" disabled={pending}>
        {pending ? "Aguarde..." : "Entrar"}
      </Button>
    </form>
  );
}
