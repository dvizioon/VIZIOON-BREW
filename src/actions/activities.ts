"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSessionUser } from "@/lib/guards";
import { activityCodeSchema, activitySchema, firstIssue } from "@/lib/validators";
import { isCodeLanguage, runCases, takeRunSlots } from "@/lib/piston";
import type { ActionState } from "@/actions/auth";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function touch(moduleId?: string, activityId?: string) {
  revalidatePath("/admin/conteudo");
  revalidatePath("/trilhas");
  if (activityId) revalidatePath(`/atividades/${activityId}`);
  if (moduleId) revalidatePath("/admin/conteudo", "layout");
}

function casesFrom(formData: FormData) {
  const cases: { stdin: string; expectedStdout: string; order: number }[] = [];
  for (let index = 1; index <= 4; index += 1) {
    const stdin = text(formData, `stdin${index}`);
    const expectedStdout = text(formData, `expected${index}`);
    if (!stdin.trim() && !expectedStdout.trim()) continue;
    if (stdin.length > 2000 || expectedStdout.length > 2000) {
      return { error: "Cada caso aceita até 2000 caracteres.", cases: [] };
    }
    cases.push({ stdin, expectedStdout, order: cases.length + 1 });
  }
  if (cases.length === 0) return { error: "Informe pelo menos um caso de teste.", cases: [] };
  return { error: null, cases };
}

export async function createActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = activitySchema.safeParse({
    moduleId: text(formData, "moduleId"),
    title: text(formData, "title"),
    description: text(formData, "description"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const parent = await prisma.module.findUnique({ where: { id: parsed.data.moduleId } });
  if (!parent) return { error: "Módulo não encontrado." };
  const last = await prisma.activity.findFirst({
    where: { moduleId: parent.id },
    orderBy: { order: "desc" },
  });
  const created = await prisma.activity.create({
    data: {
      moduleId: parent.id,
      title: parsed.data.title,
      description: parsed.data.description,
      order: (last?.order ?? 0) + 1,
    },
  });
  touch(parent.id, created.id);
  redirect(`/admin/conteudo/${parent.trackId}/atividades/${created.id}?aba=codigo`);
}

export async function deleteActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const current = await prisma.activity.findUnique({ where: { id }, include: { module: true } });
  if (!current) return { error: "Atividade não encontrada." };
  await prisma.activity.delete({ where: { id } });
  touch(current.moduleId);
  return { ok: "Atividade excluída." };
}

export async function createActivityCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = activityCodeSchema.safeParse({
    activityId: text(formData, "activityId"),
    prompt: text(formData, "prompt"),
    explanation: text(formData, "explanation"),
    language: text(formData, "language"),
    starterCode: text(formData, "starterCode"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const built = casesFrom(formData);
  if (built.error) return { error: built.error };
  const activity = await prisma.activity.findUnique({ where: { id: parsed.data.activityId } });
  if (!activity) return { error: "Atividade não encontrada." };
  const last = await prisma.activityQuestion.findFirst({
    where: { activityId: activity.id },
    orderBy: { order: "desc" },
  });
  await prisma.activityQuestion.create({
    data: {
      activityId: activity.id,
      prompt: parsed.data.prompt,
      explanation: parsed.data.explanation,
      language: parsed.data.language,
      starterCode: parsed.data.starterCode,
      order: (last?.order ?? 0) + 1,
      cases: { create: built.cases },
    },
  });
  touch(activity.moduleId, activity.id);
  return { ok: "Questão de código criada." };
}

export async function deleteActivityQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const question = await prisma.activityQuestion.findUnique({ where: { id }, include: { activity: true } });
  if (!question) return { error: "Questão não encontrada." };
  await prisma.activityQuestion.delete({ where: { id } });
  touch(question.activity.moduleId, question.activityId);
  return { ok: "Questão excluída." };
}

export async function runActivityCode(questionId: string, source: string) {
  if (typeof questionId !== "string" || typeof source !== "string") return { error: "Dados inválidos." };
  const user = await getSessionUser();
  const question = await prisma.activityQuestion.findUnique({
    where: { id: questionId },
    include: { cases: { orderBy: { order: "asc" } }, activity: { include: { module: { include: { track: true } } } } },
  });
  if (!question || !isCodeLanguage(question.language)) return { error: "Questão não encontrada." };
  const track = question.activity.module.track;
  if (user.role !== "ADMIN" && !track.published) return { error: "Questão não encontrada." };
  if (question.cases.length === 0) return { error: "Esta questão ainda não tem testes." };
  if (!takeRunSlots(user.id, question.cases.length)) return { error: "Muitas execuções seguidas. Espere um minuto." };
  const result = await runCases(
    question.language,
    source,
    question.cases.map((item) => ({ stdin: item.stdin, expectedStdout: item.expectedStdout })),
  );
  if (result.error) return { error: result.error };
  const passed = result.cases.filter((item) => item.passed).length;
  return { passed, total: result.cases.length, cases: result.cases };
}

export async function submitActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  const activityId = text(formData, "activityId");
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      module: { include: { track: true } },
      questions: { orderBy: { order: "asc" }, include: { cases: { orderBy: { order: "asc" } } } },
    },
  });
  if (!activity || (user.role !== "ADMIN" && !activity.module.track.published)) {
    return { error: "Atividade não encontrada." };
  }
  if (activity.questions.length === 0) return { error: "Esta atividade ainda não tem questões." };
  if (user.role === "ADMIN") return { error: "A entrega é do estagiário." };

  const cost = activity.questions.reduce((total, question) => total + question.cases.length, 0);
  if (!takeRunSlots(user.id, cost)) return { error: "Muitas execuções seguidas. Espere um minuto." };

  const graded: { questionId: string; sourceCode: string; passed: boolean }[] = [];
  for (const question of activity.questions) {
    if (!isCodeLanguage(question.language)) return { error: "Há uma questão sem linguagem." };
    const source = text(formData, `code_${question.id}`);
    const result = await runCases(
      question.language,
      source,
      question.cases.map((item) => ({ stdin: item.stdin, expectedStdout: item.expectedStdout })),
    );
    if (result.error) return { error: result.error };
    graded.push({
      questionId: question.id,
      sourceCode: source,
      passed: result.cases.every((item) => item.passed),
    });
  }
  const passed = graded.every((item) => item.passed);
  await prisma.activityDelivery.create({
    data: {
      userId: user.id,
      activityId: activity.id,
      passed,
      answers: { create: graded },
    },
  });
  if (passed) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "ATIVIDADE",
        metadata: JSON.stringify({ titulo: activity.title }),
      },
    });
  }
  touch(activity.moduleId, activity.id);
  revalidatePath(`/trilhas/${activity.module.trackId}`);
  return passed
    ? { ok: "Atividade concluída. O resultado dos testes passou." }
    : { error: "Ainda tem questão que não passou. Ajuste o código e execute de novo." };
}
