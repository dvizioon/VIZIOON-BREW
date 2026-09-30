"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={200}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip(props: TooltipPrimitive.TooltipProps) {
  return <TooltipPrimitive.Root {...props} />;
}

export function TooltipTrigger(props: TooltipPrimitive.TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger {...props} />;
}

export function TooltipContent({ className = "", children, ...props }: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side="bottom"
        sideOffset={8}
        className={`z-50 max-w-xs rounded-xl bg-[#f6efe6] px-3 py-2 text-sm leading-snug text-[#2a160c] shadow-lg ${className}`}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[#f6efe6]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
