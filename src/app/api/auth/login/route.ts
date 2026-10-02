import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const home = new URL("/", request.url);
  const denied = new URL("/login?erro=1", request.url);
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: home.toString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(denied, 303);
    }
    throw error;
  }
  return NextResponse.redirect(home, 303);
}
