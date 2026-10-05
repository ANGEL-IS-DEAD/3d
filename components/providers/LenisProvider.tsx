"use client";

// Smooth-scroll provider — initialises Lenis and pushes scroll position + velocity into the
// global scrollStore every frame. Exposes the Lenis instance via the useLenis() hook.
import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { updateScrollProgress } from "@/lib/scrollStore";

const LenisContext = createContext<{ lenis: Lenis | null }>({ lenis: null });

export function useLenis() {
  return useContext(LenisContext);
}

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      syncTouch: false,   // use native iOS momentum scroll on touch (Lenis default)
      wheelMultiplier: 0.9,
      touchMultiplier: 2.2,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      updateScrollProgress(scroll, velocity, maxScroll);
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current }}>
      {children}
    </LenisContext.Provider>
  );
}
