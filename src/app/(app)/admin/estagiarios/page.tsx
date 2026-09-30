import type { Metadata } from "next";
import Link from "next/link";
import { createIntern } from "@/actions/users";
import { InternProfileButton } from "@/components/profile-dialogs";
import { ActionForm, SubmitButton } from "@/components/form";
import { Card, Field, Input, Table, Td, Th } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Estagiários" };

const pageSize = 20;

export default async function InternsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const requested = Number(params.page);
  const page = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
  const where = { role: "ESTAGIARIO" as const };
  const [total, interns] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, lastAccessAt: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <Card className="mb-6 p-5">
        <h2 className="mb-5 font-medium">Novo estagiário</h2>
        <ActionForm action={createIntern} resetOnSuccess className="grid max-w-xl gap-5">
          <Field label="Nome">
            <Input name="name" required />
          </Field>
          <Field label="E-mail">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Senha inicial" hint="Mínimo de 8 caracteres, com letra e número.">
            <Input name="password" type="text" required />
          </Field>
          <SubmitButton>Criar estagiário</SubmitButton>
        </ActionForm>
      </Card>
      <Table>
        <thead className="bg-muted/60">
          <tr>
            <Th>Nome</Th>
            <Th>E-mail</Th>
            <Th>Último acesso</Th>
            <Th>Perfil</Th>
          </tr>
        </thead>
        <tbody>
          {interns.length === 0 ? (
            <tr>
              <Td colSpan={4} className="text-muted-foreground">
                Nenhum estagiário ainda.
              </Td>
            </tr>
          ) : null}
          {interns.map((intern) => (
            <tr key={intern.id}>
              <Td>{intern.name}</Td>
              <Td>{intern.email}</Td>
              <Td>{formatDate(intern.lastAccessAt)}</Td>
              <Td>
                <InternProfileButton id={intern.id} name={intern.name} email={intern.email} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {pages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {total} estagiários, página {Math.min(page, pages)} de {pages}
          </span>
          <div className="flex gap-3">
            {page > 1 ? (
              <Link href={`/admin/estagiarios?page=${page - 1}`} className="text-primary hover:underline">
                Anterior
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={`/admin/estagiarios?page=${page + 1}`} className="text-primary hover:underline">
                Próxima
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
