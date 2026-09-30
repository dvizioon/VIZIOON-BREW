import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, ExternalLink } from "lucide-react";
import { completeLesson, reviewPractice, submitPractice, submitQuiz } from "@/actions/learning";
import { ActionForm, SubmitButton } from "@/components/form";
import { FrameView } from "@/components/frame-view";
import { Markdown } from "@/components/markdown";
import { Badge, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { getSessionUser } from "@/lib/guards";
import { getLessonDetail } from "@/lib/learning";
import { toEmbedUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { formatBytes, formatDate, lessonTypeLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Dose" };

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tentativa?: string }>;
}) {
  const { id } = await params;
  const { tentativa } = await searchParams;
  const user = await getSessionUser();
  const lesson = await getLessonDetail(id, user.id);
  if (!lesson || (user.role !== "ADMIN" && !lesson.module.track.published)) notFound();

  const embed = toEmbedUrl(lesson.videoUrl);
  const multiple = lesson.questions.filter((question) => question.type === "MULTIPLA");
  const practical = lesson.questions.filter((question) => question.type === "PRATICA");
  const submissions = practical.length
    ? await prisma.practiceSubmission.findMany({
        where: {
          questionId: { in: practical.map((question) => question.id) },
          ...(user.role === "ADMIN" ? {} : { userId: user.id }),
        },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      })
    : [];
  const done = lesson.progress.some((item) => item.completed);
  const highlighted = lesson.attempts.find((attempt) => attempt.id === tentativa) ?? null;

  return (
    <div>
      <Link href={`/trilhas/${lesson.module.trackId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        {lesson.module.track.title}
      </Link>
      <PageHeader
        title={lesson.title}
        description={`${lesson.module.track.title} / ${lesson.module.title}`}
        action={<Badge>{lesson.type === "CONSULTA" && lesson.consultaAtiva ? "Consulta ativa" : lessonTypeLabel(lesson.type)}</Badge>}
      />
      <p className="mb-6 text-sm text-muted-foreground">Duração estimada: {lesson.durationMinutes} min</p>

      {lesson.videoPath ? (
        <video controls className="mb-6 aspect-video w-full rounded-2xl bg-black" src={`/api/videos/${lesson.id}`} />
      ) : null}
      {!lesson.videoPath && embed ? (
        <FrameView src={embed} title={lesson.title} mode="local" />
      ) : null}
      {lesson.embedUrl ? (
        <FrameView src={lesson.embedUrl} title={`${lesson.title} incorporado`} mode={lesson.embedMode === "modal" ? "modal" : "local"} />
      ) : null}

      <Card className="p-5">
        {lesson.description ? <Markdown source={lesson.description} /> : <p className="text-sm text-muted-foreground">Esta dose ainda não tem descrição.</p>}
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 font-medium">Materiais</h2>
        {lesson.materials.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum arquivo nesta dose.</p> : null}
        <ul className="grid gap-2">
          {lesson.materials.map((material) => (
            <li key={material.id}>
              <a href={`/api/materiais/${material.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-accent">
                <span className="inline-flex items-center gap-2">
                  <Download className="size-4" />
                  {material.title}
                </span>
                <span className="text-muted-foreground">{formatBytes(material.sizeBytes)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {user.role === "ADMIN" && multiple.length > 0 ? (
        <section className="mt-6 grid gap-3">
          <h2 className="font-medium">Gabarito</h2>
          {multiple.map((question, index) => (
            <Card key={question.id} className="p-4">
              <p className="font-medium">{index + 1}. {question.prompt}</p>
              <ul className="mt-2 grid gap-1 text-sm">
                {question.options.map((option) => (
                  <li key={option.id} className={option.isCorrect ? "font-medium text-emerald-700 dark:text-emerald-300" : ""}>
                    {option.text}
                    {option.isCorrect ? " (correta)" : ""}
                  </li>
                ))}
              </ul>
              {question.explanation ? <p className="mt-2 text-sm text-muted-foreground">{question.explanation}</p> : null}
            </Card>
          ))}
        </section>
      ) : null}

      {user.role === "ESTAGIARIO" && multiple.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 font-medium">Exercício</h2>
          {highlighted ? (
            <Card className="mb-4 p-4">
              <p className="font-medium">Nota desta tentativa: {Math.round(highlighted.score)}%</p>
              <div className="mt-3 grid gap-3">
                {highlighted.answers.map((answer) => {
                  const correct = answer.question.options.find((option) => option.isCorrect);
                  return (
                    <div key={answer.id} className="text-sm">
                      <p className="font-medium">{answer.question.prompt}</p>
                      <p className={answer.isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}>
                        {answer.isCorrect ? "Resposta correta." : `Resposta incorreta. A correta é: ${correct?.text ?? ""}`}
                      </p>
                      {answer.question.explanation ? <p className="text-muted-foreground">{answer.question.explanation}</p> : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}
          <ActionForm action={submitQuiz} className="grid gap-5">
            <input type="hidden" name="lessonId" value={lesson.id} />
            {multiple.map((question, index) => (
              <fieldset key={question.id} className="grid gap-2 rounded-2xl border border-border bg-card p-4">
                <legend className="px-1 font-medium">
                  {index + 1}. {question.prompt}
                </legend>
                {question.options.map((option) => (
                  <label key={option.id} className="flex items-start gap-2 text-sm">
                    <input className="mt-1" type="radio" name={`q_${question.id}`} value={option.id} required />
                    <span>{option.text}</span>
                  </label>
                ))}
              </fieldset>
            ))}
            <SubmitButton>Enviar respostas</SubmitButton>
          </ActionForm>
          {lesson.attempts.length > 0 ? (
            <ul className="mt-4 grid gap-1 text-sm text-muted-foreground">
              {lesson.attempts.map((attempt) => (
                <li key={attempt.id}>
                  {formatDate(attempt.createdAt)}: {Math.round(attempt.score)}%
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {practical.length > 0 ? (
        <section className="mt-6 grid gap-3">
          <h2 className="font-medium">Prática</h2>
          {practical.map((question) => {
            const sent = submissions.filter((item) => item.questionId === question.id);
            return (
            <Card key={question.id} className="grid gap-3 p-4">
              <p>{question.prompt}</p>
              {question.repoUrl ? (
                <a href={question.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  <ExternalLink className="size-4" />
                  Abrir repositório
                </a>
              ) : null}
              {question.explanation ? <p className="text-sm text-muted-foreground">{question.explanation}</p> : null}
              {sent.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {user.role === "ADMIN" ? `${item.user.name} · ` : ""}
                    {formatDate(item.createdAt)}
                    {item.score == null ? " · Aguardando análise" : ` · Nota ${Math.round(item.score)}%`}
                  </p>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary">
                      <ExternalLink className="size-3.5" />
                      Link enviado
                    </a>
                  ) : null}
                  {item.filePath ? (
                    <a href={`/api/praticas/${item.id}`} className="mt-1 flex items-center gap-1">
                      <Download className="size-3.5" />
                      {item.fileName || "Arquivo"}
                    </a>
                  ) : null}
                  {item.comment ? <p className="mt-2">{item.comment}</p> : null}
                  {user.role === "ADMIN" ? (
                    <ActionForm action={reviewPractice} className="mt-3 grid gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <Field label="Nota" hint="De 0 a 100. A partir de 70 a prática é aprovada.">
                        <Input name="score" type="number" min={0} max={100} defaultValue={item.score ?? ""} required />
                      </Field>
                      <Field label="Comentário">
                        <Textarea name="comment" defaultValue={item.comment} />
                      </Field>
                      <SubmitButton variant="secondary">Salvar avaliação</SubmitButton>
                    </ActionForm>
                  ) : null}
                </div>
              ))}
              {user.role === "ESTAGIARIO" ? (
                <ActionForm action={submitPractice} resetOnSuccess className="grid gap-2">
                  <input type="hidden" name="questionId" value={question.id} />
                  <Field label="Link" hint="Repositório ou página da prática. Pode ir junto com um arquivo.">
                    <Input name="link" type="url" placeholder="https://" />
                  </Field>
                  <Field label="Arquivo">
                    <Input name="file" type="file" />
                  </Field>
                  <SubmitButton variant="secondary">Enviar para análise</SubmitButton>
                </ActionForm>
              ) : null}
            </Card>
            );
          })}
        </section>
      ) : null}

      {user.role === "ESTAGIARIO" && practical.length === 0 ? (
        <Card className="mt-6 p-4">
          {done ? <p className="text-sm">Dose concluída.</p> : null}
          <ActionForm action={completeLesson} className="mt-3">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <SubmitButton variant={done ? "secondary" : "default"}>
              {done ? "Feita" : lesson.type === "CONSULTA" ? "Marcar como feita" : "Concluir dose"}
            </SubmitButton>
          </ActionForm>
          <p className="mt-2 text-xs text-muted-foreground">
            {lesson.type === "CONSULTA"
              ? lesson.consultaAtiva
                ? "Marque como feita ou seja aprovado com nota a partir de 70%."
                : "Marque a consulta como feita."
              : "Uma nota a partir de 70% também conclui a dose."}
          </p>
        </Card>
      ) : null}
      {user.role === "ESTAGIARIO" && practical.length > 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {done ? "Dose concluída." : "A dose conclui quando a prática for aprovada com nota a partir de 70%."}
        </p>
      ) : null}
    </div>
  );
}
