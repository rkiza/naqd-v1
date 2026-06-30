import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal Slot — merges props (incl. className) onto its single child element.
 * Lets components expose `asChild` without pulling in @radix-ui/react-slot.
 */
export const Slot = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ children, className, ...props }, ref) => {
    if (!isValidElement(children)) return null;
    const child = Children.only(children) as ReactElement<
      Record<string, unknown>
    >;
    const childProps = child.props as Record<string, unknown> & {
      className?: string;
    };
    return cloneElement(child, {
      ...props,
      ...childProps,
      className: cn(className, childProps.className),
      ref,
    } as Record<string, unknown>);
  },
);
Slot.displayName = "Slot";
