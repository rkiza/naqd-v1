/**
 * Curated bilingual fallback responses for when no OPENROUTER_API_KEY is set —
 * so the assistant always works in a demo, offline. Keyed by simple intent
 * detection over the user's message.
 */
type Reply = { en: string; ar: string };

const replies: Record<string, Reply> = {
  coffee: {
    en: "You've spent about SAR 39 on coffee this month across 2 visits — nicely under control and 18% lower than last month. At this pace that's roughly SAR 470 a year.",
    ar: "أنفقت نحو ٣٩ ر.س على القهوة هذا الشهر في زيارتين — ضمن المعقول وأقل بنسبة ١٨٪ عن الشهر الماضي. بهذا المعدل ستنفق قرابة ٤٧٠ ر.س سنويًا.",
  },
  afford: {
    en: "Yes — a SAR 4,000 trip is comfortably affordable. You save around SAR 11,500 each month and hold SAR 92,650 in spendable balance. Paying for it would still keep your savings rate above 30%.",
    ar: "نعم — رحلة بـ ٤٬٠٠٠ ر.س في متناولك بسهولة. تدّخر نحو ١١٬٥٠٠ ر.س شهريًا ولديك رصيد متاح قدره ٩٢٬٦٥٠ ر.س. وحتى بعد دفعها سيبقى معدل ادخارك فوق ٣٠٪.",
  },
  cut: {
    en: "Your biggest opportunity is Shopping — you're 25% over budget there this month (SAR 2,248). Trimming it to your SAR 1,800 budget plus cancelling 2 overlapping subscriptions would free up about SAR 1,090 a month.",
    ar: "أكبر فرصة لديك في فئة التسوق — تجاوزت ميزانيتها بنسبة ٢٥٪ هذا الشهر (٢٬٢٤٨ ر.س). الالتزام بميزانية ١٬٨٠٠ ر.س مع إلغاء اشتراكين متداخلين يوفّر لك نحو ١٬٠٩٠ ر.س شهريًا.",
  },
  portfolio: {
    en: "Your portfolio is worth SAR 126,850 and is up 11.5% all-time — about 2.3% ahead of the TASI benchmark. Aramco and Al Rajhi are your strongest positions. It's well diversified across stocks, sukuk and gold.",
    ar: "قيمة محفظتك ١٢٦٬٨٥٠ ر.س وارتفعت ١١٫٥٪ منذ البداية — بنحو ٢٫٣٪ فوق مؤشر تاسي. أرامكو والراجحي أقوى مراكزك، ومحفظتك متنوعة جيدًا بين الأسهم والصكوك والذهب.",
  },
  save: {
    en: "You're saving about SAR 11,574 this month — a 50% savings rate, which is excellent. Automating an extra SAR 1,000 into your Sukuk fund would still leave plenty of buffer and grow your emergency goal faster.",
    ar: "تدّخر نحو ١١٬٥٧٤ ر.س هذا الشهر — معدل ادخار ٥٠٪ وهو ممتاز. أتمتة ١٬٠٠٠ ر.س إضافية في صندوق الصكوك ستُبقي لديك هامشًا وافرًا وتسرّع هدف الطوارئ.",
  },
  default: {
    en: "I can see your spending, budgets, portfolio and goals. Try asking about your coffee spend, where to cut back, whether you can afford something, or how your investments are doing.",
    ar: "أرى إنفاقك وميزانياتك ومحفظتك وأهدافك. جرّب أن تسألني عن إنفاقك على القهوة، أين يمكنك التوفير، هل تقدر على شراء معيّن، أو كيف أداء استثماراتك.",
  },
};

/* ------------------------------------------------------------------ */
/* Offline transaction intents — so send/buy/sell/list still produce   */
/* real confirmation cards when no OPENROUTER_API_KEY is configured.   */
/* ------------------------------------------------------------------ */

