"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ChartFrame({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      {empty ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Sem dados neste recorte.</p>
      ) : (
        <div className="h-72 w-full">{children}</div>
      )}
    </section>
  );
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
};

export function ProgressChart({ data }: { data: { name: string; progresso: number }[] }) {
  return (
    <ChartFrame title="Progresso por estagiário" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="progresso" fill="var(--chart)" radius={6} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ScoreChart({ data }: { data: { date: string; media: number }[] }) {
  return (
    <ChartFrame title="Evolução das notas" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="media" stroke="var(--chart)" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ModuleChart({ data }: { data: { module: string; acerto: number }[] }) {
  return (
    <ChartFrame title="Acerto por módulo" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="module" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} interval={0} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="acerto" fill="var(--chart)" radius={6} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
