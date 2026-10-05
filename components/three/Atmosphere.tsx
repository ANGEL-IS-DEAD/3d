"use client";

// Floating dust motes — a slow-drifting GPU point cloud (custom shader) that adds
// atmospheric depth to the room.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const dustVS = `
  precision mediump float;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 0.15 + aPhase) * 0.5;
    pos.x += cos(uTime * 0.1 + aPhase * 1.3) * 0.3;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
    vAlpha = smoothstep(80.0, 5.0, -mvPos.z);
  }
`;

const dustFS = `
  precision mediump float;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = (1.0 - d * 2.0) * vAlpha * 0.15;
    gl_FragColor = vec4(0.85, 0.8, 0.72, alpha);
  }
`;

export default function Atmosphere({ mobile = false }: { mobile?: boolean }) {
  const DUST_COUNT = mobile ? 80 : 300;
  const dustRef = useRef<THREE.Points>(null!);
  const uniforms = useRef({ uTime: { value: 0 } });

  const dustData = useMemo(() => {
    const positions = new Float32Array(DUST_COUNT * 3);
    const sizes = new Float32Array(DUST_COUNT);
    const phases = new Float32Array(DUST_COUNT);

    for (let i = 0; i < DUST_COUNT; i++) {
      const t = i / DUST_COUNT;
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 16;
      positions[i * 3 + 2] = -4 - t * 72;
      sizes[i] = 0.8 + Math.random() * 1.6;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, sizes, phases };
  }, []);

  useFrame(({ clock }) => {
    uniforms.current.uTime.value = clock.getElapsedTime();
  });

  return (
    <>
      {/* Ambient dust motes */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustData.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[dustData.sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[dustData.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={dustVS}
          fragmentShader={dustFS}
          uniforms={uniforms.current}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Volume light shafts — skip on mobile (overdraw cost) */}
      {!mobile && [[-2, -8], [3, -18], [-4, -35], [5, -50]].map(([x, z], i) => (
        <mesh key={i} position={[x, 8, z]} rotation={[0, Math.PI * 0.1 * i, 0]}>
          <planeGeometry args={[0.8, 14]} />
          <meshBasicMaterial
            color="#f5e8c8"
            transparent
            opacity={0.025}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
