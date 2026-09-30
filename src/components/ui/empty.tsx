import { Card } from "@/components/ui/card";

export function Empty({ children }: { children: React.ReactNode }) {
  return <Card className="p-8 text-center text-sm text-muted-foreground">{children}</Card>;
}
