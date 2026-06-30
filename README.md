<div align="center">

# naqd · نقد

**A premium, fully bilingual Saudi fintech experience.**

Spending · Investing · Payments · An AI money assistant — in Arabic (RTL) and English (LTR).

</div>

---

## Highlights

- **Truly bilingual** — Arabic (RTL) + English (LTR), switchable instantly from the UI. Every visible string flows through [`next-intl`](https://next-intl.dev); zero hardcoded copy. Identical 364-key catalogs (`src/messages/{en,ar}.json`).
- **Native RTL** — logical-property layout (`ms`/`me`/`ps`/`pe`), mirrored navigation, drawer, switches, and charts. Icons mirror where meaningful (`.rtl-flip`).
- **Premium typography** — [Geist](https://vercel.com/font) for English, **IBM Plex Sans Arabic** for Arabic, wired via `next/font`.
- **Locale-aware everything** — numbers, currency (SAR), percentages, and dates all reformat per locale, including Arabic-Indic digits. See `src/lib/format.ts`.
- **Light & dark** — light is the default; dark mode is fully wired through the same CSS-variable token system (`next-themes`, class strategy).
- **Custom charts** — dependency-free, animated SVG area/line, grouped bars, donut, and sparkline that adapt to RTL and locale formatting (`src/components/charts`).
- **Real AI assistant** — streams from the **Claude API** (`/api/chat`), grounded in the user's live financial snapshot, replying in the active language. Falls back to curated bilingual responses when no API key is present, so it always works in a demo.
- **Production-ready architecture** — feature-based folders, typed centralized demo data, reusable UI + business components, centralized constants and translations.

## Screens

Dashboard · Wallet · Transactions · Payments · Virtual Card · Portfolio · Investment · Analytics · Insights · AI Assistant · Notifications · Settings — plus a marketing landing page.

## Tech

- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first tokens) · **next-intl** · **next-themes** · **motion** · **lucide-react**
- **@anthropic-ai/sdk** for the AI assistant

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for the live AI assistant
npm run dev                  # http://localhost:3000  → redirects to /en
```

Visit `/ar` for the Arabic (RTL) experience, or switch languages from the top bar.

### Environment

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables the live Claude-powered assistant. Without it, the assistant uses curated bilingual demo responses. |
| `ANTHROPIC_MODEL` | Model id for the assistant (default `claude-sonnet-4-6`). |

## Scripts

```bash
npm run dev        # development
npm run build      # production build (all routes prerendered per locale)
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
```

## Project structure

```
src/
  app/
    [locale]/            # localized routes
      (app)/             # authenticated app shell + 12 screens
      page.tsx           # landing
    api/chat/            # Claude-powered assistant (streaming + fallback)
  components/
    ui/                  # reusable primitives (Button, Card, Switch, …)
    charts/              # locale + RTL-aware SVG charts
    layout/              # sidebar, topbar, switchers, app shell
    finance/             # business components (card, transaction row, …)
  features/              # one folder per screen
  data/                  # typed, centralized, bilingual demo data
  i18n/                  # next-intl routing + request config
  messages/              # en.json · ar.json
  lib/                   # format, localized, utils
```

---

<div align="center">
<sub>naqd is a product demo, not a licensed financial institution.</sub>
</div>
