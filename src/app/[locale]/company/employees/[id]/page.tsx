import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { requireCompanyOwner } from "@/server/company/require-company";
import { getCompanyEmployee } from "@/server/company/get-company-context";
import { StatTile, Panel, Empty } from "@/features/admin/ui";
import { AccessEditor } from "@/features/company/access-editor";
import { FundWallet } from "@/features/company/fund-wallet";
import { formatCurrency, formatDate } from "@/lib/format";
import { pick } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function CompanyEmployeeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const lo = locale as Locale;
  const owner = await requireCompanyOwner(locale);
  const t = await getTranslations("company");

  const emp = await getCompanyEmployee(owner.companyId, id);
  if (!emp) notFound();

  return (
    <div>
      <Link
        href="/company/employees"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        {t("backToEmployees")}
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{pick(emp.name, lo)}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">{emp.email}</p>
        {emp.title && <p className="text-sm text-subtle-foreground">{pick(emp.title, lo)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label={t("wallet")} value={formatCurrency(emp.walletBalance, lo, { compact: true })} />
        <StatTile label={t("monthSpend")} value={formatCurrency(emp.monthSpend, lo, { compact: true })} />
        <StatTile
          label={t("limit")}
          value={emp.spendLimit != null ? formatCurrency(emp.spendLimit, lo, { compact: true }) : t("noLimit")}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title={t("accessLimits")}>
          <div className="p-4 sm:p-5">
            <AccessEditor
              userId={emp.userId}
              initial={{ canSpend: emp.canSpend, canTopup: emp.canTopup, spendLimit: emp.spendLimit }}
            />
          </div>
        </Panel>

        <Panel title={t("fundWallet")}>
          <div className="p-4 sm:p-5">
            <FundWallet userId={emp.userId} />
            <p className="mt-3 text-xs text-subtle-foreground">
              {t("joined")}: {formatDate(emp.joined, lo)}
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title={t("recentTransactions")}>
          {emp.transactions.length === 0 ? (
            <Empty>{t("noTransactions")}</Empty>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
              <tbody>
                {emp.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">{pick(tx.merchant, lo)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{tx.category}</td>
                    <td
                      className={`px-5 py-3 text-end tnum font-medium ${tx.type === "income" ? "text-positive" : "text-foreground"}`}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatCurrency(Math.abs(tx.amount), lo, { decimals: 0 })}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-end text-xs text-muted-foreground">
                      {formatDate(tx.date, lo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
