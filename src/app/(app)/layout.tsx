import { Shell } from "@/layout/shell";
import { getSessionUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return <Shell user={user}>{children}</Shell>;
}
