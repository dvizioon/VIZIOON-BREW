import { cache } from "react";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ESTAGIARIO";
  mustChangePassword: boolean;
};

export const getSessionUser = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const fresh = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!fresh) redirect("/login");
  if (fresh.mustChangePassword) redirect("/trocar-senha");

  const stale = !fresh.lastAccessAt || Date.now() - fresh.lastAccessAt.getTime() > 60_000;
  if (stale) {
    after(() => {
      void prisma.user.update({
        where: { id: fresh.id },
        data: { lastAccessAt: new Date() },
      });
    });
  }

  return {
    id: fresh.id,
    name: fresh.name,
    email: fresh.email,
    role: fresh.role === "ADMIN" ? "ADMIN" : "ESTAGIARIO",
    mustChangePassword: fresh.mustChangePassword,
  };
});

export async function requireAdmin() {
  const user = await getSessionUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function requireIntern() {
  const user = await getSessionUser();
  if (user.role !== "ESTAGIARIO") redirect("/admin");
  return user;
}
