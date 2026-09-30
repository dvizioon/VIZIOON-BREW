import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Empty, Progress } from "@/components/ui";
import { getSessionUser } from "@/lib/guards";
import { getTracksForUser, summarizeTrack } from "@/lib/learning";

export const metadata: Metadata = { title: "Blends" };

export default async function TracksPage() {
  const user = await getSessionUser();
  const tracks = await getTracksForUser(user.id, user.role === "ADMIN");

  return (
    <div>
      {tracks.length === 0 ? <Empty>Nenhum blend disponível.</Empty> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {tracks.map((track) => {
          const summary = summarizeTrack(track);
          const doses = track.modules.reduce((sum, module) => sum + module.lessons.length, 0);
          return (
            <Link key={track.id} href={`/trilhas/${track.id}`}>
              <Card className="h-full p-5 transition-colors hover:bg-accent">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl">{track.title}</h2>
                  {track.published ? <Badge tone="good">Publicado</Badge> : <Badge>Rascunho</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {track.modules.length} módulos · {doses} doses
                </p>
                {user.role === "ESTAGIARIO" ? (
                  <div className="mt-3 grid gap-2">
                    <Progress value={summary.percent} />
                    <span className="text-xs text-muted-foreground">
                      {summary.completed} de {summary.total} doses concluídas
                    </span>
                  </div>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
