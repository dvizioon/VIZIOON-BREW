import { cn } from "@/lib/utils";

export function Scroll({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass-scroll overflow-y-auto", className)}>{children}</div>;
}
