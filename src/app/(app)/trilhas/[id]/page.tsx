import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { Card, PageHeader, Progress, ProgressRing } from "@/components/ui";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { lessonTypeLabel } from "@/lib/utils";
import { progressPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Blend" };

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { progress: { where: { userId: user.id } } },
          },
          activities: {
            orderBy: { order: "asc" },
            include: { deliveries: { where: { userId: user.id, passed: true }, take: 1 } },
          },
        },
      },
    },
  });
  if (!track || (user.role !== "ADMIN" && !track.published)) notFound();

  const lessons = track.modules.flatMap((module) => module.lessons);
  const completed = lessons.filter((lesson) => lesson.progress.some((item) => item.completed)).length;
  const percent = progressPercent(completed, lessons.length);

  return (
    <div>
      <Link href="/trilhas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Blends
      </Link>
      <PageHeader title={track.title} description={track.description} />
      {user.role === "ESTAGIARIO" ? (
        <Card className="mb-6 p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span>Progresso do blend</span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} />
        </Card>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">Pré-visualização do tech lead.</p>
      )}
      <div className="grid gap-4">
        {track.modules.map((module) => {
          const lessonDone = module.lessons.filter((lesson) => lesson.progress.some((item) => item.completed)).length;
          const activityDone = module.activities.filter((activity) => activity.deliveries.length > 0).length;
          const modulePercent = progressPercent(lessonDone + activityDone, module.lessons.length + module.activities.length);
          return (
          <Card key={module.id} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">
                  Módulo {module.order}. {module.title}
                </h2>
                {module.description ? <p className="mt-1 text-sm text-muted-foreground">{module.description}</p> : null}
              </div>
              <ProgressRing value={modulePercent} />
            </div>
            <ul className="mt-4 grid gap-2">
              {module.lessons.map((lesson) => {
                const done = lesson.progress.some((item) => item.completed);
                const lessonPercent = done ? 100 : 0;
                return (
                  <li key={lesson.id}>
                    <Link href={`/aulas/${lesson.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 hover:bg-accent">
                      <span className="flex items-center gap-3">
                        <span className={`flex size-6 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {done ? <Check className="size-3.5" /> : null}
                        </span>
                        <span>
                          <span className="block font-medium">{lesson.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {lesson.durationMinutes} min · {lesson.type === "CONSULTA" && lesson.consultaAtiva ? "Consulta ativa" : lessonTypeLabel(lesson.type)}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm font-medium">{lessonPercent}%</span>
                    </Link>
                  </li>
                );
              })}
              {module.activities.map((activity) => {
                const done = activity.deliveries.length > 0;
                return (
                  <li key={activity.id}>
                    <Link href={`/atividades/${activity.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 hover:bg-accent">
                      <span className="flex items-center gap-3">
                        <span className={`flex size-6 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {done ? <Check className="size-3.5" /> : null}
                        </span>
                        <span>
                          <span className="block font-medium">{activity.title}</span>
                          <span className="text-xs text-muted-foreground">Atividade</span>
                        </span>
                      </span>
                      <span className="text-sm font-medium">{done ? 100 : 0}%</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