export type ScriptedIntent =
  | { kind: "send"; beneficiary: string; amount: number }
  | { kind: "send_pick"; amount: number }
  | { kind: "send_amount"; beneficiary: string }
  | { kind: "trade"; side: "buy_stock" | "sell_stock"; symbol: string; units: number }
  | { kind: "list" };

/** Convert Arabic-Indic digits to ASCII so amounts parse in both scripts. */
function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function firstNumber(s: string): number | null {
  const m = s.match(/\d[\d,]*(?:\.\d+)?/);
  return m ? Number(m[0].replace(/,/g, "")) : null;
}

/** Lightweight bilingual intent detection over the user's message. */
export function detectIntent(message: string): ScriptedIntent | null {
  const m = normalizeDigits(message).trim();
  const lower = m.toLowerCase();

  // Send money: "send 500 to sara" / "حوّل ٥٠٠ إلى سارة".
  // Amount without recipient ("send 150") → tappable beneficiary picker.
  // Recipient without amount ("send to sara") → amount-entry card.
  if (/(^|\s)(send|transfer)\s/.test(lower) || /(حوّل|حول|أرسل|ارسل|تحويل|إرسال)/.test(m)) {
    const amount = firstNumber(m);
    const to = m
      .match(/(?:\bto\b|إلى|الى|لـ)\s*(.+)$/i)?.[1]
      ?.trim()
      .replace(/[.!?،؟]+$/, "")
      .replace(/\s+(please|now|من فضلك|الآن)$/i, "");
    if (amount && to) return { kind: "send", beneficiary: to, amount };
    if (amount && !to) return { kind: "send_pick", amount };
    if (!amount && to) return { kind: "send_amount", beneficiary: to };
  }

  // Trades: "buy 5 shares of aramco" / "اشترِ ٣ أسهم أرامكو" / "sell 2 NVDA" / "بع سهمين"
  const isBuy = /(^|\s)(buy|purchase)\s/.test(lower) || /(اشتر|شراء)/.test(m);
  const isSell = /(^|\s)sell\s/.test(lower) || /(^|\s)(بع|بيع)/.test(m);
  if (isBuy || isSell) {
    const units = firstNumber(m) ?? 1;
    const rest = m
      .replace(/^.*?(buy|purchase|sell|اشتري|اشتر|شراء|بيع|بع)/i, "")
      .replace(/\d[\d,]*(?:\.\d+)?/g, "")
      .replace(/\b(shares?|stocks?|units?|of|in|from)\b/gi, "")
      .replace(/(أسهم|اسهم|سهم|من)/g, "")
      .replace(/[.!?،؟]+$/, "")
      .trim();
    if (rest) return { kind: "trade", side: isBuy ? "buy_stock" : "sell_stock", symbol: rest, units };
  }

  // List positions: "list my stocks" / "أسهمي" / "محفظة التداول"
  if (
    /(list|show|view|what).*(stocks?|positions?|holdings?|shares)/.test(lower) ||
    /(my stocks|my positions|my shares|my holdings)/.test(lower) ||
    /(أسهمي|اسهمي|مراكزي|محفظتي|محفظة التداول)/.test(m)
  ) {
    return { kind: "list" };
  }

  return null;
}

