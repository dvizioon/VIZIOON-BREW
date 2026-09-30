import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastAccessAt: new Date() },
        });
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "ACESSO",
            metadata: "{}",
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as "ADMIN" | "ESTAGIARIO",
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});
