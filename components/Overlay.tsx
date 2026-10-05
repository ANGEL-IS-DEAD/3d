"use client";

// Cinematic 2D overlay layers (no 3D) — a scroll-reactive hero blur that clears as you
// enter, a vignette, a top-nav gradient and a bottom scrim. Sits above the canvas, below UI text.
//
// Scroll-reactive values are written straight to the DOM via refs (no React state) so this
// component never re-renders on scroll — the per-frame work is a couple of style mutations
// instead of a full reconcile. The hero backdrop-blur is the single most expensive layer,
// so its strength is capped lower on mobile.
import { useEffect, useRef } from "react";
import { onScrollProgress, scrollState } from "@/lib/scrollStore";
import { IS_MOBILE } from "@/lib/device";

// Static cinematic film grain (SVG turbulence, encoded once) — adds texture to flat
// gradients. Single static layer, composited by the GPU, so it costs nothing per frame.
const GRAIN_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default function Overlay() {
  const blurRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero blur: full strength on desktop, gentler on mobile (full-screen backdrop-filter
    // is the heaviest compositing op on phones). Fully clears by 20% scroll either way.
    const maxBlur = IS_MOBILE ? 12 : 22;

    const update = (progress: number) => {
      // ── Hero scene blur ──
      const heroBlur = Math.max(0, maxBlur * (1 - progress / 0.2));
      const blurEl = blurRef.current;
      if (blurEl) {
        if (heroBlur > 0.1) {
          const f = `blur(${heroBlur.toFixed(2)}px)`;
          blurEl.style.backdropFilter = f;
          blurEl.style.setProperty("-webkit-backdrop-filter", f);
          blurEl.style.opacity = "1";
        } else if (blurEl.style.opacity !== "0") {
          // Drop the filter entirely once clear so an idle blur layer isn't re-composited.
          blurEl.style.backdropFilter = "none";
          blurEl.style.setProperty("-webkit-backdrop-filter", "none");
          blurEl.style.opacity = "0";
        }
      }

      // ── Vignette (deepens slightly toward night) ──
      if (vignetteRef.current) {
        const a = (0.5 + progress * 0.2).toFixed(2);
        vignetteRef.current.style.background = `radial-gradient(ellipse at center, transparent 30%, rgba(6,4,12,${a}) 100%)`;
      }

      // ── Bottom scrim for final scenes ──
      if (scrimRef.current) {
        const scrim = Math.max(0, Math.min(0.82, (progress - 0.65) * 2.6));
        scrimRef.current.style.opacity = scrim.toFixed(2);
      }
    };

    update(scrollState.progress); // seed initial state (load / refresh-at-position)
    return onScrollProgress(update);
  }, []);

  return (
    <>
      {/* ── Hero scene blur ────────────────────────────────────────────────
          Sits above the 3D canvas (z-1) but below all UI text (z-10+).
          As scroll progress rises the blur melts away — the world sharpens. */}
      <div
        ref={blurRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          opacity: 1,
          backdropFilter: `blur(${IS_MOBILE ? 12 : 22}px)`,
          WebkitBackdropFilter: `blur(${IS_MOBILE ? 12 : 22}px)`,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Cinematic vignette — layered black with a faint purple cast in the corners */}
      <div
        ref={vignetteRef}
        className="fixed inset-0 pointer-events-none z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(6,4,12,0.50) 100%)",
        }}
      />

      {/* Static film grain — subtle cinematic texture over the gradients */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-20"
        style={{
          backgroundImage: `url("${GRAIN_URL}")`,
          backgroundSize: "180px 180px",
          opacity: IS_MOBILE ? 0.035 : 0.05,
          mixBlendMode: "soft-light",
        }}
      />

      {/* Top nav gradient */}
      <div
        className="fixed top-0 left-0 right-0 h-36 pointer-events-none z-20"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
        }}
      />

      {/* Bottom scrim for feature wall / join scenes — faint purple in the deep */}
      <div
        ref={scrimRef}
        className="fixed bottom-0 left-0 right-0 pointer-events-none z-20"
        style={{
          height: "45%",
          background:
            "linear-gradient(to top, rgba(5,3,10,0.92) 0%, rgba(5,3,10,0.45) 40%, transparent 100%)",
          opacity: 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* Persistent subtle bottom edge */}
      <div
        className="fixed bottom-0 left-0 right-0 h-20 pointer-events-none z-20"
        style={{
          background: "linear-gradient(to top, rgba(10,8,6,0.40) 0%, transparent 100%)",
        }}
      />
    </>
  );
}
