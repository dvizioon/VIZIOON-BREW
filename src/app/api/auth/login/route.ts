import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

function appOrigin(request: Request) {
  const fromEnv = process.env.AUTH_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const origin = appOrigin(request);
  const home = `${origin}/`;
  const denied = `${origin}/login?erro=1`;

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: home,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(denied, 303);
    }
    throw error;
  }

  return NextResponse.redirect(home, 303);
}
