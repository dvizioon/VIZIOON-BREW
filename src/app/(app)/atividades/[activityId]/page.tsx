import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ActivityForm } from "@/components/activity-form";
import { Badge, PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Atividade" };

export default async function ActivityPage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  const user = await getSessionUser();
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      module: { include: { track: true } },
      questions: { orderBy: { order: "asc" }, include: { cases: { select: { id: true } } } },
      deliveries: { where: { userId: user.id, passed: true }, take: 1 },
    },
  });
  if (!activity || (user.role !== "ADMIN" && !activity.module.track.published)) notFound();
  if (user.role === "ADMIN") {
    return (
      <div>
        <PageHeader title={activity.title} description="A entrega é do estagiário. Abra a atividade no conteúdo para editar as questões." />
      </div>
    );
  }

  return (
    <div>
      <Link href={`/trilhas/${activity.module.trackId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        {activity.module.track.title}
      </Link>
      <PageHeader
        title={activity.title}
        description={activity.description || activity.module.title}
        action={activity.deliveries.length > 0 ? <Badge tone="good">Concluída</Badge> : null}
      />
      {activity.questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Esta atividade ainda não tem questões.</p>
      ) : (
        <ActivityForm
          activityId={activity.id}
          done={activity.deliveries.length > 0}
          questions={activity.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            language: question.language,
            starterCode: question.starterCode,
            caseCount: question.cases.length,
          }))}
        />
      )}
    </div>
  );
}
