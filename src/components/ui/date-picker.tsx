"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const weekdays = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function parseIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function DatePicker({
  name,
  defaultValue = "",
  ariaLabel,
  className,
}: {
  name: string;
  defaultValue?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const [cursor, setCursor] = useState(() => selected ?? new Date());

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= count; day += 1) cells.push(new Date(year, month, day));
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div ref={root} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-input bg-card px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {selected ? selected.toLocaleDateString("pt-BR") : "Escolher data"}
        </span>
        <CalendarDays className="size-4 text-muted-foreground" />
      </button>
      {open ? (
        <div id={panelId} className="absolute z-30 mt-2 w-72 rounded-2xl border border-border bg-card p-3 shadow-lg">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent"
              aria-label="Mês anterior"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-medium capitalize">{monthLabel}</p>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent"
              aria-label="Próximo mês"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {weekdays.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) =>
              day ? (
                <button
                  key={toIso(day)}
                  type="button"
                  className={cn(
                    "h-8 rounded-lg text-sm hover:bg-accent",
                    selected && sameDay(day, selected) ? "bg-primary text-primary-foreground hover:bg-primary" : "",
                  )}
                  onClick={() => {
                    setValue(toIso(day));
                    setOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
          {value ? (
            <button
              type="button"
              className="mt-3 text-xs text-muted-foreground"
              onClick={() => {
                setValue("");
                setOpen(false);
              }}
            >
              Limpar
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
