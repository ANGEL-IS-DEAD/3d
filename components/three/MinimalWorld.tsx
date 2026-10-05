"use client";

// DIAGNOSTIC MINIMAL SCENE — used on mobile to test whether basic WebGL renders
// at all. No custom shaders, no fog, no tone-mapping tricks, no powerPreference.
// If the gold cube spins on the phone, WebGL + R3F work and the problem is scene
// complexity. If it's black, the problem is more fundamental (context/mount).

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Spinner() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.4;
    ref.current.rotation.y += dt * 0.6;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#c9a96e" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

export default function MinimalWorld() {
  return (
    <Canvas
      style={{ position: "fixed", inset: 0, zIndex: 0, background: "#11100f" }}
      camera={{ position: [0, 0, 6], fov: 60 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 3]} intensity={2.5} />
      <Spinner />
    </Canvas>
  );
}
