import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createActivity } from "@/actions/activities";
import { createLesson, deleteModule, updateModule } from "@/actions/content";
import { ActionForm, SubmitButton } from "@/components/form";
import { SortableList } from "@/components/sortable-list";
import { Card, Field, Input, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { cn, lessonTypeLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Módulo" };

const tabs = [
  { id: "doses", label: "Doses" },
  { id: "nova", label: "Nova dose" },
  { id: "atividades", label: "Atividades" },
  { id: "nova-atividade", label: "Nova atividade" },
  { id: "dados", label: "Dados" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function currentTab(value: string | undefined): TabId {
  return tabs.some((tab) => tab.id === value) ? (value as TabId) : "doses";
}

export default async function ModuleEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string; moduleId: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  await requireAdmin();
  const { trackId, moduleId } = await params;
  const { aba } = await searchParams;
  const tab = currentTab(aba);
  const current = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      track: true,
      lessons: { orderBy: { order: "asc" } },
      activities: { orderBy: { order: "asc" } },
    },
  });
  if (!current || current.trackId !== trackId) notFound();

  return (
    <div>
      <Link href={`/admin/conteudo/${current.trackId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        {current.track.title}
      </Link>
      <PageHeader title={current.title} description={`Módulo ${current.order}`} />
      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/admin/conteudo/${current.trackId}/modulos/${current.id}?aba=${item.id}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "doses" ? (
        current.lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma dose ainda. Use Nova dose.</p>
        ) : (
          <SortableList
            kind="doses"
            parentId={current.id}
            items={current.lessons.map((lesson) => ({
              id: lesson.id,
              href: `/admin/conteudo/${current.trackId}/doses/${lesson.id}`,
              title: lesson.title,
              meta: `${lesson.type === "CONSULTA" && lesson.consultaAtiva ? "Consulta ativa" : lessonTypeLabel(lesson.type)} · ${lesson.durationMinutes} min`,
            }))}
          />
        )
      ) : null}

      {tab === "atividades" ? (
        current.activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade ainda. Use Nova atividade.</p>
        ) : (
          <SortableList
            kind="atividades"
            parentId={current.id}
            items={current.activities.map((activity) => ({
              id: activity.id,
              href: `/admin/conteudo/${current.trackId}/atividades/${activity.id}`,
              title: activity.title,
              meta: "Entrega na plataforma",
            }))}
          />
        )
      ) : null}

      {tab === "nova-atividade" ? (
        <Card className="p-5">
          <ActionForm action={createActivity} className="grid gap-3">
            <input type="hidden" name="moduleId" value={current.id} />
            <Field label="Título">
              <Input name="title" placeholder="Calculadora" required />
            </Field>
            <Field label="Descrição">
              <Textarea name="description" placeholder="O que o estagiário vai entregar." />
            </Field>
            <SubmitButton>Criar e abrir</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      {tab === "nova" ? (
        <Card className="p-5">
          <ActionForm action={createLesson} className="grid gap-3">
            <input type="hidden" name="moduleId" value={current.id} />
            <input type="hidden" name="order" value="1" />
            <Field label="Título">
              <Input name="title" required />
            </Field>
            <Field label="Descrição em Markdown">
              <Textarea name="description" />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Duração (min)">
                <Input name="durationMinutes" type="number" min={1} defaultValue={20} required />
              </Field>
              <Field label="Tipo">
                <Select name="type" defaultValue="LEITURA">
                  <option value="VIDEO">Vídeo</option>
                  <option value="LEITURA">Leitura</option>
                  <option value="PRATICA">Prática</option>
                  <option value="CONSULTA">Consulta</option>
                </Select>
              </Field>
            </div>
            <Toggle
              name="consultaAtiva"
              label="Consulta ativa"
              hint="Na consulta, o aluno marca como feita. Na ativa, uma nota a partir de 70% também conclui."
            />
            <Field label="Link do vídeo" hint="YouTube, Vimeo ou o embed de outra plataforma. Um arquivo novo substitui o link.">
              <Input name="videoUrl" placeholder="https://" />
            </Field>
            <Field label="Conteúdo incorporado" hint="Outro site ou iframe.">
              <Input name="embedUrl" placeholder="https://" />
            </Field>
            <Field label="Onde abrir">
              <Select name="embedMode" defaultValue="local">
                <option value="local">Na página</option>
                <option value="modal">Numa janela</option>
              </Select>
            </Field>
            <Field label="Arquivo de vídeo">
              <Input name="videoFile" type="file" accept="video/mp4,video/webm" />
            </Field>
            <SubmitButton>Criar e abrir</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      {tab === "dados" ? (
        <Card className="grid gap-4 p-5">
          <ActionForm action={updateModule} className="grid gap-3">
            <input type="hidden" name="id" value={current.id} />
            <Field label="Título">
              <Input name="title" defaultValue={current.title} required />
            </Field>
            <Field label="Descrição">
              <Textarea name="description" defaultValue={current.description} />
            </Field>
            <SubmitButton variant="secondary">Salvar módulo</SubmitButton>
          </ActionForm>
          <ActionForm action={deleteModule}>
            <input type="hidden" name="id" value={current.id} />
            <SubmitButton variant="destructive" confirm="Excluir este módulo e as doses dele?">
              Excluir módulo
            </SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
