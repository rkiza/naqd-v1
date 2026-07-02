import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent date-time formatting for the admin console (UTC-agnostic locale). */
export function fmtDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-subtle-foreground">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tnum">{value}</p>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

export function RoleChip({ role }: { role: "USER" | "ADMIN" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
        role === "ADMIN" ? "bg-brand-soft text-primary-strong" : "bg-surface-muted text-muted-foreground",
      )}
    >
      {role}
    </span>
  );
}

const ACTION_STYLES: Record<string, string> = {
  "auth.login": "bg-info-soft text-info",
  "wallet.topup": "bg-positive-soft text-positive",
  "assistant.message": "bg-brand-soft text-primary-strong",
};

export function ActionChip({ action }: { action: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.7rem] font-medium",
        ACTION_STYLES[action] ?? "bg-surface-muted text-muted-foreground",
      )}
      dir="ltr"
    >
      {action}
    </span>
  );
}

/** Monospace IP display; shows an em dash when unknown. */
export function Ip({ value }: { value: string | null }) {
  return (
    <span className="font-mono text-xs tnum" dir="ltr">
      {value || "—"}
    </span>
  );
}
