import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { requireCompanyOwner } from "@/server/company/require-company";
import { getCompanyContext } from "@/server/company/get-company-context";
import { PageTitle, Panel, Empty } from "@/features/admin/ui";
import { AddEmployee } from "@/features/company/add-employee";
import { formatCurrency } from "@/lib/format";
import { pick } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function CompanyEmployeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lo = locale as Locale;
  const owner = await requireCompanyOwner(locale);
  const t = await getTranslations("company");

  const ctx = await getCompanyContext(owner.companyId);
  if (!ctx) return null;

  return (
    <div>
      <PageTitle title={t("employees")} subtitle={t("employeesSubtitle")} />

      <Panel title={t("employees")} action={<AddEmployee />}>
        {ctx.employees.length === 0 ? (
          <Empty>{t("noEmployees")}</Empty>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-subtle-foreground">
                <th className="px-5 py-2.5 text-start font-medium">{t("colEmployee")}</th>
                <th className="px-5 py-2.5 text-end font-medium">{t("colWallet")}</th>
                <th className="px-5 py-2.5 text-end font-medium">{t("colSpend")}</th>
                <th className="px-5 py-2.5 text-start font-medium">{t("colAccess")}</th>
                <th className="px-5 py-2.5 text-end font-medium" />
              </tr>
            </thead>
            <tbody>
              {ctx.employees.map((e) => (
                <tr key={e.userId} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{pick(e.name, lo)}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{e.email}</p>
                    {e.title && <p className="text-xs text-subtle-foreground">{pick(e.title, lo)}</p>}
                  </td>
                  <td className="px-5 py-3 text-end tnum text-foreground">
                    {formatCurrency(e.walletBalance, lo, { decimals: 0 })}
                  </td>
                  <td className="px-5 py-3 text-end tnum text-muted-foreground">
                    {formatCurrency(e.monthSpend, lo, { decimals: 0 })}
                    {e.spendLimit != null ? (
                      <span className="text-subtle-foreground"> / {formatCurrency(e.spendLimit, lo, { decimals: 0 })}</span>
                    ) : (
                      <span className="text-subtle-foreground"> / {t("noLimit")}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <AccessChip on={e.canSpend} label={t("accessSpend")} />
                      <AccessChip on={e.canTopup} label={t("accessTopup")} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Link
                      href={`/company/employees/${e.userId}`}
                      className="text-xs font-medium text-primary-strong hover:underline"
                    >
                      {t("manage")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function AccessChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
        on ? "bg-positive-soft text-positive" : "bg-surface-muted text-subtle-foreground line-through"
      }`}
    >
      {label}
    </span>
  );
}
