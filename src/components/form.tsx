"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/actions/auth";

export function SubmitButton({
  children,
  variant = "default",
  confirm,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  confirm?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      className={cn("mt-2 justify-self-start", className)}
      disabled={pending || disabled}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending ? "Aguarde..." : children}
    </Button>
  );
}

export function ActionForm({
  action,
  children,
  className,
  id,
  resetOnSuccess = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  id?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset();
  }, [resetOnSuccess, state.ok]);

  return (
    <form ref={ref} id={id} action={formAction} className={className}>
      {children}
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
