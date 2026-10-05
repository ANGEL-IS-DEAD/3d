"use client";

// Floating glass navigation pill - logo, section links with scroll-spy highlighting, the
// call-to-action, and a mobile hamburger that opens a full-screen menu. Hides when
// scrolling down and reveals when scrolling up.
//
// Link labels and their scroll targets come from `nav` in site.config.ts.
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LogoPlaceholder from "./LogoPlaceholder";
import { onScrollProgress } from "@/lib/scrollStore";
import { toggleTheme, onThemeChange, getThemeMode, type ThemeMode } from "@/lib/themeStore";
import { nav, navTargetFor, ui } from "@/site.config";

// --- Nav scroll targets, derived from config -------------------------------
const ALL_LINKS = [...nav.links, nav.cta];

const NAV_TARGETS: Record<string, number> = Object.fromEntries(
  ALL_LINKS.map((l) => [l.label, navTargetFor(l.target)]),
);

const ACTIVE_MAP = ALL_LINKS.map((l) => ({ min: l.from, max: l.to, key: l.label }));

const EXPO = [0.16, 1, 0.3, 1] as const;

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [theme, setThemeMode] = useState<ThemeMode>(() => getThemeMode());
  const lastY = useRef(0);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  // Keep the toggle icon in sync with the global theme store
  useEffect(() => onThemeChange(setThemeMode), []);

  // Scroll-progress percent (mobile) — written straight to the DOM to avoid re-renders
  useEffect(() => onScrollProgress((p) => {
    const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);
    if (pctRef.current) pctRef.current.textContent = `${pct}%`;
    if (barRef.current) barRef.current.style.width = `${pct}%`;
  }), []);

  // Active-link highlighting from scroll progress
  useEffect(() => {
    return onScrollProgress((p) => {
      const match = ACTIVE_MAP.find((s) => p >= s.min && p <= s.max);
      setActiveLink(match?.key ?? null);
    });
  }, []);

  // Shrink when scrolled; gently hide on fast scroll-down, reveal on scroll-up
  useEffect(() => {
    let ticking = false;
    const handle = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        if (!menuOpen) {
          if (y > lastY.current + 6 && y > 200) setHidden(true);
          else if (y < lastY.current - 6) setHidden(false);
        }
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, [menuOpen]);

  useEffect(() => { if (menuOpen) setHidden(false); }, [menuOpen]);

  const scrollTo = useCallback((link: string) => {
    const frac = NAV_TARGETS[link] ?? 0;
    window.scrollTo({ top: Math.round(frac * document.documentElement.scrollHeight), behavior: "smooth" });
    setMenuOpen(false);
  }, []);

  return (
    <>
      {/* -- Floating glass pill ----------------------------------------------- */}
      <motion.nav
        className="fixed left-1/2 z-50"
        initial={{ opacity: 0, y: -22, filter: "blur(10px)", x: "-50%" }}
        animate={{
          opacity: hidden ? 0 : 1,
          y: hidden ? -28 : (scrolled ? 10 : 18),
          filter: "blur(0px)",
          x: "-50%",
        }}
        transition={{ duration: 0.9, ease: EXPO }}
      >
        <motion.div
          className="glass-panel flex items-center"
          animate={{
            paddingTop: scrolled ? 8 : 11,
            paddingBottom: scrolled ? 8 : 11,
            paddingLeft: scrolled ? 14 : 18,
            paddingRight: scrolled ? 8 : 10,
          }}
          transition={{ duration: 0.5, ease: EXPO }}
          whileHover={{ y: -2 }}
          style={{
            // gap is set statically (not animated): Framer Motion can't animate
            // the `gap` shorthand from its initial computed value of "normal".
            gap: 14,
            borderRadius: "var(--r-pill)",
            // Refined glass — subtle vertical gradient, crisper border, deeper blur,
            // top highlight + bottom shade for dimensional depth.
            background: "linear-gradient(180deg, rgba(36,30,46,0.6) 0%, rgba(17,14,23,0.72) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(22px) saturate(1.3)",
            WebkitBackdropFilter: "blur(22px) saturate(1.3)",
            boxShadow: "var(--shadow-ambient), 0 0 38px -10px var(--purple-glow), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.28)",
          }}
        >
          {/* Wordmark — see LogoPlaceholder.tsx to swap in an image logo */}
          <div className="flex-none">
            <LogoPlaceholder size="md" />
          </div>

          {/* Subtle divider between logo and links (desktop) */}
          <span
            className="hidden md:block flex-none"
            style={{ width: 1, height: 18, background: "rgba(255,255,255,0.14)" }}
          />

          {/* Center links (desktop) */}
          <ul className="hidden md:flex items-center gap-3 list-none">
            {nav.links.map(({ label }) => {
              const isActive = activeLink === label;
              return (
                <li key={label} className="relative">
                  <button
                    onClick={() => scrollTo(label)}
                    className="relative bg-transparent border-none flex items-center px-3 py-2 rounded-full"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 400,
                      fontSize: "0.62rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: isActive ? "#ffffff" : "var(--text-muted)",
                      transition: "color 0.4s cubic-bezier(0.16,1,0.3,1)",
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                  >
                    {/* Sliding purple active pill */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 -z-[1]"
                        style={{
                          borderRadius: "var(--r-pill)",
                          background: "var(--purple)",
                          boxShadow: "0 6px 20px -6px var(--purple-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Scroll-progress badge (mobile only) — % read + tiny gold track */}
          <div
            className="md:hidden flex-none flex flex-col items-end justify-center"
            style={{ gap: 3, paddingRight: 2 }}
            aria-hidden="true"
          >
            <span
              ref={pctRef}
              style={{
                fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "0.58rem",
                letterSpacing: "0.06em", color: "var(--gold-bright)",
                fontVariantNumeric: "tabular-nums", lineHeight: 1, minWidth: "3ch", textAlign: "right",
              }}
            >0%</span>
            <span style={{ display: "block", width: 26, height: 2, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
              <span ref={barRef} style={{ display: "block", width: "0%", height: "100%", borderRadius: 999, background: "var(--gold)", boxShadow: "0 0 6px var(--gold)" }} />
            </span>
          </div>

          {/* Day / night theme toggle — visible on all sizes */}
          <button
            onClick={() => toggleTheme()}
            aria-label={theme === "night" ? "Switch to day" : "Switch to night"}
            title={theme === "night" ? "Switch to day" : "Switch to night"}
            className="flex-none inline-flex items-center justify-center"
            style={{
              width: 34, height: 34, borderRadius: "999px",
              background: theme === "night" ? "rgba(124,79,232,0.22)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: theme === "night" ? "var(--purple-soft)" : "#ffd27a",
              transition: "background 0.4s ease, color 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            {theme === "night" ? (
              // Moon
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              // Sun
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>

          {/* CTA - attached to the pill */}
          <button
            onClick={() => scrollTo(nav.cta.label)}
            className="hidden md:inline-flex items-center flex-none"
            style={{
              borderRadius: "var(--r-pill)",
              background: activeLink === nav.cta.label ? "var(--orange)" : "var(--purple)",
              color: "#ffffff",
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: "0.62rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              padding: "9px 20px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 22px -10px var(--purple-glow)",
              transition: "background-color 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--orange)";
              el.style.transform = "translateY(-2px) scale(1.04)";
              el.style.boxShadow = "0 14px 34px -10px var(--orange-glow), inset 0 1px 0 rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = activeLink === nav.cta.label ? "var(--orange)" : "var(--purple)";
              el.style.transform = "translateY(0) scale(1)";
              el.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 22px -10px var(--purple-glow)";
            }}
          >
            {nav.cta.label}
          </button>

          {/* Menu toggle (mobile) — elegant 2×2 dot grid that morphs to an X.
              Matches the circular theme-toggle button for a cohesive pair. */}
          <button
            className="md:hidden flex-none inline-flex items-center justify-center"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              width: 34, height: 34, borderRadius: "999px",
              background: menuOpen ? "rgba(124,79,232,0.22)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: menuOpen ? "var(--purple-soft)" : "#fff",
              transition: "background 0.4s ease, color 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            {menuOpen ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                <circle cx="5" cy="5" r="1.7" />
                <circle cx="13" cy="5" r="1.7" />
                <circle cx="5" cy="13" r="1.7" />
                <circle cx="13" cy="13" r="1.7" />
              </svg>
            )}
          </button>
        </motion.div>
      </motion.nav>

      {/* -- Mobile full-screen menu -------------------------------------------- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-1 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EXPO }}
            style={{
              background: "rgba(5,5,5,0.94)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="mb-8"><LogoPlaceholder size="lg" /></div>
            <div className="divider-glow w-24 mb-8" />
            {ALL_LINKS.map(({ label }, i) => {
              const isCta = label === nav.cta.label;
              return (
                <motion.button
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i + 0.1, duration: 0.5, ease: EXPO }}
                  onClick={() => scrollTo(label)}
                  className="bg-transparent border-none py-3"
                  style={{
                    fontFamily: isCta ? "var(--font-sans)" : "var(--font-serif)",
                    fontWeight: 300,
                    fontSize: isCta ? "0.72rem" : "2.6rem",
                    letterSpacing: isCta ? "0.4em" : "0.02em",
                    textTransform: isCta ? "uppercase" : "none",
                    color: activeLink === label ? "var(--purple-soft)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </motion.button>
              );
            })}
            <button
              className="absolute bottom-10 bg-transparent border-none"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--text-dim)" }}
            >
              {ui.closeLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

