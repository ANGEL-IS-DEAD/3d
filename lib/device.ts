// Client-only mobile detection. Guarded so it's also safe if imported server-side
// (returns false during SSR; the real 3D scene is client-only via dynamic import).

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || navigator.maxTouchPoints > 0;
}

// Evaluated once at import. In client-only 3D modules this reflects the real device;
// in any SSR context it resolves to false (no window).
export const IS_MOBILE = isMobile();
