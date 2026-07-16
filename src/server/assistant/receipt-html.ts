import type { Locale } from "@/i18n/routing";
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import { pick, type Localized } from "@/lib/localized";
import type { ActionPayload } from "./actions";

/**
 * Self-contained HTML for a transaction receipt, rendered to a real PDF by
 * WeasyPrint. Mirrors the in-chat receipt card: naqd brand mark, executed
 * pill, hero amount with the official Riyal glyph, dashed tear-line, detail
 * rows and a sawtooth torn-paper bottom edge — on the app's light theme.
 */

const RIYAL_SVG = (size: string, color: string) => `
<svg viewBox="0 0 1124.14 1256.39" style="width:${size};height:${size};fill:${color};vertical-align:-0.06em">
  <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
  <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
</svg>`;

const LOGO_SVG = `
<svg viewBox="0 0 55 40" style="width:14px;height:10px;fill:#2f9500">
  <path d="M23.6322 0.597911C19.9395 1.76672 16.9327 5.48248 10.9192 12.914C3.501 22.0814 -0.208097 26.665 0.00900851 30.5474C0.155095 33.1598 1.30933 35.6108 3.22485 37.3763C6.07159 40 11.9392 40 23.6745 40H24.3275C27.1975 40 29.9133 38.6992 31.7186 36.4682C37.6627 29.1224 40.6348 25.4496 44.4744 24.8957C45.4078 24.7611 46.3555 24.7611 47.2889 24.8957C49.8634 25.2671 52.048 27.0408 55 30.3839C50.2776 21.5248 41.6084 3.83856 31.37 0.597911C28.8514 -0.199304 26.1508 -0.199304 23.6322 0.597911Z"/>
</svg>`;

