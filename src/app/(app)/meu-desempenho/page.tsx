import type { Metadata } from "next";
import Link from "next/link";
import { ModuleChart, ScoreChart } from "@/components/charts";
import { Badge, Card, Progress, Stat } from "@/components/ui";
import { requireIntern } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getInternReport } from "@/lib/reports";
import { formatDate, formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Meu desempenho" };

export default async function PerformancePage() {
  const user = await requireIntern();
  const [report, desafios] = await Promise.all([
    getInternReport(user.id),
    prisma.labSubmission.findMany({
      where: { userId: user.id, score: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
      include: { challenge: true },
    }),
  ]);
  if (!report) return null;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Tempo estimado" value={formatMinutes(report.studyMinutes)} />
        <Stat label="Média das notas" value={report.averageScore == null ? "Sem notas" : `${report.averageScore}%`} />
        <Stat label="Aderência à receita" value={report.adherence == null ? "Sem receita" : `${report.adherence}%`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ScoreChart data={report.scoreSeries} />
        <ModuleChart data={report.moduleAccuracy} />
      </div>
      <section className="mt-6 grid gap-3">
        <h2 className="font-medium">Progresso por módulo</h2>
        {report.moduleRows.map((module) => (
          <Card key={module.id} className="p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{module.blend}</p>
                <p className="font-medium">{module.title}</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {module.completed}/{module.total}
                {module.averageScore == null ? "" : ` · média ${module.averageScore}%`}
              </span>
            </div>
            <Progress value={module.percent} />
          </Card>
        ))}
      </section>
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Notas</h2>
        {report.attempts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tentativa ainda.</p> : null}
        <ul className="grid gap-2">
          {report.attempts.map((attempt) => (
            <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <span>
                {attempt.lessonTitle}
                <span className="block text-xs text-muted-foreground">{attempt.moduleTitle}</span>
              </span>
              <span>
                {attempt.score}% · {formatDate(attempt.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Lab</h2>
        {desafios.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum desafio avaliado.</p> : null}
        <ul className="grid gap-2">
          {desafios.map((item) => (
            <li key={item.id}>
              <Link href={`/lab/${item.challengeId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <span>{item.challenge.title}</span>
                <span>
                  Nota {item.score} · {formatDate(item.reviewedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-medium">Próxima dose</h2>
          {report.nextLesson ? (
            <Link href={`/aulas/${report.nextLesson.id}`} className="mt-2 block text-sm hover:underline">
              {report.nextLesson.title}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Nada pendente nos blends.</p>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="font-medium">Atrasos</h2>
          {report.overdue.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhuma dose atrasada.</p> : null}
          <ul className="mt-2 grid gap-2">
            {report.overdue.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/aulas/${item.lessonId}`}>{item.lessonTitle}</Link>
                <Badge tone="bad">Atrasado</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
