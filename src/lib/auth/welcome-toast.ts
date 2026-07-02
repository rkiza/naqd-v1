export const WELCOME_TOAST_KEY = "naqd-welcome";

export function markWelcomeToast() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WELCOME_TOAST_KEY, "1");
}

export function consumeWelcomeToast(): boolean {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(WELCOME_TOAST_KEY) !== "1") return false;
  sessionStorage.removeItem(WELCOME_TOAST_KEY);
  return true;
}
