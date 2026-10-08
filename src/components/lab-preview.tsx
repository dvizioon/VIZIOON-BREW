"use client";

import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import { Badge, Card } from "@/components/ui";

type Draft = {
  title: string;
  prompt: string;
  published: boolean;
};

export function LabPreview({ formId }: { formId: string }) {
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    function read() {
      if (!(form instanceof HTMLFormElement)) return;
      const data = new FormData(form);
      setDraft({
        title: String(data.get("title") ?? ""),
        prompt: String(data.get("prompt") ?? ""),
        published: data.get("published") === "on",
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

  return (
    <aside className="min-w-0 xl:sticky xl:top-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Pré-visualização</h2>
        <p className="text-xs text-muted-foreground">Como o estagiário lê as especificações</p>
      </div>
      <Card className="max-h-[min(80vh,56rem)] overflow-y-auto p-5">
        {!draft ? <p className="text-sm text-muted-foreground">Carregando a prévia...</p> : null}
        {draft ? (
          <div className="grid min-w-0 gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Lab</p>
                <h3 className="font-display text-2xl break-words">{draft.title.trim() || "Sem título"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  As especificações estão abaixo. O estagiário envia um zip com o código.
                </p>
              </div>
              <Badge tone={draft.published ? "good" : "warn"}>{draft.published ? "Lançado" : "Rascunho"}</Badge>
            </div>
            <div className="min-w-0">
              <h4 className="font-display text-xl">Especificações</h4>
              <div className="mt-3 min-w-0">
                {draft.prompt.trim() ? (
                  <Markdown source={draft.prompt} />
                ) : (
                  <p className="text-sm text-muted-foreground">Escreva as especificações para ver a prévia.</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Aqui o estagiário vê o envio do zip e a lista dos próprios envios.
            </div>
          </div>
        ) : null}
      </Card>
    </aside>
  );
}
