"use client";

// Global scroll progress ref — avoids React re-renders on every scroll tick.
// Three.js reads this in useFrame; HTML sections read via the event emitter.

export const scrollState = {
  progress: 0,       // 0–1 overall
  velocity: 0,       // pixels/second
  direction: 1 as 1 | -1,
  raw: 0,            // raw scrollY pixels
};

type Listener = (progress: number) => void;
const listeners = new Set<Listener>();

export function onScrollProgress(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function updateScrollProgress(scrollY: number, velocity: number, maxScroll: number) {
  const prev = scrollState.progress;
  scrollState.progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
  scrollState.velocity = velocity;
  scrollState.direction = scrollState.progress >= prev ? 1 : -1;
  scrollState.raw = scrollY;
  listeners.forEach(fn => fn(scrollState.progress));
}
