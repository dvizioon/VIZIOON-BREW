import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="font-display text-3xl">Página não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">O endereço não corresponde a uma tela da plataforma.</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary">
        Voltar ao início
      </Link>
    </div>
  );
}
