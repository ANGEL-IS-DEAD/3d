"use client";

// Scroll-driven content layer — every panel fades/translates in and out over a window of
// scroll progress, synced to the 3D camera journey.
//
// NOTHING in this file is brand-specific: the hero, the copy panels, the gallery, the
// events card and the contact card all read their content from site.config.ts. Edit that
// file to make the site yours; edit this one only to change how a panel *looks*.
import { useEffect, useMemo, useRef, useState } from "react";
import { onScrollProgress, scrollState } from "@/lib/scrollStore";
import SocialIcon, { Arrow } from "@/components/SocialIcons";
import {
  brand,
  contact,
  copyPanels,
  events,
  gallery,
  hero,
  ui,
  type CopyPanel,
} from "@/site.config";

interface Panel {
  id: string;
  start: number;
  end: number;
  content: React.ReactNode;
  align: "center" | "left" | "right";
  valign: "top" | "center" | "bottom";
  staticStart?: boolean;
  staticEnd?: boolean;
  maxWidth?: string;
}

// Scroll-reactive panel — fades/translates in over its progress window. The wrapper's
// opacity / transform / visibility are written straight to the DOM each scroll tick (no
// React state), so the panel's content subtree (incl. the heavy contact & events cards) is
// rendered exactly once and never reconciled on scroll. Hidden panels are visibility:hidden
// (out of layout cost, not hit-tested) rather than unmounted.
function ScenePanel({ panel }: { panel: Panel }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = (progress: number) => {
      const el = ref.current;
      if (!el) return;

      const inRange = progress >= panel.start - 0.005 && progress <= panel.end + 0.005;
      if (!inRange) {
        if (el.style.visibility !== "hidden") {
          el.style.visibility = "hidden";
          el.style.opacity = "0";
        }
        return;
      }

      const localT = (progress - panel.start) / (panel.end - panel.start);
      const clampedT = Math.max(0, Math.min(1, localT));
      const fadeWindow = 0.18;

      const opacity =
        panel.staticStart && clampedT < fadeWindow ? 1
        : clampedT < fadeWindow ? clampedT / fadeWindow
        : panel.staticEnd && clampedT > 1 - fadeWindow ? 1
        : clampedT > 1 - fadeWindow ? (1 - clampedT) / fadeWindow
        : 1;

      const translateY =
        panel.staticStart && clampedT < fadeWindow ? 0
        : clampedT < fadeWindow ? (1 - clampedT / fadeWindow) * 28
        : clampedT > 1 - fadeWindow && !panel.staticEnd ? ((clampedT - (1 - fadeWindow)) / fadeWindow) * -20
        : 0;

      el.style.visibility = "visible";
      el.style.opacity = String(opacity);
      el.style.transform = `translateY(${translateY}px)`;
    };

    update(scrollState.progress); // seed initial state (load / refresh-at-position)
    return onScrollProgress(update);
  }, [panel]);

  const alignClass = { center: "items-center text-center", left: "items-start text-left", right: "items-end text-right" }[panel.align];
  const valignClass = { top: "justify-start pt-24 sm:pt-32", center: "justify-center", bottom: "justify-end pb-20 sm:pb-28" }[panel.valign];

  return (
    <div
      ref={ref}
      className={`fixed inset-0 z-10 flex flex-col pointer-events-none ${alignClass} ${valignClass}`}
      style={{
        opacity: 0,
        visibility: "hidden",
        transform: "translateY(28px)",
        willChange: "opacity, transform",
        padding: "0 clamp(1.25rem, 5vw, 5rem)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: panel.maxWidth ?? "min(560px, 100%)", width: panel.maxWidth ? "100%" : undefined, flexShrink: 0 }}>
        {panel.content}
      </div>
    </div>
  );
}

function ScrollIndicator() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = (progress: number) => {
      if (ref.current) ref.current.style.opacity = progress < 0.05 ? "1" : "0";
    };
    update(scrollState.progress);
    return onScrollProgress(update);
  }, []);
  return (
    <div ref={ref} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 transition-opacity duration-1000"
      style={{ opacity: 1, pointerEvents: "none" }}>
      <div className="w-px h-12 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-b from-transparent via-[var(--gold)] to-transparent"
          style={{ animation: "scroll-line 1.8s ease-in-out infinite" }} />
      </div>
      <span className="font-ui text-[0.5rem] tracking-[0.45em] text-[var(--text-dim)]">{ui.scrollHint}</span>
      <style>{`
        @keyframes scroll-line {
          0%   { transform: translateY(-100%); opacity: 0; }
          30%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// -- Typography ----------------------------------------------------------------

function H({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <p
      className={`text-[clamp(1.85rem,6.4vw,2.2rem)] sm:text-[3rem] md:text-[3.8rem] leading-[1.1] sm:leading-[1.08] ${accent ? "text-[var(--gold)] italic" : "text-[var(--text)]"}`}
      style={{ fontFamily: "var(--font-serif)", fontWeight: 300, textShadow: "0 2px 24px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.7)" }}
    >
      {children}
    </p>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="font-ui text-[0.55rem] sm:text-[0.62rem] tracking-[0.22em] sm:tracking-[0.38em] text-[var(--text-muted)] mt-2">{children}</p>;
}

function Rule() {
  return <div className="divider-glow w-12 mb-4" />;
}

// Renders one entry from `copyPanels`. "stack" gives each line its own display heading;
// "statement" flows the lines together as one large centred paragraph.
function CopyPanelBody({ panel }: { panel: CopyPanel }) {
  if (panel.variant === "statement") {
    return (
      <p
        className="text-center leading-[1.05]"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: "clamp(2rem, 5vw, 3.8rem)", color: "var(--text)", textShadow: "0 2px 24px rgba(0,0,0,0.95)" }}
      >
        {panel.lines.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            <span style={line.accent ? { color: "var(--gold)", fontStyle: "italic" } : undefined}>
              {line.text}
            </span>
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className={panel.align === "center" ? "flex flex-col items-center gap-1" : undefined}>
      {panel.rule && <Rule />}
      {panel.lines.map((line, i) => (
        <H key={i} accent={line.accent}>{line.text}</H>
      ))}
      {panel.caption && <Sub>{panel.caption}</Sub>}
    </div>
  );
}

// -- Hero ----------------------------------------------------------------------

function Hero() {
  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {hero.eyebrow && (
        <span style={{
          fontFamily: "var(--font-sans)", fontWeight: 300,
          fontSize: "clamp(0.65rem, 1.1vw, 0.9rem)", letterSpacing: "0.65em",
          textTransform: "uppercase", color: "var(--text)",
          textShadow: "0 2px 24px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.5)",
          animation: "hero-fade-up 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.1s both",
        }}>
          {hero.eyebrow}
        </span>
      )}

      <span style={{
        fontFamily: "var(--font-cursive)",
        fontSize: "clamp(5rem, 14vw, 10.5rem)",
        color: "var(--gold-bright)", lineHeight: 1.1,
        display: "block", overflow: "visible",
        padding: "0 0.1em 0.15em",
        textShadow: "0 4px 60px rgba(0,0,0,0.7), 0 0 100px rgba(201,169,110,0.4)",
        animation: "cursive-write 1.6s cubic-bezier(0.22, 0.88, 0.36, 1.0) 0.5s both",
      }}>
        {hero.wordmark}
      </span>

      {brand.locationCode && (
        <div className="flex items-center gap-5" style={{ animation: "hero-fade-up 0.6s ease-out 1.8s both" }}>
          <div className="w-12 h-px" style={{ background: "var(--gold)", opacity: 0.7 }} />
          <span className="font-ui tracking-[0.6em]" style={{
            fontSize: "0.6rem", color: "var(--gold)",
            textShadow: "0 0 20px rgba(201,169,110,0.6), 0 2px 12px rgba(0,0,0,0.9)",
          }}>{brand.locationCode}</span>
          <div className="w-12 h-px" style={{ background: "var(--gold)", opacity: 0.7 }} />
        </div>
      )}

      {hero.tagline && (
        <p className="font-ui text-center" style={{
          fontSize: "clamp(0.5rem, 2.4vw, 0.65rem)", letterSpacing: "0.3em", color: "var(--text)",
          textShadow: "0 2px 20px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.6)",
          animation: "hero-fade-up 0.6s ease-out 2.1s both",
        }}>
          {hero.tagline}
        </p>
      )}
    </div>
  );
}

// -- Gallery stack -------------------------------------------------------------

// A hand-placed stack of photos — the top card flicks away to reveal the next.
// Needs at least three images; the three visible slots are the last three of `deck`.
function GalleryStack() {
  const images = gallery.images;
  const total = images.length;
  const [deck, setDeck] = useState(() => Array.from({ length: total }, (_, i) => i));
  const [animating, setAnim] = useState(false);

  const cycle = () => {
    if (animating || total < 2) return;
    setAnim(true);
    setTimeout(() => {
      setDeck(prev => { const d = [...prev]; d.unshift(d.pop()!); return d; });
      setAnim(false);
    }, 440);
  };

  const n   = deck.length;
  const top = deck[n - 1];
  const mid = deck[n - 2];
  const btm = deck[n - 3];

  // Each slot has a unique resting rotation + offset - gives the uneven hand-placed look
  const POS = {
    btm: { r: -10, x: -28, y: 32 },
    mid: { r:   7, x:  20, y: 16 },
    top: { r:  -2, x:   4, y:  0 },
  };

  const styleFor = (imgIdx: number) => {
    const isTop = imgIdx === top;
    const isMid = imgIdx === mid;
    const slot  = isTop ? POS.top : isMid ? (animating ? POS.top : POS.mid) : (animating ? POS.mid : POS.btm);

    return {
      zIndex: isTop ? 10 : isMid ? (animating ? 3 : 2) : (animating ? 2 : 1),
      transform: isTop && animating
        ? `translate(calc(-50% - 520px), calc(-50% - 30px)) rotate(-30deg) scale(0.78)`
        : `translate(calc(-50% + ${slot.x}px), calc(-50% + ${slot.y}px)) rotate(${slot.r}deg)`,
      opacity:   isTop && animating ? 0 : 1,
      boxShadow: isTop
        ? "0 20px 56px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.45)"
        : isMid
        ? "0 10px 32px rgba(0,0,0,0.6)"
        : "0 5px 18px rgba(0,0,0,0.5)",
    };
  };

  // Visible slots, de-duplicated so a short deck (<3 images) doesn't render dupe keys.
  const visible = [btm, mid, top].filter(
    (i, pos, arr) => i !== undefined && arr.indexOf(i) === pos,
  ) as number[];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Stack container - overflow visible so rotated edges peek out */}
      <div
        onClick={cycle}
        className="pointer-events-auto"
        style={{ position: "relative", width: "clamp(260px, 78vw, 560px)", height: "clamp(340px, 64vw, 660px)" }}
      >
        {visible.map(imgIdx => (
          <div
            key={imgIdx}
            style={{
              position: "absolute", left: "50%", top: "50%",
              borderRadius: "6px", overflow: "hidden",
              transition: "transform 0.44s cubic-bezier(0.4,0,0.2,1), opacity 0.32s ease, box-shadow 0.3s ease",
              ...styleFor(imgIdx),
            }}
          >
            {/* Natural aspect ratio - no fixed height, no objectFit */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[imgIdx].src}
              alt={images[imgIdx].alt}
              style={{
                display: "block",
                maxWidth: "clamp(220px, 62vw, 460px)",
                maxHeight: "clamp(300px, 54vw, 560px)",
                width: "auto",
                height: "auto",
              }}
            />
          </div>
        ))}
      </div>

      {/* counter + hint */}
      <div className="flex flex-col items-center gap-1">
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          {top + 1} / {total}
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--text-dim)" }}>
          {gallery.hint}
        </span>
      </div>
    </div>
  );
}

// -- Cards ---------------------------------------------------------------------

// Shared shell for the two big glass cards (events + contact).
function GlassCard({ children, maxHeight }: { children: React.ReactNode; maxHeight?: string }) {
  return (
    <div
      className="glass-panel pointer-events-auto w-full overflow-hidden"
      style={{
        borderRadius: "20px",
        maxHeight,
        background: "linear-gradient(140deg, rgba(32,25,18,0.97) 0%, rgba(17,13,9,0.985) 55%, rgba(26,19,13,0.97) 100%)",
        border: "1.5px solid rgba(124,79,232,0.6)",
        boxShadow: "var(--shadow-ambient), 0 0 0 1px rgba(124,79,232,0.25), 0 0 80px -36px var(--purple-glow)",
        position: "relative",
      }}
    >
      {/* ambient warm + purple glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 62% at 14% 40%, rgba(201,169,110,0.08) 0%, transparent 70%), radial-gradient(ellipse 52% 58% at 88% 84%, rgba(91,47,214,0.10) 0%, transparent 72%)",
      }} />
      {children}
    </div>
  );
}

function CardHeader({ eyebrow, title, eyebrowColor }: { eyebrow: string; title: string; eyebrowColor: string }) {
  return (
    <div className="flex flex-col gap-2 min-w-0" style={{ textAlign: "left" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "0.58rem", letterSpacing: "0.36em", textTransform: "uppercase", color: eyebrowColor }}>
        {eyebrow}
      </span>
      <p style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: "clamp(1.8rem, 2.8vw, 2.4rem)", color: "#ffffff", lineHeight: 1.1, margin: 0 }}>
        {title}
      </p>
    </div>
  );
}

function EventsCard() {
  return (
    <GlassCard>
      <div className="relative flex flex-col" style={{ gap: "18px", padding: "clamp(22px, 4vw, 48px)" }}>
        <CardHeader eyebrow={events.eyebrow} title={events.title} eyebrowColor="#b6a589" />

        <div className="flex flex-col" style={{ gap: "10px" }}>
          {events.items.map(({ day, month, name, description, detail, status, statusColor, href }) => {
            return (
              <a
                key={name}
                // Cards without an `href` stay in the DOM as inert <a>s so the row keeps
                // its layout and hover feel without becoming a dead link.
                {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-3 sm:gap-5 no-underline"
                style={{
                  padding: "clamp(14px, 3.5vw, 22px) clamp(14px, 3.5vw, 24px)",
                  borderRadius: "14px",
                  background: "rgba(201,169,110,0.045)",
                  border: "1px solid rgba(201,169,110,0.12)",
                  transition: "border-color 0.35s ease, background 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "rgba(124,79,232,0.45)";
                  el.style.background = "rgba(124,79,232,0.07)";
                  el.style.transform = "translateY(-2px)";
                  const circle = el.querySelector(".arrow-circle") as HTMLElement | null;
                  if (circle) { circle.style.borderColor = "rgba(124,79,232,0.6)"; circle.style.background = "rgba(124,79,232,0.18)"; }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "rgba(201,169,110,0.12)";
                  el.style.background = "rgba(201,169,110,0.045)";
                  el.style.transform = "translateY(0)";
                  const circle = el.querySelector(".arrow-circle") as HTMLElement | null;
                  if (circle) { circle.style.borderColor = "rgba(201,169,110,0.18)"; circle.style.background = "transparent"; }
                }}
              >
                {/* Date chip */}
                <div style={{
                  width: "clamp(44px, 12vw, 52px)", height: "clamp(44px, 12vw, 52px)", borderRadius: "12px", flexShrink: 0,
                  background: "rgba(124,79,232,0.15)", border: "1px solid rgba(124,79,232,0.35)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: "1.2rem", color: "#ffffff", lineHeight: 1 }}>{day}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#a99a80", marginTop: "2px" }}>{month}</span>
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 min-w-0" style={{ gap: "5px", textAlign: "left" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "0.5rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "#d8cab0" }}>{name}</span>
                    <span style={{
                      fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "0.4rem",
                      letterSpacing: "0.28em", textTransform: "uppercase",
                      color: statusColor, border: `1px solid ${statusColor}66`,
                      borderRadius: "999px", padding: "2px 9px", flexShrink: 0,
                    }}>{status}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontStyle: "italic", fontSize: "clamp(0.85rem, 3.2vw, 1rem)", color: "#f2ece0", lineHeight: 1.45 }}>{description}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#a99a80" }}>{detail}</span>
                </div>

                {/* Arrow circle */}
                <div
                  className="arrow-circle"
                  style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    border: "1px solid rgba(201,169,110,0.18)", background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color 0.35s ease, background 0.35s ease",
                  }}
                >
                  <Arrow color="#a78bfa" size={14} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

function ContactCard() {
  return (
    <GlassCard maxHeight="min(760px, 90dvh)">
      <div className="relative flex flex-col" style={{ gap: "clamp(10px, 2vw, 14px)", padding: "clamp(20px, 3.5vw, 44px)" }}>

        <div className="mb-2">
          <CardHeader eyebrow={contact.eyebrow} title={contact.title} eyebrowColor="rgba(167,139,250,0.85)" />
        </div>

        {/* 2-col symmetrical social grid — content-sized rows keep the card compact */}
        {contact.socials.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {contact.socials.map(({ platform, handle, href, color, icon }) => {
              const bg = `${color}14`;      // ~8% alpha
              const border = `${color}40`;  // ~25% alpha
              return (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline flex flex-col items-center justify-center"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    padding: "clamp(12px, 3vw, 24px)",
                    borderRadius: "14px",
                    background: "rgba(201,169,110,0.035)",
                    border: "1px solid rgba(201,169,110,0.12)",
                    gap: "clamp(8px, 2vw, 12px)",
                    transition: "border-color 0.35s ease, background 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = border;
                    el.style.background = bg;
                    el.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "rgba(201,169,110,0.12)";
                    el.style.background = "rgba(201,169,110,0.035)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                    {platform}
                  </span>

                  {/* Central glowing icon container */}
                  <div style={{
                    width: "clamp(42px, 11vw, 56px)", height: "clamp(42px, 11vw, 56px)", borderRadius: "14px",
                    background: bg, border: `1px solid ${border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 20px -5px ${color}33`,
                  }}>
                    <SocialIcon name={icon} color={color} size={28} />
                  </div>

                  <div className="flex items-center justify-center gap-1.5 w-full px-1">
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "clamp(0.72rem, 2.8vw, 0.95rem)", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {handle}
                    </span>
                    <Arrow color={color} size={12} />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Full-width contact rows */}
        {contact.rows.map(({ label, value, href, color, icon, emphasis }) => {
          const feature = emphasis === "feature";
          const restBg = feature ? `${color}1f` : "rgba(201,169,110,0.035)";
          const restBorder = feature ? `${color}59` : "rgba(201,169,110,0.12)";
          const hoverBg = feature ? `${color}38` : `${color}14`;
          const hoverBorder = feature ? `${color}99` : `${color}73`;
          return (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline flex items-center justify-between"
              style={{
                padding: "clamp(13px, 3.2vw, 20px) clamp(16px, 4vw, 24px)",
                borderRadius: "14px",
                background: restBg,
                border: `1px solid ${restBorder}`,
                transition: "background 0.35s ease, border-color 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = hoverBorder;
                el.style.background = hoverBg;
                el.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = restBorder;
                el.style.background = restBg;
                el.style.transform = "translateY(0)";
              }}
            >
              <div className="flex items-center gap-4">
                <div style={{
                  width: 40, height: 40, borderRadius: "10px",
                  background: `${color}2e`, border: `1px solid ${color}66`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <SocialIcon name={icon} color={color} size={20} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0" style={{ textAlign: "left" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "0.55rem", letterSpacing: "0.35em", textTransform: "uppercase", color: feature ? color : "rgba(255,255,255,0.4)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "clamp(0.82rem, 3vw, 0.95rem)", color: "#ffffff" }}>{value}</span>
                </div>
              </div>
              <Arrow color={color} size={14} />
            </a>
          );
        })}

      </div>
    </GlassCard>
  );
}

// -- Panel assembly ------------------------------------------------------------

// Build the full panel list from config: hero, then the copy panels, then the three
// rich panels. Panels are independent — drop one by emptying its config section.
function buildPanels(): Panel[] {
  const list: Panel[] = [
    {
      id: "hero",
      start: 0, end: 0.08,
      align: "center", valign: "center",
      staticStart: true,
      content: <Hero />,
    },
  ];

  for (const panel of copyPanels) {
    list.push({
      id: panel.id,
      start: panel.start,
      end: panel.end,
      align: panel.align,
      valign: panel.valign,
      content: <CopyPanelBody panel={panel} />,
    });
  }

  if (gallery.images.length > 0) {
    list.push({
      id: "gallery",
      start: gallery.start, end: gallery.end,
      align: "center", valign: "center",
      content: (
        <div className="flex flex-col items-center gap-8">
          <p style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: "1.5rem", color: "var(--text)", letterSpacing: "0.04em", margin: 0 }}>
            {gallery.title}
          </p>
          <GalleryStack />
        </div>
      ),
    });
  }

  if (events.items.length > 0) {
    list.push({
      id: "events",
      start: events.start, end: events.end,
      align: "center", valign: "center",
      maxWidth: "min(760px, 100%)",
      content: <EventsCard />,
    });
  }

  list.push({
    id: "contact",
    start: contact.start, end: contact.end,
    align: "center", valign: "center",
    staticEnd: true,
    maxWidth: "min(1300px, 100%)",
    content: <ContactCard />,
  });

  return list.sort((a, b) => a.start - b.start);
}

export default function ScrollContent() {
  const panels = useMemo(() => buildPanels(), []);
  return (
    <>
      <ScrollIndicator />
      {panels.map((p) => (
        <ScenePanel key={p.id} panel={p} />
      ))}
    </>
  );
}
