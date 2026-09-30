import { cn } from "@/lib/utils";

export function Input(props: React.ComponentProps<"input">) {
  const file = props.type === "file";
  return (
    <input
      {...props}
      className={cn(
        file
          ? "block w-full rounded-xl border border-input bg-card px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
          : "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
        props.className,
      )}
    />
  );
}
