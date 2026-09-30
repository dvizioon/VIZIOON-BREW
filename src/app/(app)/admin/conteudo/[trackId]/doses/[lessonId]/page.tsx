import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  createPractical,
  createQuestion,
  deleteLesson,
  deleteMaterial,
  deleteQuestion,
  updateLesson,
  uploadMaterial,
} from "@/actions/content";
import { ActionForm, SubmitButton } from "@/components/form";
import { LessonPreview } from "@/components/lesson-preview";
import { Card, Field, Input, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { cn, lessonTypeLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Dose" };

const tabs = [
  { id: "dose", label: "Dose" },
  { id: "materiais", label: "Materiais" },
  { id: "questao", label: "Questão" },
  { id: "pratica", label: "Prática" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function currentTab(value: string | undefined): TabId {
  return tabs.some((tab) => tab.id === value) ? (value as TabId) : "dose";
}

export default async function LessonEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string; lessonId: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  await requireAdmin();
  const { trackId, lessonId } = await params;
  const { aba } = await searchParams;
  const tab = currentTab(aba);
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { track: true } },
      materials: { orderBy: { createdAt: "asc" } },
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
    },
  });
  if (!lesson || lesson.module.trackId !== trackId) notFound();

  const choices = lesson.questions.filter((question) => question.type === "MULTIPLA");
  const practicals = lesson.questions.filter((question) => question.type === "PRATICA");

  return (
    <div>
      <Link
        href={`/admin/conteudo/${lesson.module.trackId}/modulos/${lesson.moduleId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        {lesson.module.title}
      </Link>
      <PageHeader title={lesson.title} description={`${lessonTypeLabel(lesson.type)} · ${lesson.durationMinutes} min`} />
      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/admin/conteudo/${lesson.module.trackId}/doses/${lesson.id}?aba=${item.id}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "dose" ? (
        <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="grid gap-4 p-5">
          <ActionForm id="dose-form" action={updateLesson} className="grid gap-3">
            <input type="hidden" name="id" value={lesson.id} />
            <Field label="Título">
              <Input name="title" defaultValue={lesson.title} required />
            </Field>
            <Field label="Descrição em Markdown">
              <Textarea name="description" defaultValue={lesson.description} />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Duração (min)">
                <Input name="durationMinutes" type="number" min={1} defaultValue={lesson.durationMinutes} required />
              </Field>
              <Field label="Tipo">
                <Select name="type" defaultValue={lesson.type}>
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
              defaultChecked={lesson.consultaAtiva}
            />
            <Field label="Link do vídeo" hint="YouTube, Vimeo ou o embed de outra plataforma. Um arquivo novo substitui o link.">
              <Input name="videoUrl" defaultValue={lesson.videoUrl ?? ""} placeholder="https://" />
            </Field>
            <Field label="Arquivo de vídeo">
              <Input name="videoFile" type="file" accept="video/mp4,video/webm" />
            </Field>
            {lesson.videoPath ? (
              <Toggle name="removeVideo" label="Remover vídeo" hint="Há um vídeo enviado para esta dose." />
            ) : null}
            <Field label="Conteúdo incorporado" hint="Outro site ou iframe. Pode abrir na página ou numa janela.">
              <Input name="embedUrl" defaultValue={lesson.embedUrl ?? ""} placeholder="https://" />
            </Field>
            <Field label="Onde abrir">
              <Select name="embedMode" defaultValue={lesson.embedMode === "modal" ? "modal" : "local"}>
                <option value="local">Na página</option>
                <option value="modal">Numa janela</option>
              </Select>
            </Field>
            <SubmitButton variant="secondary">Salvar dose</SubmitButton>
          </ActionForm>
          <ActionForm action={deleteLesson}>
            <input type="hidden" name="id" value={lesson.id} />
            <SubmitButton variant="destructive" confirm="Excluir esta dose?">
              Excluir dose
            </SubmitButton>
          </ActionForm>
        </Card>
        <LessonPreview
          formId="dose-form"
          lessonId={lesson.id}
          trackTitle={lesson.module.track.title}
          moduleTitle={lesson.module.title}
          hasVideoFile={Boolean(lesson.videoPath)}
        />
        </div>
      ) : null}

      {tab === "materiais" ? (
        <Card className="grid gap-4 p-5">
          {lesson.materials.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum material ainda.</p> : null}
          {lesson.materials.map((material) => (
            <div key={material.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{material.title}</span>
              <ActionForm action={deleteMaterial}>
                <input type="hidden" name="id" value={material.id} />
                <SubmitButton variant="ghost" confirm="Excluir este material?">
                  Excluir
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          <ActionForm action={uploadMaterial} resetOnSuccess className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <Input name="title" placeholder="Título do material" required />
            <Input name="file" type="file" required />
            <SubmitButton variant="outline">Enviar</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      {tab === "questao" ? (
        <div className="grid gap-4">
          {choices.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma questão de alternativas ainda.</p> : null}
          {choices.map((question) => (
            <Card key={question.id} className="p-4 text-sm">
              <p className="font-medium">{question.prompt}</p>
              <ul className="mt-2">
                {question.options.map((option) => (
                  <li key={option.id} className={option.isCorrect ? "font-medium" : ""}>
                    {option.text}
                    {option.isCorrect ? " (correta)" : ""}
                  </li>
                ))}
              </ul>
              <ActionForm action={deleteQuestion} className="mt-2">
                <input type="hidden" name="id" value={question.id} />
                <SubmitButton variant="ghost" confirm="Excluir esta questão?">
                  Excluir questão
                </SubmitButton>
              </ActionForm>
            </Card>
          ))}
          <Card className="p-5">
            <h2 className="mb-3 font-medium">Nova questão</h2>
            <ActionForm action={createQuestion} resetOnSuccess className="grid gap-3">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <Textarea name="prompt" placeholder="Enunciado" required />
              <Textarea name="explanation" placeholder="Explicação do gabarito" />
              {[0, 1, 2, 3].map((index) => (
                <Input key={index} name={`option${index}`} placeholder={`Alternativa ${index + 1}`} />
              ))}
              <Field label="Alternativa correta" hint="0 é a primeira alternativa e 1 é a segunda.">
                <Input name="correctIndex" type="number" min={0} max={3} defaultValue={0} required />
              </Field>
              <SubmitButton variant="outline">Adicionar questão</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      ) : null}

      {tab === "pratica" ? (
        <div className="grid gap-4">
          {practicals.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum exercício prático ainda.</p> : null}
          {practicals.map((question) => (
            <Card key={question.id} className="p-4 text-sm">
              <p className="font-medium">{question.prompt}</p>
              <p className="mt-1 text-muted-foreground">{question.repoUrl}</p>
              <ActionForm action={deleteQuestion} className="mt-2">
                <input type="hidden" name="id" value={question.id} />
                <SubmitButton variant="ghost" confirm="Excluir este exercício?">
                  Excluir exercício
                </SubmitButton>
              </ActionForm>
            </Card>
          ))}
          <Card className="p-5">
            <h2 className="mb-3 font-medium">Novo exercício</h2>
            <ActionForm action={createPractical} resetOnSuccess className="grid gap-3">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <Textarea name="prompt" placeholder="Enunciado" required />
              <Input name="repoUrl" type="url" placeholder="https://github.com/..." required />
              <Textarea name="explanation" placeholder="Orientação" />
              <SubmitButton variant="outline">Adicionar prática</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
