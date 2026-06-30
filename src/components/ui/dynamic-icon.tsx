import {
  ArrowDownLeft,
  TrendingUp,
  ShoppingCart,
  Coffee,
  ShoppingBag,
  Car,
  ReceiptText,
  Clapperboard,
  HeartPulse,
  ArrowLeftRight,
  Plane,
  GraduationCap,
  ShieldCheck,
  Home,
  Wallet,
  CreditCard,
  Send,
  type LucideIcon,
} from "lucide-react";

/** Curated icon registry — keeps the bundle tight (no dynamic-all import). */
const registry: Record<string, LucideIcon> = {
  ArrowDownLeft,
  TrendingUp,
  ShoppingCart,
  Coffee,
  ShoppingBag,
  Car,
  ReceiptText,
  Clapperboard,
  HeartPulse,
  ArrowLeftRight,
  Plane,
  GraduationCap,
  ShieldCheck,
  Home,
  Wallet,
  CreditCard,
  Send,
};

export function DynamicIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = registry[name] ?? Wallet;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
