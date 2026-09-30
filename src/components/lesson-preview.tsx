"use client";

import { useEffect, useState } from "react";
import { FrameView } from "@/components/frame-view";
import { Markdown } from "@/components/markdown";
import { Badge, Card } from "@/components/ui";
import { toEmbedUrl } from "@/lib/media";
import { lessonTypeLabel } from "@/lib/utils";

type Draft = {
  title: string;
  description: string;
  durationMinutes: string;
  type: string;
  consultaAtiva: boolean;
  videoUrl: string;
  embedUrl: string;
  embedMode: "local" | "modal";
  removeVideo: boolean;
};

export function LessonPreview({
  formId,
  lessonId,
  trackTitle,
  moduleTitle,
  hasVideoFile,
}: {
  formId: string;
  lessonId: string;
  trackTitle: string;
  moduleTitle: string;
  hasVideoFile: boolean;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    function read() {
      if (!(form instanceof HTMLFormElement)) return;
      const data = new FormData(form);
      setDraft({
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        durationMinutes: String(data.get("durationMinutes") ?? ""),
        type: String(data.get("type") ?? ""),
        consultaAtiva: data.get("consultaAtiva") === "on",
        videoUrl: String(data.get("videoUrl") ?? ""),
        embedUrl: String(data.get("embedUrl") ?? ""),
        embedMode: data.get("embedMode") === "modal" ? "modal" : "local",
        removeVideo: data.get("removeVideo") === "on",
      });
    }

    read();
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    return () => {
      form.removeEventListener("input", read);
      form.removeEventListener("change", read);
    };
  }, [formId]);

  const videoEmbed = draft ? toEmbedUrl(draft.videoUrl) : null;
  const showFile = hasVideoFile && draft && !draft.removeVideo;
  const typeLabel =
    draft?.type === "CONSULTA" && draft.consultaAtiva ? "Consulta ativa" : lessonTypeLabel(draft?.type ?? "");

  return (
    <aside className="sticky top-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Pré-visualização</h2>
        <a href={`/aulas/${lessonId}`} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
          Abrir a dose salva
        </a>
      </div>
      <Card className="p-5">
        {!draft ? <p className="text-sm text-muted-foreground">Carregando a prévia...</p> : null}
        {draft ? (
          <div>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {trackTitle} / {moduleTitle}
                </p>
                <h3 className="mt-1 font-display text-2xl">{draft.title || "Sem título"}</h3>
              </div>
              <Badge>{typeLabel}</Badge>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Duração estimada: {draft.durationMinutes || "0"} min</p>
            {showFile ? (
              <video controls className="mb-6 aspect-video w-full rounded-2xl bg-black" src={`/api/videos/${lessonId}`} />
            ) : null}
            {!showFile && videoEmbed ? <FrameView src={videoEmbed} title={draft.title || "Vídeo"} mode="local" /> : null}
            {draft.embedUrl ? (
              <FrameView src={draft.embedUrl} title="Conteúdo incorporado" mode={draft.embedMode} />
            ) : null}
            {draft.description ? (
              <Markdown source={draft.description} />
            ) : (
              <p className="text-sm text-muted-foreground">A descrição aparece aqui enquanto você escreve.</p>
            )}
          </div>
        ) : null}
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        A prévia acompanha o formulário antes de salvar. Um vídeo novo e os materiais só entram na dose depois do envio.
      </p>
    </aside>
  );
}
