import type { ReactNode } from "react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  footer,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={
              accent
                ? { backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }
                : undefined
            }
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tnum">
        {value}
      </p>
      {footer && <div className="mt-1.5 text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
}
