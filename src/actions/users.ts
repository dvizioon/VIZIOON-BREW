"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getSessionUser, requireAdmin } from "@/lib/guards";
import { firstIssue, internSchema, internUpdateSchema, passwordSchema, profileSchema } from "@/lib/validators";
import type { ActionState } from "@/actions/auth";

export async function createIntern(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = internSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "Já existe um usuário com este e-mail." };

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "ESTAGIARIO",
      mustChangePassword: true,
    },
  });
  revalidatePath("/admin/estagiarios");
  return { ok: "Estagiário criado. A troca de senha será pedida no primeiro acesso." };
}

export async function updateOwnProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const emailOwner = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (emailOwner && emailOwner.id !== user.id) return { error: "Já existe um usuário com este e-mail." };
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, email: parsed.data.email },
  });
  revalidatePath("/admin/estagiarios");
  return { ok: "Perfil atualizado." };
}

export async function updateIntern(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = internUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const current = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!current || current.role !== "ESTAGIARIO") return { error: "Estagiário não encontrado." };

  const emailOwner = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (emailOwner && emailOwner.id !== current.id) return { error: "Já existe um usuário com este e-mail." };

  await prisma.user.update({
    where: { id: current.id },
    data: { name: parsed.data.name, email: parsed.data.email },
  });
  revalidatePath("/admin/estagiarios");
  return { ok: "Dados atualizados." };
}

export async function resetInternPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const current = await prisma.user.findUnique({ where: { id } });
  if (!current || current.role !== "ESTAGIARIO") return { error: "Estagiário não encontrado." };

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(parsed.data),
      mustChangePassword: true,
    },
  });
  revalidatePath("/admin/estagiarios");
  return { ok: "Nova senha definida. O estagiário precisará trocá-la no próximo acesso." };
}

export async function deleteIntern(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current || current.role !== "ESTAGIARIO") return { error: "Estagiário não encontrado." };

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/estagiarios");
  revalidatePath("/admin/relatorios");
  return { ok: "Estagiário removido." };
}
