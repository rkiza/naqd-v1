import { forwardRef } from "react";
import { Slot } from "./slot";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "subtle"
  | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary-strong active:scale-[0.98]",
  secondary:
    "bg-foreground text-background hover:opacity-90 active:scale-[0.98] shadow-sm",
  outline:
    "border border-border-strong bg-surface text-foreground hover:bg-accent active:scale-[0.98]",
  ghost: "text-foreground hover:bg-accent active:scale-[0.98]",
  subtle: "bg-accent text-accent-foreground hover:bg-surface-muted active:scale-[0.98]",
  destructive:
    "bg-negative text-white hover:opacity-90 active:scale-[0.98] shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[0.95rem] gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 select-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
