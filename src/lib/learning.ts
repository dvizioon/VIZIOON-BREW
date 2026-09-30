import { prisma } from "@/lib/prisma";
import { progressPercent } from "@/lib/utils";

const trackInclude = (userId: string) => ({
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        orderBy: { order: "asc" as const },
        include: {
          progress: { where: { userId } },
          questions: { select: { id: true, type: true } },
        },
      },
    },
  },
});

export async function getTracksForUser(userId: string, includeDrafts: boolean) {
  return prisma.track.findMany({
    where: includeDrafts ? {} : { published: true },
    orderBy: { title: "asc" },
    include: trackInclude(userId),
  });
}

export function summarizeTrack(track: {
  modules: { lessons: { progress: { completed: boolean }[] }[] }[];
}) {
  const lessons = track.modules.flatMap((module) => module.lessons);
  const completed = lessons.filter((lesson) => lesson.progress.some((item) => item.completed)).length;
  return {
    total: lessons.length,
    completed,
    percent: progressPercent(completed, lessons.length),
  };
}

export async function getLessonDetail(lessonId: string, userId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      materials: { orderBy: { createdAt: "asc" } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      progress: { where: { userId } },
      attempts: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          answers: {
            include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
          },
        },
      },
      module: { include: { track: true } },
    },
  });
}
