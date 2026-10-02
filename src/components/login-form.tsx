"use client";

import { SubmitButton } from "@/components/form";
import { Field, Input } from "@/components/ui";

export function LoginForm({ error }: { error?: string }) {
  return (
    <form action="/api/auth/login" method="post" className="grid gap-5">
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
      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}
