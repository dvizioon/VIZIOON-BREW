import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Stat } from "@/components/ui";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getClassOverview } from "@/lib/reports";
import { describeActivity, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel" };

export default async function AdminHomePage() {
  await requireAdmin();
  const [report, blends, doses, logs] = await Promise.all([
    getClassOverview(7),
    prisma.track.count(),
    prisma.lesson.count(),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Estagiários" value={String(report.ranking.length)} />
        <Stat label="Progresso médio" value={`${report.averageProgress}%`} />
        <Stat label="Parados" value={String(report.stalledCount)} hint="Sem acesso há 7 dias." />
        <Stat label="Conteúdo" value={`${blends}`} hint={`${doses} doses em ${blends} blends.`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Ranking</h2>
            <Link href="/admin/relatorios" className="text-sm text-primary">
              Abrir relatórios
            </Link>
          </div>
          <ul className="grid gap-2">
            {report.ranking.slice(0, 5).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/admin/relatorios/${row.id}`} className="font-medium hover:underline">
                  {row.name}
                </Link>
                <span className="text-muted-foreground">{row.progress}%</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-medium">Atividade recente</h2>
          <ul className="grid gap-3">
            {logs.map((log) => (
              <li key={log.id} className="text-sm">
                <span className="font-medium">{log.user.name}</span>
                <span className="text-muted-foreground"> {describeActivity(log.action, log.metadata)}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
              </li>
            ))}
            {logs.length === 0 ? <li className="text-sm text-muted-foreground">Nenhuma atividade ainda.</li> : null}
          </ul>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h2 className="mb-3 font-medium">Estagiários parados</h2>
        <ul className="grid gap-2">
          {report.ranking.filter((row) => row.stalled).map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link href={`/admin/relatorios/${row.id}`} className="hover:underline">
                {row.name}
              </Link>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{formatDate(row.lastAccessAt)}</span>
                <Badge tone="bad">Parado</Badge>
              </span>
            </li>
          ))}
          {report.stalledCount === 0 ? <li className="text-sm text-muted-foreground">Ninguém está parado neste recorte.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
