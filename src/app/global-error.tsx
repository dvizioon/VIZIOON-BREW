"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "sans-serif", padding: 32 }}>
        <h1>Algo saiu do esperado</h1>
        <p>Atualize a página ou tente novamente.</p>
        <button type="button" onClick={reset}>
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
