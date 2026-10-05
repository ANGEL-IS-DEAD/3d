"use client";

// TEMPORARY DEBUG OVERLAY — reports WebGL capability directly on screen so we can
// see what a real phone reports (no remote console access). Remove once fixed.

import { useEffect, useState } from "react";

export default function WebGLDiagnostic() {
  const [lines, setLines] = useState<string[]>(["probing…"]);

  useEffect(() => {
    const out: string[] = [];
    const push = (s: string) => { out.push(s); setLines([...out]); };

    // Capture any global JS error (would otherwise be invisible on phone)
    const onErr = (e: ErrorEvent) => push("JS ERROR: " + (e.message || "unknown"));
    window.addEventListener("error", onErr);

    try {
      push("w:" + window.innerWidth + " h:" + window.innerHeight + " dpr:" + window.devicePixelRatio);
      push("touch:" + navigator.maxTouchPoints);

      const c = document.createElement("canvas");
      const gl2 = c.getContext("webgl2");
      const gl1 = !gl2 ? (c.getContext("webgl") || c.getContext("experimental-webgl")) : null;
      const gl = (gl2 || gl1) as WebGLRenderingContext | WebGL2RenderingContext | null;

      push("webgl2: " + (gl2 ? "YES" : "no"));
      push("webgl1: " + (gl1 ? "YES" : (gl2 ? "(n/a)" : "no")));

      if (!gl) {
        push("❌ NO WEBGL CONTEXT");
      } else {
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) {
          push("GPU: " + String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 40));
        } else {
          push("GPU: (masked)");
        }
        push("fragU: " + gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
        push("vertU: " + gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
        push("texSz: " + gl.getParameter(gl.MAX_TEXTURE_SIZE));
        const lost = gl.getExtension("WEBGL_lose_context");
        push("loseCtx ext: " + (lost ? "yes" : "no"));
      }

      // Did an R3F canvas actually mount?
      setTimeout(() => {
        const live = document.querySelector("canvas");
        push("canvas mounted: " + (live ? live.width + "x" + live.height : "NONE"));
      }, 2500);
    } catch (e) {
      push("PROBE THREW: " + (e instanceof Error ? e.message : String(e)));
    }

    return () => window.removeEventListener("error", onErr);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 70,
        left: 8,
        zIndex: 99999,
        background: "rgba(0,0,0,0.88)",
        color: "#3f6",
        font: "11px/1.45 monospace",
        padding: "8px 10px",
        whiteSpace: "pre-wrap",
        maxWidth: "92vw",
        pointerEvents: "none",
        border: "1px solid #3f6",
        borderRadius: 4,
      }}
    >
      {lines.join("\n")}
    </div>
  );
}
