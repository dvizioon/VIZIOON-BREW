import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { describeActivity, parseDay, progressPercent } from "@/lib/utils";

export type ReportFilters = {
  trackId?: string;
  moduleId?: string;
  from?: Date;
  to?: Date;
  inactiveDays: number;
};

export function parseReportFilters(input: {
  blend?: string;
  modulo?: string;
  de?: string;
  ate?: string;
  dias?: string;
}): ReportFilters {
  const days = Number(input.dias);
  return {
    trackId: input.blend || undefined,
    moduleId: input.modulo || undefined,
    from: parseDay(input.de, false),
    to: parseDay(input.ate, true),
    inactiveDays: Number.isFinite(days) && days >= 1 && days <= 180 ? days : 7,
  };
}

function lessonWhere(filters: ReportFilters) {
  return {
    ...(filters.moduleId ? { moduleId: filters.moduleId } : {}),
    ...(filters.trackId ? { module: { trackId: filters.trackId } } : {}),
  };
}

function periodFilter(filters: ReportFilters) {
  if (!filters.from && !filters.to) return undefined;
  return {
    ...(filters.from ? { gte: filters.from } : {}),
    ...(filters.to ? { lte: filters.to } : {}),
  };
}

export function getClassOverview(inactiveDays = 7) {
  return unstable_cache(() => loadClassOverview(inactiveDays), ["class-overview", String(inactiveDays)], {
    revalidate: 30,
  })();
}

async function loadClassOverview(inactiveDays: number) {
  const cutoff = new Date(Date.now() - inactiveDays * 86_400_000);
  const [lessonTotal, interns, completedGroups, scoreGroups] = await Promise.all([
    prisma.lesson.count(),
    prisma.user.findMany({
      where: { role: "ESTAGIARIO" },
      select: { id: true, name: true, lastAccessAt: true },
      orderBy: { name: "asc" },
    }),
    prisma.lessonProgress.groupBy({
      by: ["userId"],
      where: { completed: true },
      _count: { _all: true },
    }),
    prisma.attempt.groupBy({
      by: ["userId"],
      _avg: { score: true },
    }),
  ]);

  const completedByUser = new Map(completedGroups.map((row) => [row.userId, row._count._all]));
  const scoreByUser = new Map(scoreGroups.map((row) => [row.userId, row._avg.score]));
  const ranking = interns
    .map((user) => {
      const completed = completedByUser.get(user.id) ?? 0;
      const last = user.lastAccessAt;
      return {
        id: user.id,
        name: user.name,
        progress: progressPercent(completed, lessonTotal),
        averageScore: scoreByUser.get(user.id) ?? null,
        lastAccessAt: last ? last.toISOString() : null,
        stalled: !last || last.getTime() < cutoff.getTime(),
      };
    })
    .sort((a, b) => b.progress - a.progress || (b.averageScore ?? -1) - (a.averageScore ?? -1));

  const averageProgress = ranking.length
    ? Math.round(ranking.reduce((sum, row) => sum + row.progress, 0) / ranking.length)
    : 0;

  return {
    ranking,
    averageProgress,
    stalledCount: ranking.filter((row) => row.stalled).length,
  };
}

export function getClassReport(filters: ReportFilters) {
  const key = [filters.trackId ?? "", filters.moduleId ?? "", filters.from?.toISOString() ?? "", filters.to?.toISOString() ?? "", String(filters.inactiveDays)].join("|");
  return unstable_cache(() => loadClassReport(filters), ["class-report", key], { revalidate: 30 })();
}

