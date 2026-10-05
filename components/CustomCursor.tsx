"use client";

// Custom cursor — a small dot that tracks the pointer exactly, plus a larger ring that
// eases behind it and turns orange + scales up over interactive elements. Mouse/trackpad only.
import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show custom cursor when the primary input is a mouse/trackpad
    setShow(window.matchMedia("(pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!show) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let hovered = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;
    };

    // Event delegation so links/buttons that mount later (scroll panels) work too
    const isInteractive = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("a, button, input, [role='button']");

    const onOver = (e: MouseEvent) => {
      if (!hovered && isInteractive(e.target)) {
        hovered = true;
        ring.style.borderColor = "rgba(253, 97, 0, 0.6)";   // orange highlight on interactive
        ring.style.boxShadow = "0 0 18px rgba(253, 97, 0, 0.35)";
      }
    };
    const onOut = (e: MouseEvent) => {
      if (hovered && isInteractive(e.target)) {
        hovered = false;
        ring.style.borderColor = "rgba(109, 60, 240, 0.5)"; // purple at rest
        ring.style.boxShadow = "none";
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    let rafId: number;
    const animate = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      const scale = hovered ? 1.7 : 1;
      ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px) scale(${scale})`;
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(rafId);
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="fixed pointer-events-none z-[9999] w-1.5 h-1.5 rounded-full"
        style={{ top: 0, left: 0, background: "var(--purple-soft)" }}
      />
      {/* Outer ring — only border/shadow transition; transform is driven each frame by rAF */}
      <div
        ref={ringRef}
        className="fixed pointer-events-none z-[9998] w-9 h-9 rounded-full border"
        style={{
          top: 0,
          left: 0,
          borderColor: "rgba(109, 60, 240, 0.5)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      />
    </>
  );
}
