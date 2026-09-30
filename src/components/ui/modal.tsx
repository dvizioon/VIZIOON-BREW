"use client";

import { X } from "lucide-react";
import { useEscape } from "@/hooks/use-escape";
import { Button } from "@/components/ui/button";

export function Modal({
  open,
  title,
  onClose,
  wide = false,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  useEscape(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 flex max-h-[min(44rem,calc(100vh-2rem))] w-full flex-col rounded-2xl border border-border bg-card p-6 shadow-lg ${wide ? "max-w-3xl overflow-hidden" : "max-w-lg overflow-y-auto"}`}
      >
        <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
          <h2 id="modal-title" className="font-display text-xl">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
