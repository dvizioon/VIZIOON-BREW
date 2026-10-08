import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { submitLabZip, updateChallenge } from "@/actions/lab";
import { ActionForm, SubmitButton } from "@/components/form";
import { LabPreview } from "@/components/lab-preview";
import { LabReview } from "@/components/lab-review";
import { Markdown } from "@/components/markdown";
import { Badge, Card, Field, Input, PageHeader, Table, Td, Textarea, Th, Toggle } from "@/components/ui";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Desafio" };

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      submissions: {
        where: user.role === "ADMIN" ? {} : { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!challenge || (user.role !== "ADMIN" && !challenge.published)) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/lab" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="size-4" />
          Lab
        </Link>
        <PageHeader
          title={challenge.title}
          description={
            user.role === "ADMIN"
              ? "Edite as especificações e veja ao lado como o estagiário lê o desafio."
              : "As especificações estão abaixo. O estagiário envia um zip com o código."
          }
          action={<Badge tone={challenge.published ? "good" : "warn"}>{challenge.published ? "Lançado" : "Rascunho"}</Badge>}
        />
      </div>
      {user.role === "ADMIN" ? (
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
          <Card className="min-w-0 p-5">
            <h2 className="font-display text-xl">Especificações</h2>
            <ActionForm id="challenge-form" action={updateChallenge} className="mt-5 grid gap-5">
              <input type="hidden" name="id" value={challenge.id} />
              <Field label="Título">
                <Input name="title" defaultValue={challenge.title} required />
              </Field>
              <Field label="Especificações" hint="Markdown. É o que o estagiário lê antes de enviar o zip.">
                <Textarea name="prompt" defaultValue={challenge.prompt} required className="min-h-80 font-mono text-sm" />
              </Field>
              <Toggle name="published" label="Lançado para os estagiários" defaultChecked={challenge.published} />
              <SubmitButton>Salvar desafio</SubmitButton>
            </ActionForm>
          </Card>
          <LabPreview formId="challenge-form" />
        </div>
      ) : (
        <Card className="p-5">
          <h2 className="font-display text-xl">Especificações</h2>
          <div className="mt-3">
            <Markdown source={challenge.prompt} />
          </div>
        </Card>
      )}
      {user.role === "ESTAGIARIO" ? (
        <Card className="p-5">
          <h2 className="font-display text-xl">Enviar código</h2>
          <p className="mt-1 text-sm text-muted-foreground">Só zip. Um envio novo não apaga os anteriores.</p>
          <ActionForm action={submitLabZip} className="mt-5 grid gap-5">
            <input type="hidden" name="challengeId" value={challenge.id} />
            <Field label="Arquivo zip">
              <Input name="zip" type="file" accept=".zip,application/zip" required />
            </Field>
            <SubmitButton>Enviar zip</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
      <section className="grid gap-4">
        <h2 className="font-display text-xl">{user.role === "ADMIN" ? "Entregas" : "Seus envios"}</h2>
        <Table>
          <thead className="bg-muted/60">
            <tr>
              {user.role === "ADMIN" ? <Th>Estagiário</Th> : null}
              <Th>Enviado</Th>
              <Th>Arquivo</Th>
              <Th>Nota</Th>
              {user.role === "ADMIN" ? <Th>Avaliação</Th> : null}
            </tr>
          </thead>
          <tbody>
            {challenge.submissions.length === 0 ? (
              <tr>
                <Td colSpan={user.role === "ADMIN" ? 5 : 3} className="text-muted-foreground">
                  Nenhum zip ainda.
                </Td>
              </tr>
            ) : null}
            {challenge.submissions.map((item) => (
              <tr key={item.id}>
                {user.role === "ADMIN" ? <Td>{item.user.name}</Td> : null}
                <Td>{formatDate(item.createdAt)}</Td>
                <Td>
                  <a href={`/api/lab/${item.id}`} className="underline">
                    {item.fileName}
                  </a>
                </Td>
                <Td>
                  {item.reviewedAt ? (
                    <span>
                      {item.score}
                      {item.comment ? <span className="mt-1 block text-xs text-muted-foreground">{item.comment}</span> : null}
                    </span>
                  ) : (
                    "Aguardando"
                  )}
                </Td>
                {user.role === "ADMIN" ? (
                  <Td>
                    <LabReview id={item.id} score={item.score} comment={item.comment} />
                  </Td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