/** Canned lines around cards + localized validation errors for the offline path. */
const actionText: Record<string, Reply> = {
  proposal: {
    en: "I've set it up — review the details below and tap **Confirm** to execute it, or **Cancel** to discard it.",
    ar: "جهّزت لك العملية — راجع التفاصيل بالأسفل ثم اضغط **تأكيد** لتنفيذها، أو **إلغاء** لإلغائها.",
  },
  list: {
    en: "Here are your current positions and available trading cash.",
    ar: "هذه مراكزك الحالية والنقد المتاح للتداول.",
  },
  pickRecipient: {
    en: "Sure — who would you like to send it to? Pick a beneficiary below.",
    ar: "تمام — لمن تريد التحويل؟ اختر مستفيدًا من القائمة بالأسفل.",
  },
  askAmount: {
    en: "How much would you like to send? Pick a quick amount or type one below.",
    ar: "كم تريد أن ترسل؟ اختر مبلغًا سريعًا أو أدخله بالأسفل.",
  },
  invalid_amount: {
    en: "That amount doesn't look right — try a positive number, like 250.",
    ar: "المبلغ غير صحيح — جرّب رقمًا موجبًا مثل ٢٥٠.",
  },
  amount_too_large: {
    en: "That's above the SAR 1,000,000 per-transaction demo limit. Try a smaller amount.",
    ar: "هذا يتجاوز الحد التجريبي للعملية الواحدة (١٬٠٠٠٬٠٠٠ ر.س). جرّب مبلغًا أصغر.",
  },
  beneficiary_not_found: {
    en: "I couldn't find that person in your saved beneficiaries. You can add them from the Payments page, then ask me again.",
    ar: "لم أجد هذا الاسم ضمن المستفيدين المحفوظين لديك. أضِفه من صفحة المدفوعات ثم اطلب مني مجددًا.",
  },
  no_account: {
    en: "I couldn't find a wallet account to send from.",
    ar: "لم أجد حساب محفظة يمكن التحويل منه.",
  },
  insufficient_funds: {
    en: "That's more than your available balance, so I can't prepare the transfer.",
    ar: "المبلغ أكبر من رصيدك المتاح، لذا لا يمكنني تجهيز التحويل.",
  },
  spend_not_allowed: {
    en: "Outgoing transfers are disabled for your account by your company. Your company owner can re-enable them.",
    ar: "التحويلات الصادرة معطّلة لحسابك من قبل شركتك. يمكن لمالك الشركة إعادة تفعيلها.",
  },
  over_spend_limit: {
    en: "That exceeds the spend limit your company set for you, so I can't prepare it.",
    ar: "هذا يتجاوز حد الإنفاق الذي حددته شركتك لك، لذا لا يمكنني تجهيزه.",
  },
  unknown_symbol: {
    en: "I couldn't find that stock in the naqd catalog. Try a Tadawul symbol like 2222 (Aramco) or a US one like AAPL.",
    ar: "لم أجد هذا السهم في قائمة نقد. جرّب رمزًا من تداول مثل 2222 (أرامكو) أو أمريكيًا مثل AAPL.",
  },
  invalid_units: {
    en: "The number of shares doesn't look right — try a positive number, like 5.",
    ar: "عدد الأسهم غير صحيح — جرّب رقمًا موجبًا مثل ٥.",
  },
  insufficient_cash: {
    en: "You don't have enough trading cash for that order.",
    ar: "لا يوجد لديك نقد كافٍ في حساب التداول لهذا الأمر.",
  },
  insufficient_units: {
    en: "You don't hold that many shares to sell.",
    ar: "لا تملك هذا العدد من الأسهم لبيعه.",
  },
};

export function scriptedActionText(
  key: string,
  locale: "en" | "ar",
  detail?: string,
): string {
  const base = (actionText[key] ?? actionText.proposal)[locale];
  return detail ? `${base} (${detail})` : base;
}

export function scriptedReply(message: string, locale: "en" | "ar"): string {
  const m = message.toLowerCase();
  let key: keyof typeof replies = "default";
  if (/(coffee|قهو)/.test(m)) key = "coffee";
  else if (/(afford|trip|travel|أقدر|رحل|سفر|أستطيع)/.test(m)) key = "afford";
  else if (/(cut|reduce|spend less|save more on|تقليل|أقلل|قلّل|أخفّض)/.test(m)) key = "cut";
  else if (/(portfolio|invest|stock|shares|محفظ|استثمار|أسهم|تاسي|سهم)/.test(m)) key = "portfolio";
  else if (/(save|saving|budget|ادخار|أدخر|أوفّر|أوفر|توفير|ميزاني)/.test(m)) key = "save";
  return replies[key][locale];
}
