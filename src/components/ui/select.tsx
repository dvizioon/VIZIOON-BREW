import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        {...props}
        className="h-11 w-full appearance-none rounded-xl border border-input bg-card px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
