"use client";

// Client-only loader for the 3D World — dynamic import with ssr:false so Three.js/WebGL
// never runs on the server; shows a dark fallback div while the chunk loads.
import dynamic from "next/dynamic";

const World = dynamic(() => import("@/components/three/World"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "fixed", inset: 0, background: "#0e0d0d", zIndex: 0 }} />
  ),
});

export default function WorldLoader() {
  return <World />;
}
