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
