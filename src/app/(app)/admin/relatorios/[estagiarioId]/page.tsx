import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ModuleChart, ScoreChart } from "@/components/charts";
import { Badge, Card, PageHeader, Progress, Stat } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { getInternReport } from "@/lib/reports";
import { formatDate, formatDay, formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Relatório individual" };

const label = { concluido: "Concluído", atrasado: "Atrasado", proximo: "Próximo" } as const;
const tone = { concluido: "good", atrasado: "bad", proximo: "warn" } as const;

export default async function InternReportPage({ params }: { params: Promise<{ estagiarioId: string }> }) {
  await requireAdmin();
  const { estagiarioId } = await params;
  const report = await getInternReport(estagiarioId);
  if (!report) notFound();

  return (
    <div>
      <Link href="/admin/relatorios" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Relatórios
      </Link>
      <PageHeader title={report.user.name} description={`${report.user.email} · último acesso ${formatDate(report.user.lastAccessAt)}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Tempo estimado" value={formatMinutes(report.studyMinutes)} />
        <Stat label="Média das notas" value={report.averageScore == null ? "Sem notas" : `${report.averageScore}%`} />
        <Stat label="Aderência à receita" value={report.adherence == null ? "Sem receita" : `${report.adherence}%`} hint="Itens já vencidos ou concluídos no prazo." />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ScoreChart data={report.scoreSeries} />
        <ModuleChart data={report.moduleAccuracy} />
      </div>
      <section className="mt-6 grid gap-3">
        <h2 className="font-medium">Desempenho por módulo</h2>
        {report.moduleRows.map((module) => (
          <Card key={module.id} className="p-4">
            <div className="mb-2 flex justify-between gap-3 text-sm">
              <span>
                <span className="block text-xs text-muted-foreground">{module.blend}</span>
                {module.title}
              </span>
              <span className="text-muted-foreground">
                {module.averageScore == null ? "Sem notas" : `média ${module.averageScore}%`}
              </span>
            </div>
            <Progress value={module.percent} />
          </Card>
        ))}
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-medium">Questões mais erradas</h2>
          {report.wrongQuestions.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum erro registrado.</p> : null}
          <ul className="grid gap-3">
            {report.wrongQuestions.map((question) => (
              <li key={question.prompt} className="text-sm">
                <p>{question.prompt}</p>
                <p className="text-xs text-muted-foreground">
                  {question.lesson} · {question.wrong} erros em {question.total} respostas
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-medium">Linha do tempo</h2>
          <ul className="grid gap-3">
            {report.timeline.map((event) => (
              <li key={event.id} className="text-sm">
                <p>{event.text}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
              </li>
            ))}
            {report.timeline.length === 0 ? <li className="text-sm text-muted-foreground">Sem registros.</li> : null}
          </ul>
        </Card>
      </div>
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Aderência à receita</h2>
        <div className="grid gap-2">
          {report.planItems.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <span>
                {item.lessonTitle}
                <span className="block text-xs text-muted-foreground">
                  {item.weekLabel} · prazo {formatDay(item.dueDate)}
                </span>
              </span>
              <Badge tone={tone[item.status]}>{label[item.status]}</Badge>
            </div>
          ))}
          {report.planItems.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma receita atribuída.</p> : null}
        </div>
      </section>
    </div>
  );
}
