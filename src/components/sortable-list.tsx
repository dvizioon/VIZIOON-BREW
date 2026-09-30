"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { DragDropProvider, type DragEndEvent, type DragOverEvent } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  OptimisticSortingPlugin,
  SortableKeyboardPlugin,
  defaultSortableTransition,
} from "@dnd-kit/dom/sortable";
import { move } from "@dnd-kit/helpers";
import { reorderItems } from "@/actions/content";
import { Card } from "@/components/ui";

export type SortableItem = {
  id: string;
  href: string;
  title: string;
  meta: string;
};

function SortableRow({ item, index }: { item: SortableItem; index: number }) {
  const { ref, handleRef, isDragging } = useSortable({
    id: item.id,
    index,
    transition: defaultSortableTransition,
    plugins: [SortableKeyboardPlugin, OptimisticSortingPlugin],
  });

  return (
    <div ref={ref} className={isDragging ? "z-10 opacity-70" : undefined}>
      <Card className="flex items-stretch gap-2 p-2">
        <button
          ref={handleRef}
          type="button"
          className="flex w-10 shrink-0 cursor-grab items-center justify-center rounded-xl text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={`Arrastar ${item.title}`}
        >
          <GripVertical className="size-4" />
        </button>
        <Link href={item.href} className="min-w-0 flex-1 rounded-xl px-2 py-2 hover:bg-accent">
          <p className="text-xs text-muted-foreground">
            {index + 1}. {item.meta}
          </p>
          <h2 className="font-medium">{item.title}</h2>
        </Link>
      </Card>
    </div>
  );
}

export function SortableList({
  kind,
  parentId,
  items,
}: {
  kind: "modulos" | "doses" | "atividades";
  parentId: string;
  items: SortableItem[];
}) {
  const [rows, setRows] = useState(items);
  const [error, setError] = useState("");
  const order = useRef(items);

  function remember(next: SortableItem[]) {
    order.current = next;
    return next;
  }

  function onDragOver(event: DragOverEvent) {
    setRows((current) => remember(move(current, event)));
  }

  async function onDragEnd(event: DragEndEvent) {
    if (event.canceled) {
      setRows(remember(items));
      return;
    }
    const next = order.current;
    setError("");
    const result = await reorderItems(
      kind,
      parentId,
      next.map((item) => item.id),
    );
    if (result.error) {
      setRows(remember(items));
      setError(result.error);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Segure o ícone e arraste para mudar a ordem.</p>
      <DragDropProvider onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="grid gap-3">
          {rows.map((item, index) => (
            <SortableRow key={item.id} item={item} index={index} />
          ))}
        </div>
      </DragDropProvider>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
