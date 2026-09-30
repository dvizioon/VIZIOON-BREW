import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { getClassReport, parseReportFilters, toCsv } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const report = await getClassReport(
    parseReportFilters({
      blend: url.searchParams.get("blend") ?? undefined,
      modulo: url.searchParams.get("modulo") ?? undefined,
      de: url.searchParams.get("de") ?? undefined,
      ate: url.searchParams.get("ate") ?? undefined,
      dias: url.searchParams.get("dias") ?? undefined,
    }),
  );

  return new NextResponse(toCsv(report.ranking), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"relatorio-turma.csv\"",
      "Cache-Control": "private, no-store",
    },
  });
}
