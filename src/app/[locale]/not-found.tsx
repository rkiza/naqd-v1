import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-5">
        <Logo />
        <p className="text-7xl font-semibold tracking-tight text-foreground tnum">404</p>
        <p className="max-w-sm text-muted-foreground">{t("noResults")}</p>
        <Button asChild>
          <Link href="/dashboard">{t("getStarted")}</Link>
        </Button>
      </div>
    </div>
  );
}
