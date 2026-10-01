import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const internOnly = ["/dashboard", "/meu-plano", "/meu-desempenho"];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;
  const mustChange = session?.user?.mustChangePassword;

  if (path === "/login") {
    if (session && !mustChange) return NextResponse.redirect(new URL("/", req.nextUrl));
    return NextResponse.next();
  }

  if (!session?.user) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (mustChange && path !== "/trocar-senha") {
    return NextResponse.redirect(new URL("/trocar-senha", req.nextUrl));
  }

  if ((path.startsWith("/admin") || path.startsWith("/api/relatorios")) && role !== "ADMIN") {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (role === "ADMIN" && internOnly.some((item) => path === item || path.startsWith(`${item}/`))) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png|assets/).*)"],
};
