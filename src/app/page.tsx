import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.mustChangePassword) redirect("/trocar-senha");
  if (session.user.role === "ADMIN") redirect("/admin");
  redirect("/dashboard");
}
