"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="font-display text-3xl">Algo saiu do esperado</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tente novamente em instantes.</p>
      <button type="button" className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={reset}>
        Tentar de novo
      </button>
    </div>
  );
}
