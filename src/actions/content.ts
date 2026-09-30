"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { toEmbedUrl } from "@/lib/media";
import { removeUpload, saveUpload } from "@/lib/storage";
import {
  firstIssue,
  lessonSchema,
  moduleSchema,
  planSchema,
  practicalSchema,
  questionSchema,
  trackSchema,
} from "@/lib/validators";
import type { ActionState } from "@/actions/auth";

const MATERIAL_EXT = [".pdf", ".ppt", ".pptx", ".zip", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"];
const VIDEO_EXT = [".mp4", ".webm"];

function touchContent() {
  revalidatePath("/admin/conteudo");
  revalidatePath("/admin/conteudo/[trackId]", "page");
  revalidatePath("/admin/conteudo/[trackId]/modulos/[moduleId]", "page");
  revalidatePath("/admin/conteudo/[trackId]/doses/[lessonId]", "page");
  revalidatePath("/trilhas");
  revalidatePath("/dashboard");
  revalidatePath("/admin/planos");
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fileOf(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

export async function createTrack(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = trackSchema.safeParse({
    title: text(formData, "title"),
    description: text(formData, "description"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const track = await prisma.track.create({
    data: { ...parsed.data, createdById: admin.id },
  });
  touchContent();
  redirect(`/admin/conteudo/${track.id}?aba=modulos`);
}

export async function updateTrack(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const parsed = trackSchema.safeParse({
    title: text(formData, "title"),
    description: text(formData, "description"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await prisma.track.update({ where: { id }, data: parsed.data });
  touchContent();
  return { ok: "Blend atualizado." };
}

export async function deleteTrack(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const materials = await prisma.material.findMany({ where: { lesson: { module: { trackId: id } } } });
  const lessons = await prisma.lesson.findMany({ where: { module: { trackId: id } } });
  await prisma.track.delete({ where: { id } });
  await Promise.all([
    ...materials.map((item) => removeUpload(item.filePath)),
    ...lessons.map((item) => removeUpload(item.videoPath)),
  ]);
  touchContent();
  redirect("/admin/conteudo");
}

export async function createModule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = moduleSchema.safeParse({
    trackId: text(formData, "trackId"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    order: text(formData, "order") || "1",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const last = await prisma.module.findFirst({
    where: { trackId: parsed.data.trackId },
    orderBy: { order: "desc" },
  });
  const created = await prisma.module.create({
    data: { ...parsed.data, order: (last?.order ?? 0) + 1 },
  });
  touchContent();
  redirect(`/admin/conteudo/${parsed.data.trackId}/modulos/${created.id}?aba=doses`);
}

export async function updateModule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const current = await prisma.module.findUnique({ where: { id } });
  if (!current) return { error: "Módulo não encontrado." };
  const parsed = moduleSchema.safeParse({
    trackId: current.trackId,
    title: text(formData, "title"),
    description: text(formData, "description"),
    order: String(current.order),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await prisma.module.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });
  touchContent();
  return { ok: "Módulo atualizado." };
}

export async function deleteModule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const current = await prisma.module.findUnique({ where: { id } });
  if (!current) return { error: "Módulo não encontrado." };
  const materials = await prisma.material.findMany({ where: { lesson: { moduleId: id } } });
  const lessons = await prisma.lesson.findMany({ where: { moduleId: id } });
  await prisma.module.delete({ where: { id } });
  await Promise.all([
    ...materials.map((item) => removeUpload(item.filePath)),
    ...lessons.map((item) => removeUpload(item.videoPath)),
  ]);
  touchContent();
  redirect(`/admin/conteudo/${current.trackId}`);
}

async function applyVideo(formData: FormData, current?: { videoUrl: string | null; videoPath: string | null }) {
  const removeVideo = formData.get("removeVideo") === "on";
  const videoUrl = text(formData, "videoUrl");
  const videoFile = fileOf(formData, "videoFile");

  if (removeVideo) {
    await removeUpload(current?.videoPath);
    return { videoUrl: null, videoPath: null };
  }

  if (videoFile && videoFile.size > 0) {
    if (videoUrl && !toEmbedUrl(videoUrl)) {
      return { error: "O link do vídeo precisa ser http ou https." } as const;
    }
    const saved = await saveUpload(videoFile, "videos", VIDEO_EXT);
    if (current?.videoPath && current.videoPath !== saved.relative) await removeUpload(current.videoPath);
    return { videoUrl: null, videoPath: saved.relative };
  }

  if (videoUrl) {
    if (!toEmbedUrl(videoUrl)) return { error: "O link do vídeo precisa ser http ou https." } as const;
    if (current?.videoPath) await removeUpload(current.videoPath);
    return { videoUrl, videoPath: null };
  }

  return { videoUrl: current?.videoUrl ?? null, videoPath: current?.videoPath ?? null };
}

function readEmbed(formData: FormData) {
  const raw = text(formData, "embedUrl");
  const mode = text(formData, "embedMode") === "modal" ? "modal" : "local";
  if (!raw.trim()) return { embedUrl: null as string | null, embedMode: mode };
  const frame = toEmbedUrl(raw);
  if (!frame) return { error: "O conteúdo incorporado precisa ser um link http ou https." } as const;
  return { embedUrl: frame, embedMode: mode };
}

export async function createLesson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = lessonSchema.safeParse({
    moduleId: text(formData, "moduleId"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    order: text(formData, "order") || "1",
    durationMinutes: text(formData, "durationMinutes") || "15",
    type: text(formData, "type"),
    consultaAtiva: formData.get("consultaAtiva") === "on",
    videoUrl: text(formData, "videoUrl"),
    embedUrl: text(formData, "embedUrl"),
    embedMode: text(formData, "embedMode") || "local",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const video = await applyVideo(formData);
  if ("error" in video && video.error) return { error: video.error };
  const embed = readEmbed(formData);
  if ("error" in embed) return { error: embed.error };

  const last = await prisma.lesson.findFirst({
    where: { moduleId: parsed.data.moduleId },
    orderBy: { order: "desc" },
  });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: parsed.data.moduleId,
      title: parsed.data.title,
      description: parsed.data.description,
      order: (last?.order ?? 0) + 1,
      durationMinutes: parsed.data.durationMinutes,
      type: parsed.data.type,
      consultaAtiva: parsed.data.type === "CONSULTA" && parsed.data.consultaAtiva,
      videoUrl: video.videoUrl,
      videoPath: video.videoPath,
      embedUrl: embed.embedUrl,
      embedMode: embed.embedMode,
    },
  });
  const parent = await prisma.module.findUnique({ where: { id: parsed.data.moduleId } });
  touchContent();
  if (!parent) return { ok: "Dose criada." };
  redirect(`/admin/conteudo/${parent.trackId}/doses/${lesson.id}`);
}

export async function updateLesson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const current = await prisma.lesson.findUnique({ where: { id } });
  if (!current) return { error: "Dose não encontrada." };

  const parsed = lessonSchema.safeParse({
    moduleId: current.moduleId,
    title: text(formData, "title"),
    description: text(formData, "description"),
    order: String(current.order),
    durationMinutes: text(formData, "durationMinutes"),
    type: text(formData, "type"),
    consultaAtiva: formData.get("consultaAtiva") === "on",
    videoUrl: text(formData, "videoUrl"),
    embedUrl: text(formData, "embedUrl"),
    embedMode: text(formData, "embedMode") || "local",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const video = await applyVideo(formData, current);
  if ("error" in video && video.error) return { error: video.error };
  const embed = readEmbed(formData);
  if ("error" in embed) return { error: embed.error };

  await prisma.lesson.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      order: parsed.data.order,
      durationMinutes: parsed.data.durationMinutes,
      type: parsed.data.type,
      consultaAtiva: parsed.data.type === "CONSULTA" && parsed.data.consultaAtiva,
      videoUrl: video.videoUrl,
      videoPath: video.videoPath,
      embedUrl: embed.embedUrl,
      embedMode: embed.embedMode,
    },
  });
  touchContent();
  revalidatePath(`/aulas/${id}`);
  return { ok: "Dose atualizada." };
}

export async function deleteLesson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { materials: true } });
  if (!lesson) return { error: "Dose não encontrada." };
  const parent = await prisma.module.findUnique({ where: { id: lesson.moduleId } });
  await prisma.lesson.delete({ where: { id } });
  await Promise.all([
    removeUpload(lesson.videoPath),
    ...lesson.materials.map((item) => removeUpload(item.filePath)),
  ]);
  touchContent();
  if (!parent) return { ok: "Dose excluída." };
  redirect(`/admin/conteudo/${parent.trackId}/modulos/${lesson.moduleId}`);
}

export async function uploadMaterial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const lessonId = text(formData, "lessonId");
  const title = text(formData, "title").trim();
  const file = fileOf(formData, "file");
  if (title.length < 2) return { error: "Informe o título do material." };
  if (!file) return { error: "Selecione um arquivo." };

  try {
    const saved = await saveUpload(file, "materiais", MATERIAL_EXT);
    await prisma.material.create({
      data: {
        lessonId,
        title,
        fileName: saved.fileName,
        filePath: saved.relative,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível enviar o arquivo." };
  }

  touchContent();
  revalidatePath(`/aulas/${lessonId}`);
  return { ok: "Material enviado." };
}

export async function deleteMaterial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) return { error: "Material não encontrado." };
  await prisma.material.delete({ where: { id } });
  await removeUpload(material.filePath);
  touchContent();
  revalidatePath(`/aulas/${material.lessonId}`);
  return { ok: "Material excluído." };
}

export async function createQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = questionSchema.safeParse({
    lessonId: text(formData, "lessonId"),
    prompt: text(formData, "prompt"),
    explanation: text(formData, "explanation"),
    correctIndex: text(formData, "correctIndex") || "0",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const options = [0, 1, 2, 3, 4, 5]
    .map((index) => text(formData, `option${index}`).trim())
    .filter(Boolean);
  if (options.length < 2) return { error: "Informe pelo menos duas alternativas." };
  if (parsed.data.correctIndex >= options.length) return { error: "Marque a alternativa correta." };

  const last = await prisma.question.findFirst({
    where: { lessonId: parsed.data.lessonId },
    orderBy: { order: "desc" },
  });

  await prisma.question.create({
    data: {
      lessonId: parsed.data.lessonId,
      type: "MULTIPLA",
      prompt: parsed.data.prompt,
      explanation: parsed.data.explanation,
      order: (last?.order ?? 0) + 1,
      options: {
        create: options.map((option, index) => ({
          text: option,
          isCorrect: index === parsed.data.correctIndex,
          order: index,
        })),
      },
    },
  });
  touchContent();
  return { ok: "Questão criada." };
}

export async function createPractical(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = practicalSchema.safeParse({
    lessonId: text(formData, "lessonId"),
    prompt: text(formData, "prompt"),
    explanation: text(formData, "explanation"),
    repoUrl: text(formData, "repoUrl"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const last = await prisma.question.findFirst({
    where: { lessonId: parsed.data.lessonId },
    orderBy: { order: "desc" },
  });
  await prisma.question.create({
    data: {
      lessonId: parsed.data.lessonId,
      type: "PRATICA",
      prompt: parsed.data.prompt,
      explanation: parsed.data.explanation,
      repoUrl: parsed.data.repoUrl,
      order: (last?.order ?? 0) + 1,
    },
  });
  touchContent();
  return { ok: "Exercício prático criado." };
}

export async function reorderItems(
  kind: "modulos" | "doses" | "atividades",
  parentId: string,
  ids: string[],
): Promise<ActionState> {
  await requireAdmin();
  if (kind !== "modulos" && kind !== "doses" && kind !== "atividades") return { error: "Lista inválida." };
  if (!parentId || !Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !id)) {
    return { error: "Ordem inválida." };
  }
  if (new Set(ids).size !== ids.length) return { error: "Ordem inválida." };

  if (kind === "modulos") {
    const rows = await prisma.module.findMany({ where: { trackId: parentId }, select: { id: true } });
    const known = new Set(rows.map((row) => row.id));
    if (rows.length !== ids.length || ids.some((id) => !known.has(id))) {
      return { error: "A lista de módulos mudou. Atualize a página." };
    }
    await prisma.$transaction(
      ids.map((id, index) => prisma.module.update({ where: { id }, data: { order: index + 1 } })),
    );
  } else if (kind === "doses") {
    const rows = await prisma.lesson.findMany({ where: { moduleId: parentId }, select: { id: true } });
    const known = new Set(rows.map((row) => row.id));
    if (rows.length !== ids.length || ids.some((id) => !known.has(id))) {
      return { error: "A lista de doses mudou. Atualize a página." };
    }
    await prisma.$transaction(
      ids.map((id, index) => prisma.lesson.update({ where: { id }, data: { order: index + 1 } })),
    );
  } else {
    const rows = await prisma.activity.findMany({ where: { moduleId: parentId }, select: { id: true } });
    const known = new Set(rows.map((row) => row.id));
    if (rows.length !== ids.length || ids.some((id) => !known.has(id))) {
      return { error: "A lista de atividades mudou. Atualize a página." };
    }
    await prisma.$transaction(
      ids.map((id, index) => prisma.activity.update({ where: { id }, data: { order: index + 1 } })),
    );
  }

  touchContent();
  return { ok: "Ordem atualizada." };
}

export async function deleteQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  await prisma.question.delete({ where: { id } });
  touchContent();
  return { ok: "Questão excluída." };
}

export async function createPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = planSchema.safeParse({
    title: text(formData, "title"),
    weekLabel: text(formData, "weekLabel"),
    goal: text(formData, "goal"),
    forAll: formData.get("forAll") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const lessonIds = formData.getAll("lessonId").map(String).filter(Boolean);
  const userIds = formData.getAll("userId").map(String).filter(Boolean);
  if (lessonIds.length === 0) return { error: "Escolha pelo menos uma dose." };
  if (!parsed.data.forAll && userIds.length === 0) return { error: "Escolha um estagiário ou atribua a todos." };

  const lessons = await prisma.lesson.findMany({ where: { id: { in: lessonIds } } });
  if (lessons.length !== lessonIds.length) return { error: "Uma das doses não existe mais." };

  const items = lessonIds.map((lessonId, index) => {
    const raw = text(formData, `due_${lessonId}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return null;
    }
    return { lessonId, dueDate: new Date(`${raw}T23:59:59`), order: index + 1 };
  });
  if (items.some((item) => !item)) return { error: "Informe o prazo de cada dose escolhida." };

  if (!parsed.data.forAll) {
    const interns = await prisma.user.count({
      where: { id: { in: userIds }, role: "ESTAGIARIO" },
    });
    if (interns !== userIds.length) return { error: "Há um estagiário inválido na atribuição." };
  }

  await prisma.studyPlan.create({
    data: {
      title: parsed.data.title,
      weekLabel: parsed.data.weekLabel,
      goal: parsed.data.goal,
      forAll: parsed.data.forAll,
      createdById: admin.id,
      items: { create: items.flatMap((item) => (item ? [item] : [])) },
      assignments: parsed.data.forAll ? undefined : { create: userIds.map((userId) => ({ userId })) },
    },
  });
  revalidatePath("/admin/planos");
  revalidatePath("/meu-plano");
  return { ok: "Receita criada." };
}

export async function deletePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  await prisma.studyPlan.delete({ where: { id: text(formData, "id") } });
  revalidatePath("/admin/planos");
  revalidatePath("/meu-plano");
  return { ok: "Receita excluída." };
}
