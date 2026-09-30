"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { changePassword, logoutAction } from "@/actions/auth";
import { SubmitButton } from "@/components/form";
import { Card, Field, Input } from "@/components/ui";

export function PasswordForm() {
  const router = useRouter();
  const { data, update, status } = useSession();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setError("");
    const result = await changePassword(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    await update({ mustChangePassword: false });
    router.push("/");
    router.refresh();
  }

  const forced = data?.user?.mustChangePassword;

  return (
    <Card className="w-full max-w-md p-6">
      <h1 className="font-display text-3xl">{forced ? "Defina sua senha" : "Alterar senha"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {forced
          ? "Este é o primeiro acesso. Troque a senha inicial para continuar."
          : "Use a senha atual para confirmar a troca."}
      </p>
      {status === "loading" ? <p className="mt-6 text-sm text-muted-foreground">Carregando...</p> : null}
      <form action={onSubmit} className="mt-6 grid gap-4">
        <Field label="Senha atual">
          <Input name="currentPassword" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="Nova senha" hint="Mínimo de 8 caracteres, com letra e número.">
          <Input name="newPassword" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Confirmar nova senha">
          <Input name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <SubmitButton>Salvar senha</SubmitButton>
      </form>
      <form action={logoutAction} className="mt-4">
        <button type="submit" className="text-sm text-muted-foreground">
          Sair
        </button>
      </form>
    </Card>
  );
}
