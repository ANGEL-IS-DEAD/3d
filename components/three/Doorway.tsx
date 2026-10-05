"use client";

// The entrance doorway — frame, panels and glow; the threshold the camera approaches and
// passes through early in the journey.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IS_MOBILE } from "@/lib/device";

export default function Doorway() {
  const glowRef = useRef<THREE.PointLight>(null!);
  const outerGlowRef = useRef<THREE.PointLight>(null!);
  const floorGlowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const breathe = Math.sin(t * 0.6) * 0.3;

    if (glowRef.current) {
      glowRef.current.intensity = 4.0 + breathe;
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.intensity = 1.2 + breathe * 0.5;
    }
    if (floorGlowRef.current) {
      (floorGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 0.6) * 0.04;
    }
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    color: "#2a2520",
    roughness: 0.15,
    metalness: 0.85,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: "#6d3cf0",
    roughness: 0.08,
    metalness: 1.0,
    emissive: new THREE.Color("#6d3cf0"),
    emissiveIntensity: 0.6,
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ── Frame ───────────────────────────────────────── */}

      {/* Left pillar */}
      <mesh position={[-1.2, 2.2, 0]} material={pillarMat}>
        <boxGeometry args={[0.22, 4.4, 0.22]} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[1.2, 2.2, 0]} material={pillarMat}>
        <boxGeometry args={[0.22, 4.4, 0.22]} />
      </mesh>
      {/* Top lintel */}
      <mesh position={[0, 4.51, 0]} material={pillarMat}>
        <boxGeometry args={[2.64, 0.22, 0.22]} />
      </mesh>

      {/* Gold accent strips */}
      <mesh position={[-1.2, 2.2, 0.12]} material={goldMat}>
        <boxGeometry args={[0.05, 4.2, 0.05]} />
      </mesh>
      <mesh position={[1.2, 2.2, 0.12]} material={goldMat}>
        <boxGeometry args={[0.05, 4.2, 0.05]} />
      </mesh>
      <mesh position={[0, 4.51, 0.12]} material={goldMat}>
        <boxGeometry args={[2.4, 0.05, 0.05]} />
      </mesh>

      {/* Corner jewels */}
      <mesh position={[-1.2, 4.51, 0.12]} material={goldMat}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
      <mesh position={[1.2, 4.51, 0.12]} material={goldMat}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>

      {/* ── Glow lights ─────────────────────────────────── */}

      {/* Inner warm glow — behind doorway */}
      <pointLight
        ref={glowRef}
        position={[0, 2.2, -2]}
        color="#ffe8b0"
        intensity={4.0}
        distance={28}
        decay={1.8}
      />

      {/* Outer gold halo + frame spotlight — desktop only.
          Mobile keeps just the single inner glow to stay under the light budget. */}
      {!IS_MOBILE && (
        <>
          <pointLight
            ref={outerGlowRef}
            position={[0, 2.2, 2]}
            color="#c9a96e"
            intensity={1.2}
            distance={16}
            decay={2}
          />
          <spotLight
            position={[0, 12, 6]}
            target-position={[0, 2.2, 0]}
            color="#f5e8c8"
            intensity={8}
            angle={0.35}
            penumbra={0.7}
            distance={30}
            decay={1.5}
            castShadow={false}
          />
        </>
      )}

      {/* ── Threshold glow plane ──────────────────────── */}
      <mesh ref={floorGlowRef} position={[0, 0.02, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 2]} />
        <meshBasicMaterial color="#c9a96e" transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {/* Soft aperture halo on the door plane */}
      <mesh position={[0, 2.2, 0.01]}>
        <planeGeometry args={[2.2, 4.4]} />
        <meshBasicMaterial
          color="#ffe8b0"
          transparent
          opacity={0.04}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
