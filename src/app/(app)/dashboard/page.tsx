import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Empty, PageHeader, Progress, Stat } from "@/components/ui";
import { requireIntern } from "@/lib/guards";
import { getTracksForUser, summarizeTrack } from "@/lib/learning";
import { getInternReport } from "@/lib/reports";
import { formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

export default async function DashboardPage() {
  const user = await requireIntern();
  const [tracks, report] = await Promise.all([
    getTracksForUser(user.id, false),
    getInternReport(user.id),
  ]);
  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <PageHeader title={`Olá, ${firstName}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Tempo estimado" value={formatMinutes(report?.studyMinutes ?? 0)} hint="Soma da duração das doses concluídas." />
        <Stat label="Média das notas" value={report?.averageScore == null ? "Sem notas" : `${report.averageScore}%`} />
        <Stat label="Doses atrasadas" value={String(report?.overdue.length ?? 0)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-medium">Blends</h2>
          <div className="mt-4 grid gap-4">
            {tracks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum blend publicado ainda.</p> : null}
            {tracks.map((track) => {
              const summary = summarizeTrack(track);
              return (
                <Link key={track.id} href={`/trilhas/${track.id}`} className="grid gap-2 rounded-xl border border-border p-3 hover:bg-accent">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-medium">{track.title}</span>
                    <span className="text-sm text-muted-foreground">{summary.percent}%</span>
                  </span>
                  <Progress value={summary.percent} />
                </Link>
              );
            })}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-medium">Próximo passo</h2>
          {report?.nextLesson ? (
            <Link href={`/aulas/${report.nextLesson.id}`} className="mt-4 block rounded-xl border border-border p-4 hover:bg-accent">
              <p className="text-xs text-muted-foreground">
                {report.nextLesson.blend} / {report.nextLesson.module}
              </p>
              <p className="mt-1 font-medium">{report.nextLesson.title}</p>
            </Link>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Você concluiu as doses publicadas.</p>
          )}
          <h3 className="mt-6 text-sm font-medium">Atrasos da receita</h3>
          <div className="mt-3 grid gap-2">
            {report && report.overdue.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma dose atrasada.</p> : null}
            {report?.overdue.map((item) => (
              <Link key={item.id} href={`/aulas/${item.lessonId}`} className="flex items-center justify-between gap-3 text-sm">
                <span>{item.lessonTitle}</span>
                <Badge tone="bad">Atrasado</Badge>
              </Link>
            ))}
          </div>
        </Card>
      </div>
      {!report ? <Empty>Não foi possível montar o painel.</Empty> : null}
    </div>
  );
}
