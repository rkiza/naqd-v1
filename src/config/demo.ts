/**
 * The seeded demo accounts surfaced on the public /demo page. The admin account
 * is deliberately excluded and must never be listed here.
 */
export const DEMO_PASSWORD = "demo1234";

/** Curated order: personal first, then the company owner, then employees. */
export const DEMO_EMAILS = [
  "fahad@naqd.sa",
  "ceo@rkiza.sa",
  "sara@rkiza.sa",
  "omar@rkiza.sa",
] as const;