async function loadClassReport(filters: ReportFilters) {
  const createdAt = periodFilter(filters);
  const [lessons, interns] = await Promise.all([
    prisma.lesson.findMany({
      where: lessonWhere(filters),
      select: { id: true, title: true, module: { select: { title: true } } },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.user.findMany({
      where: { role: "ESTAGIARIO" },
      select: { id: true, name: true, email: true, lastAccessAt: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const lessonIds = lessons.map((lesson) => lesson.id);
  const progress =
    lessonIds.length === 0
      ? []
      : await prisma.lessonProgress.findMany({
          where: {
            lessonId: { in: lessonIds },
            completed: true,
            ...(createdAt ? { completedAt: createdAt } : {}),
          },
          select: { userId: true, completedAt: true },
        });
  const attempts =
    lessonIds.length === 0
      ? []
      : await prisma.attempt.findMany({
          where: { lessonId: { in: lessonIds }, ...(createdAt ? { createdAt } : {}) },
          select: {
            userId: true,
            score: true,
            createdAt: true,
            answers: { select: { isCorrect: true, question: { select: { lessonId: true } } } },
          },
          orderBy: { createdAt: "asc" },
        });

  const progressRows = progress;
  const attemptRows = attempts;

  const ranking = interns
    .map((user) => {
      const completed = progressRows.filter((item) => item.userId === user.id).length;
      const userAttempts = attemptRows.filter((item) => item.userId === user.id);
      const averageScore = userAttempts.length
        ? userAttempts.reduce((sum, item) => sum + item.score, 0) / userAttempts.length
        : null;
      const last = user.lastAccessAt;
      const stalled = !last || Date.now() - last.getTime() > filters.inactiveDays * 86_400_000;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        progress: progressPercent(completed, lessons.length),
        completed,
        total: lessons.length,
        averageScore,
        lastAccessAt: last ? last.toISOString() : null,
        stalled,
      };
    })
    .sort((a, b) => b.progress - a.progress || (b.averageScore ?? -1) - (a.averageScore ?? -1));

  const averageProgress = ranking.length
    ? Math.round(ranking.reduce((sum, row) => sum + row.progress, 0) / ranking.length)
    : 0;

  const errorRates = lessons
    .map((lesson) => {
      const answers = attemptRows
        .flatMap((attempt) => attempt.answers)
        .filter((answer) => answer.question.lessonId === lesson.id);
      const wrong = answers.filter((answer) => !answer.isCorrect).length;
      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleTitle: lesson.module.title,
        errorRate: answers.length ? Math.round((wrong / answers.length) * 100) : 0,
        answers: answers.length,
      };
    })
    .filter((item) => item.answers > 0)
    .sort((a, b) => b.errorRate - a.errorRate || b.answers - a.answers);

  const byDay = new Map<string, number[]>();
  for (const attempt of attemptRows) {
    const key = attempt.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key) ?? [];
    bucket.push(attempt.score);
    byDay.set(key, bucket);
  }
  const scoreSeries = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, scores]) => ({
      date: new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`)),
      media: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    }));

  const modules = new Map<string, { correct: number; total: number }>();
  for (const attempt of attemptRows) {
    for (const answer of attempt.answers) {
      const lesson = lessons.find((item) => item.id === answer.question.lessonId);
      if (!lesson) continue;
      const bucket = modules.get(lesson.module.title) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (answer.isCorrect) bucket.correct += 1;
      modules.set(lesson.module.title, bucket);
    }
  }
  const moduleAccuracy = [...modules.entries()].map(([module, value]) => ({
    module,
    acerto: value.total ? Math.round((value.correct / value.total) * 100) : 0,
  }));

  return {
    ranking,
    averageProgress,
    stalledCount: ranking.filter((row) => row.stalled).length,
    errorRates,
    scoreSeries,
    moduleAccuracy,
    lessonCount: lessons.length,
  };
}

export function getInternReport(userId: string) {
  return unstable_cache(() => loadInternReport(userId), ["intern-report", userId], { revalidate: 20 })();
}

async function loadInternReport(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ESTAGIARIO") return null;

  const [modules, attempts, logs, plans, study] = await Promise.all([
    prisma.module.findMany({
      orderBy: [{ track: { title: "asc" } }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        track: { select: { title: true } },
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            progress: { where: { userId }, select: { completed: true } },
          },
        },
      },
    }),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        score: true,
        createdAt: true,
        lesson: { select: { title: true, moduleId: true, module: { select: { title: true } } } },
        answers: {
          select: {
            isCorrect: true,
            questionId: true,
            question: { select: { prompt: true, lesson: { select: { title: true } } } },
          },
        },
      },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.studyPlan.findMany({
      where: { OR: [{ forAll: true }, { assignments: { some: { userId } } }] },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        title: true,
        weekLabel: true,
        items: {
          orderBy: { dueDate: "asc" },
          select: {
            id: true,
            lessonId: true,
            dueDate: true,
            lesson: {
              select: {
                title: true,
                progress: { where: { userId }, select: { completed: true, completedAt: true } },
                module: { select: { title: true, track: { select: { title: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.lessonProgress.aggregate({
      where: { userId },
      _sum: { studyMinutes: true },
    }),
  ]);

  const moduleRows = modules.map((module) => {
    const total = module.lessons.length;
    const completed = module.lessons.filter((lesson) =>
      lesson.progress.some((item) => item.completed),
    ).length;
    const moduleAttempts = attempts.filter((attempt) => attempt.lesson.moduleId === module.id);
    const averageScore = moduleAttempts.length
      ? Math.round(moduleAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / moduleAttempts.length)
      : null;
    return {
      id: module.id,
      title: module.title,
      blend: module.track.title,
      completed,
      total,
      percent: progressPercent(completed, total),
      averageScore,
    };
  });

  const wrongMap = new Map<string, { prompt: string; lesson: string; wrong: number; total: number }>();
  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const current = wrongMap.get(answer.questionId) ?? {
        prompt: answer.question.prompt,
        lesson: answer.question.lesson.title,
        wrong: 0,
        total: 0,
      };
      current.total += 1;
      if (!answer.isCorrect) current.wrong += 1;
      wrongMap.set(answer.questionId, current);
    }
  }

  let onTime = 0;
  let considered = 0;
  const planItems = plans.flatMap((plan) =>
    plan.items.map((item) => {
      const progress = item.lesson.progress[0];
      const completed = Boolean(progress?.completed);
      const lateOpen = !completed && item.dueDate.getTime() < Date.now();
      const finishedOnTime = Boolean(
        completed && progress?.completedAt && progress.completedAt.getTime() <= item.dueDate.getTime(),
      );
      if (completed || lateOpen) {
        considered += 1;
        if (finishedOnTime) onTime += 1;
      }
      const status: "concluido" | "atrasado" | "proximo" = completed
        ? "concluido"
        : lateOpen
          ? "atrasado"
          : "proximo";
      return {
        id: item.id,
        planTitle: plan.title,
        weekLabel: plan.weekLabel,
        lessonId: item.lessonId,
        lessonTitle: item.lesson.title,
        moduleTitle: item.lesson.module.title,
        blendTitle: item.lesson.module.track.title,
        dueDate: item.dueDate.toISOString(),
        status,
      };
    }),
  );

  const titles = moduleRows.map((row) => row.title);
  const scoreSeries = [...attempts].reverse().map((attempt) => ({
    date: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(attempt.createdAt),
    media: Math.round(attempt.score),
  }));

  const accuracyMap = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    const label = titles.filter((title) => title === attempt.lesson.module.title).length > 1
      ? `${attempt.lesson.module.title}`
      : attempt.lesson.module.title;
    for (const answer of attempt.answers) {
      const bucket = accuracyMap.get(label) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (answer.isCorrect) bucket.correct += 1;
      accuracyMap.set(label, bucket);
    }
  }

  const allLessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      blend: module.track.title,
      module: module.title,
      completed: lesson.progress.some((item) => item.completed),
    })),
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      lastAccessAt: user.lastAccessAt?.toISOString() ?? null,
    },
    studyMinutes: study._sum.studyMinutes ?? 0,
    averageScore: attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
      : null,
    moduleRows,
    attempts: attempts.map((attempt) => ({
        id: attempt.id,
        score: Math.round(attempt.score),
        createdAt: attempt.createdAt.toISOString(),
        lessonTitle: attempt.lesson.title,
        moduleTitle: attempt.lesson.module.title,
      })),
    timeline: logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      text: describeActivity(log.action, log.metadata),
    })),
    wrongQuestions: [...wrongMap.values()]
      .filter((item) => item.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong || b.total - a.total)
      .slice(0, 6),
    planItems,
    adherence: considered ? Math.round((onTime / considered) * 100) : null,
    scoreSeries,
    moduleAccuracy: [...accuracyMap.entries()].map(([module, value]) => ({
      module,
      acerto: value.total ? Math.round((value.correct / value.total) * 100) : 0,
    })),
    nextLesson: allLessons.find((lesson) => !lesson.completed) ?? null,
    overdue: planItems.filter((item) => item.status === "atrasado"),
  };
}

export function toCsv(rows: Awaited<ReturnType<typeof getClassReport>>["ranking"]) {
  const header = ["nome", "email", "progresso", "doses_concluidas", "doses_total", "media_notas", "ultimo_acesso", "parado"];
  const lines = rows.map((row) =>
    [
      row.name,
      row.email,
      row.progress,
      row.completed,
      row.total,
      row.averageScore == null ? "" : row.averageScore.toFixed(1).replace(".", ","),
      row.lastAccessAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(row.lastAccessAt)) : "",
      row.stalled ? "sim" : "nao",
    ]
      .map(csvCell)
      .join(";"),
  );
  return `\uFEFF${header.join(";")}\n${lines.join("\n")}\n`;
}

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (/[";\n]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}
