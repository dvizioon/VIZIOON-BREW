import type { NextAuthConfig } from "next-auth";

const useSecureCookies = process.env.AUTH_URL?.startsWith("https://") ?? false;
const sessionCookie = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: sessionCookie,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      if (trigger === "update") {
        const data = session as { mustChangePassword?: boolean; name?: string; email?: string } | undefined;
        if (typeof data?.mustChangePassword === "boolean") {
          token.mustChangePassword = data.mustChangePassword;
        }
        if (data?.name) token.name = data.name;
        if (data?.email) token.email = data.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "ESTAGIARIO";
      session.user.mustChangePassword = Boolean(token.mustChangePassword);
      if (token.name) session.user.name = String(token.name);
      if (token.email) session.user.email = String(token.email);
      return session;
    },
  },
} satisfies NextAuthConfig;
