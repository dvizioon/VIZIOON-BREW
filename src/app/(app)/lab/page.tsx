import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { createChallenge, deleteChallenge } from "@/actions/lab";
import { ActionForm, SubmitButton } from "@/components/form";
import { Badge, Card, Field, Input, Textarea, Toggle } from "@/components/ui";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Lab" };

export default async function LabPage() {
  const user = await getSessionUser();
  const challenges = await prisma.challenge.findMany({
    where: user.role === "ADMIN" ? {} : { published: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="grid gap-6">
      {challenges.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum desafio lançado ainda.</p>
      ) : (
        <ul className="grid gap-3">
          {challenges.map((challenge) => (
            <li key={challenge.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <Link href={`/lab/${challenge.id}`} className="flex min-w-0 items-center gap-3">
                  <FlaskConical className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{challenge.title}</span>
                    <span className="text-xs text-muted-foreground">Especificações e entrega em zip</span>
                  </span>
                </Link>
                <span className="flex items-center gap-2">
                  <Badge tone={challenge.published ? "good" : "warn"}>{challenge.published ? "Lançado" : "Rascunho"}</Badge>
                  {user.role === "ADMIN" ? (
                    <ActionForm action={deleteChallenge}>
                      <input type="hidden" name="id" value={challenge.id} />
                      <SubmitButton variant="outline">Excluir</SubmitButton>
                    </ActionForm>
                  ) : null}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {user.role === "ADMIN" ? (
        <Card className="p-5">
          <h2 className="font-display text-2xl">Novo desafio</h2>
          <ActionForm action={createChallenge} className="mt-5 grid gap-5">
            <Field label="Título">
              <Input name="title" placeholder="Calculadora" required />
            </Field>
            <Field label="Especificações" hint="Markdown. É o que o estagiário lê antes de enviar o zip.">
              <Textarea name="prompt" placeholder="Monte uma calculadora em Java e envie o projeto em zip." required />
            </Field>
            <Toggle name="published" label="Lançar para os estagiários" />
            <SubmitButton>Criar e abrir</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
