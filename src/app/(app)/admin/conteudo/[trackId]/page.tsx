import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createModule, deleteTrack, updateTrack } from "@/actions/content";
import { ActionForm, SubmitButton } from "@/components/form";
import { SortableList } from "@/components/sortable-list";
import { Badge, Card, Field, Input, PageHeader, Textarea, Toggle } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Blend" };

const tabs = [
  { id: "modulos", label: "Módulos" },
  { id: "novo", label: "Novo módulo" },
  { id: "dados", label: "Dados" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function currentTab(value: string | undefined): TabId {
  return tabs.some((tab) => tab.id === value) ? (value as TabId) : "modulos";
}

export default async function TrackEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  await requireAdmin();
  const { trackId } = await params;
  const { aba } = await searchParams;
  const tab = currentTab(aba);
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: true } } },
      },
    },
  });
  if (!track) notFound();

  return (
    <div>
      <Link href="/admin/conteudo" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Conteúdo
      </Link>
      <PageHeader
        title={track.title}
        description="Módulos deste blend."
        action={<Badge tone={track.published ? "good" : "warn"}>{track.published ? "Publicado" : "Rascunho"}</Badge>}
      />
      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/admin/conteudo/${track.id}?aba=${item.id}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "modulos" ? (
        track.modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum módulo ainda. Use Novo módulo.</p>
        ) : (
          <SortableList
            kind="modulos"
            parentId={track.id}
            items={track.modules.map((item) => ({
              id: item.id,
              href: `/admin/conteudo/${track.id}/modulos/${item.id}`,
              title: item.title,
              meta: item._count.lessons === 1 ? "1 dose" : `${item._count.lessons} doses`,
            }))}
          />
        )
      ) : null}

      {tab === "novo" ? (
        <Card className="p-5">
          <ActionForm action={createModule} className="grid gap-3">
            <input type="hidden" name="trackId" value={track.id} />
            <input type="hidden" name="order" value="1" />
            <Field label="Título">
              <Input name="title" required />
            </Field>
            <Field label="Descrição">
              <Textarea name="description" />
            </Field>
            <SubmitButton>Criar e abrir</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      {tab === "dados" ? (
        <Card className="grid gap-4 p-5">
          <ActionForm action={updateTrack} className="grid gap-3">
            <input type="hidden" name="id" value={track.id} />
            <Field label="Título">
              <Input name="title" defaultValue={track.title} required />
            </Field>
            <Field label="Descrição">
              <Textarea name="description" defaultValue={track.description} required />
            </Field>
            <Toggle name="published" label="Publicado" defaultChecked={track.published} />
            <SubmitButton variant="secondary">Salvar blend</SubmitButton>
          </ActionForm>
          <ActionForm action={deleteTrack}>
            <input type="hidden" name="id" value={track.id} />
            <SubmitButton variant="destructive" confirm="Excluir este blend e todo o conteúdo dele?">
              Excluir blend
            </SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
