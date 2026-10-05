"use client";

// Root of the 3D scene — sets up the React Three Fiber <Canvas> (camera, renderer, fog,
// lights) and mounts every scene component. Rendered client-only via WorldLoader.
import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import CameraRig from "./CameraRig";
import Architecture from "./Architecture";
import Doorway from "./Doorway";
import ParticleField from "./ParticleField";
import Atmosphere from "./Atmosphere";
import SkySystem from "./SkySystem";

export default function World() {
  // Detect mobile once at mount — dynamic import (ssr:false) guarantees window exists
  const mobile = useMemo(() => {
    return window.innerWidth < 768 || navigator.maxTouchPoints > 0;
  }, []);

  // Adaptive resolution — starts crisp, drops render scale if the GPU can't keep up so
  // the frame rate stays smooth (esp. on high-DPI / high-refresh laptops).
  // Mobile now renders above 1× (sharper text/edges on retina phones) but is capped by
  // the real device pixel ratio and clamped to 1.5 so we never overdraw; the
  // PerformanceMonitor below scales it back down the moment the GPU can't hold frame rate.
  const maxDpr = useMemo(
    () => (mobile ? Math.min(window.devicePixelRatio || 1, 1.5) : 1.5),
    [mobile],
  );
  const [dpr, setDpr] = useState<number>(maxDpr);

  return (
    <Canvas
      style={{ position: "fixed", inset: 0, zIndex: 0, background: "#1a0e06" }}
      camera={{ position: [0, 3.5, 38], fov: mobile ? 62 : 58, near: 0.1, far: mobile ? 120 : 200 }}
      gl={{
        antialias: !mobile,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: mobile ? 1.6 : 1.7,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: "high-performance",
      }}
      dpr={dpr}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#1a0e06");
        scene.fog = new THREE.Fog("#1e1408", mobile ? 28 : 30, mobile ? 72 : 75);
      }}
    >
      {/* Adaptive resolution on every device — scales render resolution between 1× and
          maxDpr based on measured frame rate, and drops to 1× on a hard fallback. */}
      <PerformanceMonitor
        onChange={({ factor }) => setDpr(Math.round((1 + (maxDpr - 1) * factor) * 100) / 100)}
        onFallback={() => setDpr(1)}
        flipflops={3}
      />
      {/* Key + fill directional lights live in SkySystem so they can dim/cool with
          the day↔night theme. */}
      <Suspense fallback={null}>
        <SkySystem />
        <CameraRig />
        <Doorway />
        <Architecture mobile={mobile} />
        <ParticleField mobile={mobile} />
        <Atmosphere mobile={mobile} />
      </Suspense>
    </Canvas>
  );
}
