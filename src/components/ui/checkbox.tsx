import { cn } from "@/lib/utils";

export function Checkbox({ label, className, ...props }: React.ComponentProps<"input"> & { label?: string }) {
  return (
    <label className="flex items-center gap-3 py-1 text-sm">
      <input {...props} type="checkbox" className={cn("size-4 rounded border-input accent-current text-primary", className)} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
