"use client";

// Global day/night theme — shared between the DOM navbar (React) and the 3D scene
// (R3F, which lives in a separate React tree inside <Canvas>). Like scrollStore, the
// 3D side reads `themeState.night` every frame and eases its own value toward it, so
// the theme change animates smoothly; the navbar subscribes for the button icon.

export type ThemeMode = "day" | "night";

export const themeState = {
  night: 0, // target: 0 = day (light), 1 = night (dark) — 3D code eases toward this
};

let mode: ThemeMode = "day";
type Listener = (mode: ThemeMode) => void;
const listeners = new Set<Listener>();

export function getThemeMode() {
  return mode;
}

export function setTheme(next: ThemeMode) {
  mode = next;
  themeState.night = next === "night" ? 1 : 0;
  listeners.forEach((fn) => fn(mode));
}

export function toggleTheme() {
  setTheme(mode === "day" ? "night" : "day");
}

export function onThemeChange(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
