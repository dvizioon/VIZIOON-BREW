import { cn } from "@/lib/utils";

export function Toggle({ label, hint, className, ...props }: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-6 rounded-xl border border-border px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <span className="relative inline-flex shrink-0">
        <input {...props} type="checkbox" className={cn("peer sr-only", className)} />
        <span className="block h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
