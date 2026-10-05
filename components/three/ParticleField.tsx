"use client";

// Drifting particle field — a GPU point cloud (custom shader) that waves and drifts and
// reacts to scroll progress, suggesting people moving through the space.
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollStore";

const particleVS = `
  precision mediump float;
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aOffset;
  uniform float uTime;
  uniform float uProgress;
  varying float vAlpha;
  varying float vDist;

  void main() {
    vec3 pos = position;
    float wave = sin(uTime * aSpeed + aOffset.x * 2.1 + aOffset.z) * 0.18;
    float drift = cos(uTime * aSpeed * 0.7 + aOffset.z * 1.8) * 0.12;
    pos.y += wave;
    pos.x += drift;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (280.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;

    vDist = -mvPos.z;
    vAlpha = smoothstep(60.0, 8.0, vDist) * uProgress;
  }
`;

const particleFS = `
  precision mediump float;
  varying float vAlpha;
  uniform vec3 uColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.4);
    gl_FragColor = vec4(uColor, glow * vAlpha * 0.9);
  }
`;

export default function ParticleField({ mobile = false }: { mobile?: boolean }) {
  const PARTICLE_COUNT = mobile ? 55 : 180;
  const CONNECTION_DISTANCE = mobile ? 0 : 3.5;  // disable connections on mobile
  const MAX_CONNECTIONS = mobile ? 0 : 260;

  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color("#6d3cf0") },  // brand purple (bright for emissive visibility)
  });

  const particleData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const offsets = new Float32Array(PARTICLE_COUNT * 3);

    // Distribute particles along the camera path through the scene
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      // Spread along z-axis journey
      const z = -4 - t * 68 + (Math.random() - 0.5) * 8;
      const spread = 4 + t * 3;
      positions[i * 3] = (Math.random() - 0.5) * spread * 2;
      positions[i * 3 + 1] = 1 + Math.random() * (4 + t * 10);
      positions[i * 3 + 2] = z;

      sizes[i] = 1.2 + Math.random() * 2.4;
      speeds[i] = 0.3 + Math.random() * 0.5;
      offsets[i * 3] = Math.random() * Math.PI * 2;
      offsets[i * 3 + 1] = Math.random() * Math.PI * 2;
      offsets[i * 3 + 2] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, speeds, offsets };
  }, []);

  // Connection lines buffer (zero-size on mobile — lines disabled)
  const linePositions = useMemo(() => new Float32Array(Math.max(1, MAX_CONNECTIONS) * 6), [MAX_CONNECTIONS]);

  // Reused vector pool for animated positions — avoids allocating PARTICLE_COUNT
  // Vector3s every frame (GC churn was causing periodic hitches).
  const animPos = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, () => new THREE.Vector3()),
    [PARTICLE_COUNT]
  );
  const frameRef = useRef(0);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: "#6d3cf0",
    transparent: true,
    opacity: 0.18,
    vertexColors: false,
  }), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    uniformsRef.current.uTime.value = t;

    // Fade in particles based on scroll progress — frame-rate-independent easing so it
    // feels identical at 60Hz and 120Hz (clamped delta guards against tab-refocus jumps).
    const targetProgress = Math.min(scrollState.progress * 4, 1);
    const k = 1 - Math.exp(-3 * Math.min(delta, 0.1));
    uniformsRef.current.uProgress.value += (targetProgress - uniformsRef.current.uProgress.value) * k;

    // Connection lines: desktop only, and rebuilt every other frame — the O(n²) search
    // is the heaviest CPU cost here, so halving its rate keeps frame times stable
    // (lines are a subtle background, the lower cadence is imperceptible).
    if (MAX_CONNECTIONS === 0 || !pointsRef.current || !linesRef.current) return;
    frameRef.current++;
    if (frameRef.current % 2 !== 0) return;

    const speeds = pointsRef.current.geometry.attributes.aSpeed.array as Float32Array;

    // Animated positions (mirror shader logic approximately) — reuse pooled vectors.
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bx = particleData.positions[i * 3];
      const by = particleData.positions[i * 3 + 1];
      const bz = particleData.positions[i * 3 + 2];
      const speed = speeds[i];
      const ox = particleData.offsets[i * 3];
      const oz = particleData.offsets[i * 3 + 2];
      animPos[i].set(
        bx + Math.cos(t * speed * 0.7 + oz * 1.8) * 0.12,
        by + Math.sin(t * speed + ox * 2.1 + oz) * 0.18,
        bz,
      );
    }

    // Find connections — squared distance avoids a sqrt per pair.
    let lineIdx = 0;
    const connectionProgress = Math.min((scrollState.progress - 0.25) * 3, 1);
    const maxDist = CONNECTION_DISTANCE * connectionProgress;
    const maxDistSq = maxDist * maxDist;

    for (let i = 0; i < PARTICLE_COUNT && lineIdx < MAX_CONNECTIONS; i++) {
      const pi = animPos[i];
      for (let j = i + 1; j < PARTICLE_COUNT && lineIdx < MAX_CONNECTIONS; j++) {
        const pj = animPos[j];
        if (pi.distanceToSquared(pj) < maxDistSq) {
          const o = lineIdx * 6;
          linePositions[o]     = pi.x; linePositions[o + 1] = pi.y; linePositions[o + 2] = pi.z;
          linePositions[o + 3] = pj.x; linePositions[o + 4] = pj.y; linePositions[o + 5] = pj.z;
          lineIdx++;
        }
      }
    }

    // Clear unused line segments
    for (let c = lineIdx; c < MAX_CONNECTIONS; c++) linePositions.fill(0, c * 6, c * 6 + 6);

    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIdx * 2);
    lineMaterial.opacity = 0.18 * Math.max(0, connectionProgress);
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[particleData.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aSpeed"
            args={[particleData.speeds, 1]}
          />
          <bufferAttribute
            attach="attributes-aOffset"
            args={[particleData.offsets, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={particleVS}
          fragmentShader={particleFS}
          uniforms={uniformsRef.current}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments ref={linesRef} geometry={lineGeometry} material={lineMaterial} />
    </>
  );
}
