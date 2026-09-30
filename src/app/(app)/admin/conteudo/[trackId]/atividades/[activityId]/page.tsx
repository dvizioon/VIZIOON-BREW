import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { deleteActivity, deleteActivityQuestion } from "@/actions/activities";
import { ActivityQuestionForm } from "@/components/activity-question-form";
import { ActionForm, SubmitButton } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Atividade" };

export default async function ActivityEditorPage({
  params,
}: {
  params: Promise<{ trackId: string; activityId: string }>;
}) {
  await requireAdmin();
  const { trackId, activityId } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      module: true,
      questions: { orderBy: { order: "asc" }, include: { cases: true } },
    },
  });
  if (!activity || activity.module.trackId !== trackId) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/admin/conteudo/${trackId}/modulos/${activity.moduleId}?aba=atividades`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="size-4" />
          {activity.module.title}
        </Link>
        <PageHeader title={activity.title} description={activity.description || "Questões de código entregues na plataforma."} />
      </div>
      <ul className="grid gap-3">
        {activity.questions.map((question, index) => (
          <li key={question.id}>
            <Card className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Questão {index + 1} · {question.language === "python" ? "Python" : "Java"} · {question.cases.length} testes
                </p>
                <p className="mt-1 whitespace-pre-wrap">{question.prompt}</p>
              </div>
              <ActionForm action={deleteActivityQuestion}>
                <input type="hidden" name="id" value={question.id} />
                <SubmitButton variant="outline">Excluir</SubmitButton>
              </ActionForm>
            </Card>
          </li>
        ))}
      </ul>
      <Card className="p-5">
        <h2 className="font-display text-2xl">Nova questão</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O estagiário escreve o código. A entrega só passa se todos os testes passarem. A saída esperada fica no servidor.
        </p>
        <ActivityQuestionForm activityId={activity.id} />
      </Card>
      <ActionForm action={deleteActivity}>
        <input type="hidden" name="id" value={activity.id} />
        <SubmitButton variant="destructive" confirm="Excluir esta atividade?">
          Excluir atividade
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
