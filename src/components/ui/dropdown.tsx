"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Ctx = {
  open: boolean;
  setOpen: (o: boolean) => void;
  id: string;
};
const DropdownCtx = createContext<Ctx | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownCtx);
  if (!ctx) throw new Error("Dropdown components must be used within <Dropdown>");
  return ctx;
}

export function Dropdown({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <DropdownCtx.Provider value={{ open, setOpen, id }}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </DropdownCtx.Provider>
  );
}

export function DropdownTrigger({
  children,
  className,
  asChild,
}: {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { open, setOpen, id } = useDropdown();
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={id}
      data-as-child={asChild}
      onClick={() => setOpen(!open)}
      className={className}
    >
      {children}
    </button>
  );
}

export function DropdownContent({
  children,
  align = "end",
  className,
}: {
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const { open, id } = useDropdown();
  if (!open) return null;
  return (
    <div
      id={id}
      role="menu"
      className={cn(
        "absolute top-[calc(100%+0.5rem)] z-50 flex min-w-52 flex-col gap-0.5 origin-top rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-scale-in",
        align === "end" ? "end-0" : "start-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onSelect,
  active,
  className,
  icon,
  href,
}: {
  children: ReactNode;
  onSelect?: () => void;
  active?: boolean;
  className?: string;
  icon?: ReactNode;
  href?: string;
}) {
  const { setOpen } = useDropdown();

  const classes = cn(
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-sm font-medium transition-colors",
    "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
    active ? "text-primary-strong" : "text-foreground",
    className,
  );

  const content = (
    <>
      {icon}
      <span className="flex-1">{children}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        role="menuitem"
        onClick={() => setOpen(false)}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      className={classes}
    >
      {content}
    </button>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-2 text-xs font-medium text-subtle-foreground">
      {children}
    </div>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
