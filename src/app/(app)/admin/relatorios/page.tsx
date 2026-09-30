import type { Metadata } from "next";
import Link from "next/link";
import { ModuleChart, ProgressChart, ScoreChart } from "@/components/charts";
import { Badge, Card, DatePicker, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getClassReport, parseReportFilters } from "@/lib/reports";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Relatórios" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ blend?: string; modulo?: string; de?: string; ate?: string; dias?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const filters = parseReportFilters(query);
  const [report, tracks] = await Promise.all([
    getClassReport(filters),
    prisma.track.findMany({
      orderBy: { title: "asc" },
      include: { modules: { orderBy: { order: "asc" } } },
    }),
  ]);
  const modules = tracks.flatMap((track) =>
    track.modules
      .filter(() => !filters.trackId || track.id === filters.trackId)
      .map((module) => ({ id: module.id, label: `${track.title} / ${module.title}` })),
  );
  const csv = new URLSearchParams();
  if (query.blend) csv.set("blend", query.blend);
  if (query.modulo) csv.set("modulo", query.modulo);
  if (query.de) csv.set("de", query.de);
  if (query.ate) csv.set("ate", query.ate);
  if (query.dias) csv.set("dias", query.dias);

  return (
    <div>
      <PageHeader
        action={
          <a href={`/api/relatorios/csv?${csv.toString()}`} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground">
            Exportar CSV
          </a>
        }
      />
      <Card className="mb-6 p-4">
        <form className="grid gap-3 md:grid-cols-3" method="get">
          <label className="grid gap-1 text-sm">
            Blend
            <select name="blend" defaultValue={query.blend ?? ""} className="h-10 rounded-xl border border-input bg-card px-3">
              <option value="">Todos</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Módulo
            <select name="modulo" defaultValue={query.modulo ?? ""} className="h-10 rounded-xl border border-input bg-card px-3">
              <option value="">Todos</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Parado após (dias)
            <input name="dias" type="number" min={1} max={180} defaultValue={query.dias ?? "7"} className="h-10 rounded-xl border border-input bg-card px-3" />
          </label>
          <label className="grid gap-1 text-sm">
            De
            <DatePicker name="de" defaultValue={query.de ?? ""} ariaLabel="De" />
          </label>
          <label className="grid gap-1 text-sm">
            Até
            <DatePicker name="ate" defaultValue={query.ate ?? ""} ariaLabel="Até" />
          </label>
          <div className="flex items-end gap-2">
            <button className="h-10 rounded-xl bg-primary px-4 text-sm text-primary-foreground" type="submit">
              Filtrar
            </button>
            <Link href="/admin/relatorios" className="inline-flex h-10 items-center text-sm text-muted-foreground">
              Limpar
            </Link>
          </div>
        </form>
      </Card>
      <p className="mb-4 text-sm text-muted-foreground">
        Progresso médio: {report.averageProgress}% · {report.stalledCount} parados · {report.lessonCount} doses no filtro
      </p>
      <div className="grid gap-4">
        <ProgressChart data={report.ranking.map((row) => ({ name: row.name.split(" ")[0], progresso: row.progress }))} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ScoreChart data={report.scoreSeries} />
          <ModuleChart data={report.moduleAccuracy} />
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Estagiário</th>
              <th className="px-3 py-2 font-medium">Progresso</th>
              <th className="px-3 py-2 font-medium">Média</th>
              <th className="px-3 py-2 font-medium">Último acesso</th>
              <th className="px-3 py-2 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            {report.ranking.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link href={`/admin/relatorios/${row.id}`} className="font-medium hover:underline">
                    {row.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{row.email}</span>
                </td>
                <td className="px-3 py-2">
                  {row.progress}% ({row.completed}/{row.total})
                </td>
                <td className="px-3 py-2">{row.averageScore == null ? "Sem notas" : `${Math.round(row.averageScore)}%`}</td>
                <td className="px-3 py-2">{formatDate(row.lastAccessAt)}</td>
                <td className="px-3 py-2">{row.stalled ? <Badge tone="bad">Parado</Badge> : <Badge tone="good">Ativo</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Doses com maior taxa de erro</h2>
        {report.errorRates.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há respostas neste recorte.</p> : null}
        <ul className="grid gap-2">
          {report.errorRates.map((item) => (
            <li key={item.lessonId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <span>
                {item.lessonTitle}
                <span className="block text-xs text-muted-foreground">{item.moduleTitle}</span>
              </span>
              <span>
                {item.errorRate}% de erro · {item.answers} respostas
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
