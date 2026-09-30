"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireIntern } from "@/lib/guards";
import { saveUpload } from "@/lib/storage";
import type { ActionState } from "@/actions/auth";

const PRACTICE_EXT = [".zip", ".pdf", ".txt", ".md", ".java", ".png", ".jpg", ".jpeg", ".doc", ".docx"];

async function markLessonComplete(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return false;
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (existing?.completed) return false;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      completed: true,
      completedAt: new Date(),
      studyMinutes: lesson.durationMinutes,
    },
    update: {
      completed: true,
      completedAt: new Date(),
      studyMinutes: existing?.studyMinutes || lesson.durationMinutes,
    },
  });
  await prisma.activityLog.create({
    data: {
      userId,
      action: "DOSE_CONCLUIDA",
      metadata: JSON.stringify({ titulo: lesson.title }),
    },
  });
  return true;
}

export async function submitQuiz(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireIntern();
  const lessonId = String(formData.get("lessonId") ?? "");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      questions: {
        where: { type: "MULTIPLA" },
        include: { options: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!lesson || lesson.questions.length === 0) {
    return { error: "Esta dose não tem questões de múltipla escolha." };
  }

  const answers: { questionId: string; optionId: string; isCorrect: boolean }[] = [];
  for (const question of lesson.questions) {
    const optionId = String(formData.get(`q_${question.id}`) ?? "");
    const option = question.options.find((item) => item.id === optionId);
    if (!option) return { error: "Responda todas as questões antes de enviar." };
    answers.push({ questionId: question.id, optionId: option.id, isCorrect: option.isCorrect });
  }

  const score = Math.round((answers.filter((item) => item.isCorrect).length / answers.length) * 100);
  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      lessonId,
      score,
      answers: { create: answers },
    },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "TENTATIVA",
      metadata: JSON.stringify({ titulo: lesson.title, nota: score }),
    },
  });
  const gradeApproves = lesson.type !== "CONSULTA" || lesson.consultaAtiva;
  if (score >= 70 && gradeApproves) await markLessonComplete(user.id, lessonId);

  revalidatePath(`/aulas/${lessonId}`);
  revalidatePath("/dashboard");
  revalidatePath("/meu-desempenho");
  redirect(`/aulas/${lessonId}?tentativa=${attempt.id}`);
}

async function finishApprovedPractices(userId: string, lessonId: string) {
  const questions = await prisma.question.findMany({
    where: { lessonId, type: "PRATICA" },
    select: { id: true },
  });
  if (questions.length === 0) return;
  for (const question of questions) {
    const approved = await prisma.practiceSubmission.findFirst({
      where: { userId, questionId: question.id, score: { gte: 70 } },
    });
    if (!approved) return;
  }
  await markLessonComplete(userId, lessonId);
}

function practiceLink(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export async function submitPractice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireIntern();
  const questionId = String(formData.get("questionId") ?? "");
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { lesson: true },
  });
  if (!question || question.type !== "PRATICA") return { error: "Exercício não encontrado." };

  const link = practiceLink(String(formData.get("link") ?? ""));
  if (link === null) return { error: "O link precisa começar com http ou https." };
  const file = formData.get("file");
  const upload = file instanceof File && file.size > 0 ? file : null;
  if (!link && !upload) return { error: "Envie um arquivo ou um link." };

  let saved: { relative: string; fileName: string } | null = null;
  if (upload) {
    try {
      saved = await saveUpload(upload, "praticas", PRACTICE_EXT);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Não foi possível enviar o arquivo." };
    }
  }

  await prisma.practiceSubmission.create({
    data: {
      userId: user.id,
      questionId,
      link,
      filePath: saved?.relative,
      fileName: saved?.fileName ?? "",
    },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "PRATICA",
      metadata: JSON.stringify({ titulo: question.lesson.title, questionId }),
    },
  });
  revalidatePath(`/aulas/${question.lessonId}`);
  return { ok: "Prática enviada para análise." };
}

export async function reviewPractice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const score = Number(formData.get("score"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!Number.isInteger(score) || score < 0 || score > 100) return { error: "A nota vai de 0 a 100." };
  if (comment.length > 2000) return { error: "O comentário passa de 2000 caracteres." };

  const submission = await prisma.practiceSubmission.findUnique({
    where: { id },
    include: { question: { include: { lesson: true } }, user: true },
  });
  if (!submission) return { error: "Envio não encontrado." };

  await prisma.practiceSubmission.update({
    where: { id },
    data: { score, comment, reviewedAt: new Date() },
  });
  await finishApprovedPractices(submission.userId, submission.question.lessonId);
  await prisma.activityLog.create({
    data: {
      userId: submission.userId,
      action: "PRATICA_NOTA",
      metadata: JSON.stringify({ titulo: submission.question.lesson.title, nota: score }),
    },
  });
  revalidatePath(`/aulas/${submission.question.lessonId}`);
  revalidatePath("/dashboard");
  revalidatePath("/meu-desempenho");
  return { ok: score >= 70 ? "Prática aprovada." : "Nota registrada." };
}

export async function completeLesson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireIntern();
  const lessonId = String(formData.get("lessonId") ?? "");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { questions: { where: { type: "PRATICA" }, select: { id: true } } },
  });
  if (!lesson) return { error: "Dose não encontrada." };
  if (lesson.questions.length > 0) {
    return { error: "Esta dose só conclui quando a prática for aprovada." };
  }
  await markLessonComplete(user.id, lessonId);
  revalidatePath(`/aulas/${lessonId}`);
  revalidatePath("/dashboard");
  revalidatePath("/meu-plano");
  return { ok: "Dose concluída." };
}

