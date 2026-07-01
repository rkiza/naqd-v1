"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Mail, Lock, User, Phone, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import ColorBends from "@/components/react-bits/color-bends";

function Field({
  icon,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  label: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 start-3.5 my-auto flex items-center text-muted-foreground">
          {icon}
        </span>
        <input
          {...props}
          className="h-12 w-full rounded-xl border border-border bg-surface ps-11 pe-4 text-sm text-foreground placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </span>
      {error && <span className="mt-1 block text-xs text-negative">{error}</span>}
    </label>
  );
}

function SocialButton({ label, children }: { label: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard")}
      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      {children}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const isRegister = mode === "register";

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (isRegister && !form.name.trim()) next.name = t("required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t("invalidEmail");
    if (form.password.length < 6) next.password = t("shortPassword");
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => router.push("/dashboard"), 700);
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[#06140a] lg:block">
        <ColorBends
          className="h-full w-full"
          style={{ position: "absolute", inset: 0 }}
          colors={["#052e12", "#16a34a", "#52d400", "#0a1f0d"]}
          speed={0.18}
          scale={1.1}
          transparent={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06140a] via-transparent to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo className="[&_span]:text-white" />
          <div>
            <h2 className="max-w-md text-balance text-4xl font-semibold leading-tight tracking-tight">
              {t("heroTitle")}
            </h2>
            <p className="mt-3 max-w-sm text-white/70">{t("heroSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <ShieldCheck className="h-4 w-4" />
            {t("secure")}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher compact />
            <ThemeSwitcher />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-6">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isRegister ? t("registerTitle") : t("loginTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRegister ? t("registerSubtitle") : t("loginSubtitle")}
            </p>

            <div className="mt-6 flex gap-3">
              <SocialButton label={t("continueApple")}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M17.05 12.04c-.02-2.05 1.68-3.03 1.75-3.08-.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.64.8-3.35 2.03-1.43 2.48-.37 6.15 1.02 8.16.68.98 1.49 2.08 2.55 2.04 1.02-.04 1.41-.66 2.65-.66 1.23 0 1.58.66 2.66.64 1.1-.02 1.79-1 2.46-1.98.78-1.13 1.1-2.23 1.12-2.29-.02-.01-2.15-.83-2.17-3.27zM15.04 6.03c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.14z" />
                </svg>
              </SocialButton>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-subtle-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("or")}
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              {isRegister && (
                <Field
                  icon={<User className="h-4 w-4" />}
                  label={t("name")}
                  placeholder={t("namePlaceholder")}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  error={errors.name}
                  autoComplete="name"
                />
              )}
              <Field
                icon={<Mail className="h-4 w-4" />}
                label={t("email")}
                type="email"
                dir="ltr"
                placeholder={t("emailPlaceholder")}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                error={errors.email}
                autoComplete="email"
              />
              {isRegister && (
                <Field
                  icon={<Phone className="h-4 w-4" />}
                  label={t("phone")}
                  dir="ltr"
                  inputMode="tel"
                  placeholder={t("phonePlaceholder")}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  autoComplete="tel"
                />
              )}
              <div>
                <Field
                  icon={<Lock className="h-4 w-4" />}
                  label={t("password")}
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  error={errors.password}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                {!isRegister && (
                  <div className="mt-1.5 text-end">
                    <button type="button" className="text-xs font-medium text-primary-strong hover:underline">
                      {t("forgot")}
                    </button>
                  </div>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isRegister ? t("createAccount") : t("signIn")}
                    <ArrowRight className="h-4 w-4 rtl-flip" />
                  </>
                )}
              </Button>
            </form>

            {isRegister && (
              <p className="mt-4 text-center text-xs text-subtle-foreground">{t("terms")}</p>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isRegister ? t("haveAccount") : t("noAccount")}{" "}
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-semibold text-primary-strong hover:underline"
                locale={locale}
              >
                {isRegister ? t("goLogin") : t("goRegister")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
