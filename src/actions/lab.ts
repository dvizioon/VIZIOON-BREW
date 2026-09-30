"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireIntern } from "@/lib/guards";
import { challengeSchema, firstIssue } from "@/lib/validators";
import { removeUpload, saveUpload } from "@/lib/storage";
import type { ActionState } from "@/actions/auth";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function touch(id?: string) {
  revalidatePath("/lab");
  revalidatePath("/meu-desempenho");
  if (id) revalidatePath(`/lab/${id}`);
}

export async function createChallenge(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = challengeSchema.safeParse({
    title: text(formData, "title"),
    prompt: text(formData, "prompt"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const last = await prisma.challenge.findFirst({ orderBy: { order: "desc" } });
  const created = await prisma.challenge.create({
    data: {
      title: parsed.data.title,
      prompt: parsed.data.prompt,
      published: parsed.data.published,
      order: (last?.order ?? 0) + 1,
    },
  });
  touch(created.id);
  redirect(`/lab/${created.id}`);
}

export async function updateChallenge(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const parsed = challengeSchema.safeParse({
    title: text(formData, "title"),
    prompt: text(formData, "prompt"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const current = await prisma.challenge.findUnique({ where: { id } });
  if (!current) return { error: "Desafio não encontrado." };
  await prisma.challenge.update({ where: { id }, data: parsed.data });
  touch(id);
  return { ok: "Desafio atualizado." };
}

export async function deleteChallenge(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const current = await prisma.challenge.findUnique({ where: { id }, include: { submissions: true } });
  if (!current) return { error: "Desafio não encontrado." };
  for (const item of current.submissions) await removeUpload(item.filePath);
  await prisma.challenge.delete({ where: { id } });
  touch();
  return { ok: "Desafio excluído." };
}

export async function submitLabZip(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireIntern();
  const challengeId = text(formData, "challengeId");
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge?.published) return { error: "Desafio não encontrado." };
  const upload = formData.get("zip");
  if (!(upload instanceof File) || upload.size <= 0) return { error: "Envie o zip com o código." };
  let saved: { relative: string; fileName: string };
  try {
    saved = await saveUpload(upload, "lab", [".zip"]);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível enviar o arquivo." };
  }
  await prisma.labSubmission.create({
    data: {
      userId: user.id,
      challengeId: challenge.id,
      filePath: saved.relative,
      fileName: saved.fileName,
    },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "DESAFIO",
      metadata: JSON.stringify({ titulo: challenge.title }),
    },
  });
  touch(challenge.id);
  return { ok: "Zip enviado. O tech lead avalia e registra a nota." };
}

export async function reviewLab(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const score = Number(formData.get("score"));
  const comment = text(formData, "comment").trim();
  if (!Number.isInteger(score) || score < 0 || score > 100) return { error: "A nota vai de 0 a 100." };
  if (comment.length > 2000) return { error: "O comentário passa de 2000 caracteres." };
  const submission = await prisma.labSubmission.findUnique({
    where: { id },
    include: { challenge: true },
  });
  if (!submission) return { error: "Envio não encontrado." };
  await prisma.labSubmission.update({
    where: { id },
    data: { score, comment, reviewedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: {
      userId: submission.userId,
      action: "DESAFIO_NOTA",
      metadata: JSON.stringify({ titulo: submission.challenge.title, nota: score }),
    },
  });
  touch(submission.challengeId);
  return { ok: "Nota registrada." };
}
