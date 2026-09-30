import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Empty } from "@/components/ui";
import { requireIntern } from "@/lib/guards";
import { getInternReport } from "@/lib/reports";
import { formatDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Receita da semana" };

const label = { concluido: "Concluído", atrasado: "Atrasado", proximo: "Próximo" } as const;
const tone = { concluido: "good", atrasado: "bad", proximo: "warn" } as const;

export default async function PlanPage() {
  const user = await requireIntern();
  const report = await getInternReport(user.id);
  const items = report?.planItems ?? [];
  const groups = [
    { key: "atrasado" as const, title: "Atrasado" },
    { key: "proximo" as const, title: "Próximo" },
    { key: "concluido" as const, title: "Concluído" },
  ];
  const next = items.find((item) => item.status === "proximo") ?? items.find((item) => item.status === "atrasado");

  return (
    <div>
      {items.length === 0 ? <Empty>Nenhuma receita atribuída.</Empty> : null}
      {next ? (
        <Card className="mb-6 p-5">
          <p className="text-sm text-muted-foreground">Comece por aqui</p>
          <Link href={`/aulas/${next.lessonId}`} className="mt-1 block font-medium hover:underline">
            {next.lessonTitle}
          </Link>
          <p className="text-sm text-muted-foreground">Prazo: {formatDay(next.dueDate)}</p>
        </Card>
      ) : null}
      <div className="grid gap-4">
        {groups.map((group) => {
          const rows = items.filter((item) => item.status === group.key);
          if (rows.length === 0) return null;
          return (
            <section key={group.key}>
              <h2 className="mb-2 font-medium">{group.title}</h2>
              <div className="grid gap-2">
                {rows.map((item) => (
                  <Link key={item.id} href={`/aulas/${item.lessonId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <span>
                      <span className="block font-medium">{item.lessonTitle}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.weekLabel} · {item.blendTitle} / {item.moduleTitle} · prazo {formatDay(item.dueDate)}
                      </span>
                    </span>
                    <Badge tone={tone[item.status]}>{label[item.status]}</Badge>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
