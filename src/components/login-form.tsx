"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { SubmitButton } from "@/components/form";
import { Field, Input } from "@/components/ui";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});

  return (
    <form action={action} className="grid gap-5">
      <Field label="E-mail">
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Senha">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}
