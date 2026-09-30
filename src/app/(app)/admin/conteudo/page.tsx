import type { Metadata } from "next";
import Link from "next/link";
import { createTrack } from "@/actions/content";
import { ActionForm, SubmitButton } from "@/components/form";
import { Badge, Card, Field, Input, Textarea, Toggle } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Conteúdo" };

export default async function ContentPage() {
  await requireAdmin();
  const tracks = await prisma.track.findMany({
    orderBy: { title: "asc" },
    include: {
      modules: { select: { _count: { select: { lessons: true } } } },
    },
  });

  return (
    <div>
      <Card className="p-5">
        <h2 className="font-medium">Novo blend</h2>
        <ActionForm action={createTrack} className="mt-4 grid gap-3">
          <Field label="Título">
            <Input name="title" required />
          </Field>
          <Field label="Descrição">
            <Textarea name="description" required />
          </Field>
          <Toggle name="published" label="Publicado" defaultChecked />
          <SubmitButton>Criar e abrir</SubmitButton>
        </ActionForm>
      </Card>

      <div className="mt-6 grid gap-3">
        {tracks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum blend ainda.</p> : null}
        {tracks.map((track) => {
          const lessons = track.modules.reduce((total, item) => total + item._count.lessons, 0);
          return (
            <Card key={track.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/admin/conteudo/${track.id}`} className="min-w-0">
                  <h2 className="font-display text-2xl">{track.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {track.modules.length === 1 ? "1 módulo" : `${track.modules.length} módulos`}
                    {" · "}
                    {lessons === 1 ? "1 dose" : `${lessons} doses`}
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/trilhas/${track.id}`}
                    className="inline-flex h-8 items-center rounded-xl border border-border bg-card px-3 text-xs font-medium hover:bg-accent"
                  >
                    Pré-visualizar
                  </Link>
                  <Badge tone={track.published ? "good" : "warn"}>{track.published ? "Publicado" : "Rascunho"}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
