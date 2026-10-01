import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

function appUrl(path: string) {
  const base = process.env.AUTH_URL ?? "http://localhost:3630";
  return new URL(path, base);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(appUrl("/login?erro=1"), 303);
    }
    throw error;
  }
  return NextResponse.redirect(appUrl("/"), 303);
}