const CHECK_SVG = `
<svg viewBox="0 0 52 52" style="width:9px;height:9px;">
  <circle cx="26" cy="26" r="23" fill="none" stroke="#1ba94c" stroke-width="4"/>
  <path d="M16 26.5l6.5 6.5L37 19" fill="none" stroke="#1ba94c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const T = {
  en: {
    receiptSend: "Transfer receipt",
    receiptOrder: "Order receipt",
    executed: "Executed",
    to: "To",
    buy: "Buy order",
    sell: "Sell order",
    date: "Date",
    reference: "Reference",
    bank: "Bank",
    note: "Note",
    units: "Shares",
    price: "Price / share",
    balanceAfter: "Balance after",
    cashAfter: "Trading cash after",
    footer: "naqd — simulated demo receipt, not a real financial document",
  },
  ar: {
    receiptSend: "إيصال التحويل",
    receiptOrder: "إيصال الأمر",
    executed: "تم التنفيذ",
    to: "إلى",
    buy: "أمر شراء",
    sell: "أمر بيع",
    date: "التاريخ",
    reference: "المرجع",
    bank: "البنك",
    note: "ملاحظة",
    units: "عدد الأسهم",
    price: "سعر السهم",
    balanceAfter: "الرصيد بعد العملية",
    cashAfter: "نقد التداول بعد العملية",
    footer: "نقد — إيصال تجريبي (محاكاة)، ليس مستندًا ماليًا حقيقيًا",
  },
} as const;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** SAR with the Riyal glyph; other currencies as plain code + number. */
function money(value: number, locale: Locale, currency = "SAR", size = "8px", color = "#0a0d0a") {
  const n = formatNumber(value, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency !== "SAR") return `<span class="num">${currency === "USD" ? "$" : esc(currency) + " "}${n}</span>`;
  return `${RIYAL_SVG(size, color)}&nbsp;<span class="num">${n}</span>`;
}

export type ReceiptAction = {
  id: string;
  type: string;
  payload: ActionPayload;
  result: { newBalance?: number; newCash?: number } | null;
  executedAt: Date | null;
};

export function receiptHtml(action: ReceiptAction, locale: Locale): string {
  const t = T[locale];
  const p = action.payload;
  const isSend = p.kind === "send_money";
  const isBuy = p.kind === "buy_stock";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const executed = action.executedAt ?? new Date();
  const reference = action.id.slice(-8).toUpperCase();
  const amount = isSend ? p.amount : p.totalSar;
  const after = isSend
    ? (action.result?.newBalance ?? p.balanceBefore - p.amount)
    : (action.result?.newCash ?? (isBuy ? p.cashBefore - p.totalSar : p.cashBefore + p.totalSar));

  const name = (v: Localized) => esc(pick(v, locale));
  const subLine = isSend
    ? `${t.to} ${name(p.beneficiaryName)}${pick(p.bank, locale) ? ` · ${name(p.bank)}` : ""}`
    : `${isBuy ? t.buy : t.sell} · ${name(p.name)} (${esc(p.symbol)})`;

  const row = (label: string, value: string) =>
    `<tr><td class="lbl">${esc(label)}</td><td class="val">${value}</td></tr>`;

  // "·" renders confusingly next to Arabic-Indic digits; use the Arabic comma.
  const dateSep = locale === "ar" ? "، " : " · ";
  const rows = [
    row(t.date, `<span class="num">${esc(formatDate(executed, locale))}${dateSep}${esc(formatTime(executed, locale))}</span>`),
    row(t.reference, `<span class="num ltr">${esc(reference)}</span>`),
    ...(isSend
      ? [
          row(t.bank, `${name(p.bank)} <span class="muted num ltr">…${esc(p.ibanLast4)}</span>`),
          ...(p.note ? [row(t.note, esc(p.note))] : []),
          row(t.balanceAfter, money(after, locale)),
        ]
      : [
          row(t.units, `<span class="num">${esc(formatNumber(p.units, locale))}</span>`),
          row(t.price, money(p.price, locale, p.currency)),
          row(t.cashAfter, money(after, locale)),
        ]),
  ].join("");

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<style>
  @page { size: 108mm 94mm; margin: 9mm; background: #f2f4f2; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, "Geeza Pro", "IBM Plex Sans Arabic", sans-serif;
    color: #0a0d0a; font-size: 9px; line-height: 1.45;
  }
  .num { font-variant-numeric: tabular-nums; }
  .ltr { direction: ltr; unicode-bidi: embed; }
  .muted { color: #6b736b; }
  .paper {
    background: #ffffff; border: 1px solid #e7e9e7; border-bottom: none;
    border-radius: 12px 12px 0 0; padding: 14px 16px 12px;
  }
  .head { width: 100%; }
  .head td { vertical-align: middle; }
  .brand-tile {
    display: inline-block; background: #eafbe0; border-radius: 6px; padding: 5px 6px 3px;
  }
  .title { font-size: 10px; font-weight: 700; padding-${dir === "rtl" ? "right" : "left"}: 7px; }
  .pill {
    background: #e6f6ec; color: #1ba94c; border-radius: 999px;
    font-size: 8px; font-weight: 600; padding: 3px 8px; white-space: nowrap;
  }
  .hero { text-align: center; margin: 16px 0 4px; }
  .hero .amount { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .hero .sub { color: #6b736b; margin-top: 4px; font-size: 8.5px; }
  .tear { border: none; border-top: 1.2px dashed #d7dad7; margin: 13px 0; }
  table.rows { width: 100%; border-collapse: collapse; }
  table.rows td { padding: 3.5px 0; font-size: 8.5px; }
  td.lbl { color: #6b736b; }
  td.val { text-align: ${dir === "rtl" ? "left" : "right"}; font-weight: 600; }
  .footer { margin-top: 13px; text-align: center; color: #99a099; font-size: 7px; }
  .sawtooth {
    height: 7px;
    background:
      linear-gradient(45deg, #ffffff 5px, transparent 0) 0 0 / 14px 14px repeat-x,
      linear-gradient(-45deg, #ffffff 5px, transparent 0) 7px 0 / 14px 14px repeat-x;
  }
</style>
</head>
<body>
  <div class="paper">
    <table class="head"><tr>
      <td><span class="brand-tile">${LOGO_SVG}</span><span class="title">${isSend ? t.receiptSend : t.receiptOrder}</span></td>
      <td style="text-align:${dir === "rtl" ? "left" : "right"}"><span class="pill">${CHECK_SVG} ${t.executed}</span></td>
    </tr></table>

    <div class="hero">
      <div class="amount ltr">${money(amount, locale, "SAR", "17px")}</div>
      <div class="sub">${subLine}</div>
    </div>

    <hr class="tear">
    <table class="rows">${rows}</table>
    <hr class="tear">
    <div class="footer">${t.footer}</div>
  </div>
  <div class="sawtooth"></div>
</body>
</html>`;
}
