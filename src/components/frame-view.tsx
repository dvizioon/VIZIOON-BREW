"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function FrameView({
  src,
  title,
  mode,
}: {
  src: string;
  title: string;
  mode: "local" | "modal";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const frame = (
    <iframe
      className="aspect-video w-full rounded-2xl bg-black"
      src={src}
      title={title}
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );

  if (mode !== "modal") return <div className="mb-6">{frame}</div>;

  return (
    <div className="mb-6">
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
        onClick={() => setOpen(true)}
      >
        Abrir conteúdo
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button type="button" className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-sm" onClick={() => setOpen(false)}>
                <X className="size-4" />
                Fechar
              </button>
            </div>
            {frame}
          </div>
        </div>
      ) : null}
    </div>
  );
}
