"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollStore";
import { themeState } from "@/lib/themeStore";
import { IS_MOBILE } from "@/lib/device";

// ─────────────────────────────────────────────────────────────────────────────
// Sky + Cloud shader
// Procedural clouds via FBM (Fractal Brownian Motion) noise.
// Clouds drift over time, change colour with the sun, and fade at night.
// ─────────────────────────────────────────────────────────────────────────────

const skyVS = /* glsl */ `
  precision highp float;
  varying vec3 vWorldDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFS = /* glsl */ `
  precision highp float;

  varying vec3 vWorldDir;

  uniform float uProgress;
  uniform float uTime;
  uniform vec3  uSkyTop;
  uniform vec3  uSkyHorizon;
  uniform vec3  uGroundColor;
  uniform vec3  uSunDir;
  uniform float uSunVisible;
  uniform float uNight;   // 0 = day (light theme), 1 = night (dark theme)

  // ── Noise ─────────────────────────────────────────────────────────────────

  float hash1(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  // Smooth value noise — quintic interpolation (C2 continuous) removes the blocky
  // cubic-fade banding that read as "pixels".
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = hash1(i);
    float b = hash1(i + vec2(1.0, 0.0));
    float c = hash1(i + vec2(0.0, 1.0));
    float d = hash1(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // FBM — 5 octaves with rotation to avoid grid artifacts. Kept at 5 (down from 6)
  // to offset the extra fbm calls added by domain warping below.
  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.52;
    float freq = 1.0;
    // Rotation matrix to break axis symmetry
    mat2 rot = mat2(1.8, 1.2, -1.2, 1.8);
    for (int i = 0; i < 5; i++) {
      val += vnoise(p * freq) * amp;
      p   = rot * p;
      amp  *= 0.48;
      freq *= 2.1;
    }
    return val;
  }

  // ── Cloud density ─────────────────────────────────────────────────────────

  float cloudDensity(vec3 dir, float time) {
    if (dir.y < 0.03) return 0.0;

    // Spherical UV projection (stereographic-ish) for the cloud plane
    float invY = 1.0 / (dir.y * 0.65 + 0.35);
    vec2 uv = dir.xz * invY * 0.14;

    // Two independent layers drifting at different speeds + directions
    vec2 wind1 = vec2(time * 0.006,  time * 0.0025);
    vec2 wind2 = vec2(-time * 0.0035, time * 0.005);

    // Domain warp — push the sample coords by another fbm so cloud shapes billow
    // and curl naturally instead of looking like flat noise blobs.
    vec2 warp = vec2(
      fbm((uv + wind1) * 1.4),
      fbm((uv + vec2(2.7, 1.3)) * 1.4 + wind2)
    );
    vec2 wuv = uv + (warp - 0.5) * 0.55;

    float layer1 = fbm((wuv + wind1) * 2.8);
    float layer2 = fbm((wuv * 1.6 + wind2) * 2.2 + vec2(5.3, 2.7));

    // Blend layers: primary + detail
    float density = layer1 * 0.62 + layer2 * 0.38;

    // Threshold with soft, wide edges — wispy fringes, no hard cut-out
    density = smoothstep(0.40, 0.80, density);

    // Natural distribution: thin near horizon, fewer at pure zenith
    density *= smoothstep(0.03, 0.18, dir.y);
    density *= 1.0 - smoothstep(0.65, 1.0, dir.y) * 0.25;

    return density;
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = dir.y;

    // ── Sky gradient ────────────────────────────────────────────────────────
    float t = clamp(h, 0.0, 1.0);

    // Rayleigh-like: extra scattering near horizon makes a soft band
    float rayleigh = pow(1.0 - t, 3.0) * 0.28;
    vec3 skyColor = mix(uSkyHorizon, uSkyTop, t * t);
    skyColor += uSkyHorizon * rayleigh;

    // Ground fill
    float groundT = clamp(-h * 3.0, 0.0, 1.0);
    skyColor = mix(skyColor, uGroundColor, groundT);

    // Horizon glow band — constant daytime haze (no progress dimming).
    float horizonGlow = exp(-abs(h) * 3.5);
    vec3 glowColor = uSkyHorizon * 1.25;
    skyColor += glowColor * horizonGlow * 0.28;

    // ── Sun (day) ────────────────────────────────────────────────────────────
    float sunDot  = dot(dir, normalize(uSunDir));
    float sunDisc = smoothstep(0.9985, 1.0, sunDot);
    float sunHalo = pow(max(0.0, sunDot), 64.0) * 0.35;
    float sunAtm  = pow(max(0.0, sunDot), 8.0) * 0.12; // atmospheric bloom
    vec3  sunColor = vec3(1.0, 0.96, 0.82); // warm daytime sun, constant
    skyColor += (sunDisc + sunHalo + sunAtm) * sunColor * uSunVisible * (1.0 - uNight);

    // ── Moon (night) ─────────────────────────────────────────────────────────
    // Sits high opposite the sun azimuth; only present in the dark theme.
    vec3 moonDir = normalize(vec3(-0.45, 0.62, -0.64));
    float moonDot  = dot(dir, moonDir);
    float moonDisc = smoothstep(0.9975, 0.9990, moonDot);
    float moonHalo = pow(max(0.0, moonDot), 48.0) * 0.30;
    vec3  moonColor = vec3(0.86, 0.90, 1.0);
    skyColor += (moonDisc + moonHalo) * moonColor * uNight;

    // ── Clouds ─────────────────────────────────────────────────────────────
    float cloudCover = cloudDensity(dir, uTime);

    // Clouds thin out at night so the stars read through.
    cloudCover *= 1.0 - uNight * 0.55;

    if (cloudCover > 0.001) {
      // White daytime clouds, tinting to dark moonlit blue in the night theme.
      vec3 cloudColor = mix(vec3(0.97, 0.96, 0.95), vec3(0.16, 0.18, 0.28), uNight);

      // Subtle sun-side brightening (illuminated top of clouds) — day only
      float sunInfluence = max(0.0, dot(dir, normalize(uSunDir)));
      cloudColor += sunColor * sunInfluence * 0.16 * uSunVisible * (1.0 - uNight);

      // Shadow: slightly darker on the away-from-sun side
      float shadow = 0.80 + 0.20 * clamp(sunInfluence * 2.0, 0.0, 1.0);
      cloudColor *= shadow;

      // Volumetric look: dense cores read bright/top-lit, thin edges fall into
      // shadow — gives the clouds rounded 3D body instead of a flat cut-out.
      cloudColor *= 0.68 + 0.5 * cloudCover;

      skyColor = mix(skyColor, cloudColor, cloudCover * 0.92);
    }

    // ── Stars (night theme only) ─────────────────────────────────────────────
    if (uNight > 0.001 && h > 0.0) {
      vec3 absDir = abs(dir);
      vec2 starUV;
      if (absDir.y > absDir.x && absDir.y > absDir.z)      starUV = dir.xz / dir.y;
      else if (absDir.x > absDir.z)                         starUV = dir.yz / dir.x;
      else                                                   starUV = dir.xy / dir.z;

      float s1 = hash1(floor(starUV * 200.0));
      float s2 = hash1(floor(starUV * 380.0 + vec2(41.0, 71.0)));
      float star = step(0.980, s1) * 0.85 + step(0.992, s2) * 0.50;
      float twinkle = 0.72 + 0.28 * sin(s1 * 1200.0 + uTime * 0.6);
      float ht = smoothstep(0.0, 0.20, h);
      float starCloud = 1.0 - cloudDensity(dir, uTime) * 0.7;
      skyColor += vec3(0.78, 0.84, 1.0) * star * twinkle * uNight * ht * starCloud;
    }

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}
function lerpVec3(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return new THREE.Vector3().lerpVectors(a, b, t);
}

type Keyframe = {
  p: number; top: string; horizon: string; ground: string;
  ambColor: string; ambIntensity: number; fogColor: string;
};

// Light theme — a bright blue daytime sky held across the whole scroll. Ambient rises
// slightly so the interior stays well-lit as the camera moves deeper into the room.
const DAY_KEYFRAMES: Keyframe[] = [
  { p: 0.00, top: "#4a86c8", horizon: "#bcd4e6", ground: "#1c1814", ambColor: "#e4ecf4", ambIntensity: 0.70, fogColor: "#9fb4c6" },
  { p: 0.35, top: "#4d8aca", horizon: "#c4dbec", ground: "#1e1a16", ambColor: "#e8eef6", ambIntensity: 0.82, fogColor: "#a8bdce" },
  { p: 0.60, top: "#5290cc", horizon: "#cce0ee", ground: "#201c18", ambColor: "#ecf2f8", ambIntensity: 0.90, fogColor: "#b4c6d6" },
  { p: 1.00, top: "#5896d0", horizon: "#d6e6f2", ground: "#221e1a", ambColor: "#f0f4fa", ambIntensity: 0.98, fogColor: "#bfcfdc" },
];

// Dark theme — deep moonlit night sky. Low cool ambient; the interior point lights
// (boosted at night in Architecture) carry the room.
const NIGHT_KEYFRAMES: Keyframe[] = [
  { p: 0.00, top: "#070d1e", horizon: "#1a2342", ground: "#05060c", ambColor: "#3a4576", ambIntensity: 0.30, fogColor: "#0a0e1c" },
  { p: 0.35, top: "#060b1a", horizon: "#161e3a", ground: "#05060b", ambColor: "#36427a", ambIntensity: 0.30, fogColor: "#090c18" },
  { p: 0.60, top: "#050912", horizon: "#121a32", ground: "#04050a", ambColor: "#323e7e", ambIntensity: 0.30, fogColor: "#070a14" },
  { p: 1.00, top: "#04070e", horizon: "#0e1628", ground: "#03040a", ambColor: "#2e3c86", ambIntensity: 0.32, fogColor: "#060810" },
];

function sampleKeyframes(progress: number, frames: Keyframe[]) {
  const t = Math.max(0, Math.min(1, progress));
  let a = frames[0], b = frames[1];
  for (let i = 0; i < frames.length - 1; i++) {
    if (t >= frames[i].p && t <= frames[i + 1].p) {
      a = frames[i]; b = frames[i + 1]; break;
    }
  }
  const lt = (t - a.p) / (b.p - a.p);
  return {
    skyTop:     lerpVec3(hexToVec3(a.top),    hexToVec3(b.top),    lt),
    skyHorizon: lerpVec3(hexToVec3(a.horizon), hexToVec3(b.horizon), lt),
    ground:     lerpVec3(hexToVec3(a.ground),  hexToVec3(b.ground),  lt),
    ambColor:   new THREE.Color(a.ambColor).lerp(new THREE.Color(b.ambColor), lt),
    ambInt:     THREE.MathUtils.lerp(a.ambIntensity, b.ambIntensity, lt),
    fogColor:   new THREE.Color(a.fogColor).lerp(new THREE.Color(b.fogColor), lt),
  };
}

// Blend the day + night samples by the eased night factor (0 → 1).
function sampleTheme(progress: number, night: number) {
  const d = sampleKeyframes(progress, DAY_KEYFRAMES);
  const n = sampleKeyframes(progress, NIGHT_KEYFRAMES);
  return {
    skyTop:     d.skyTop.clone().lerp(n.skyTop, night),
    skyHorizon: d.skyHorizon.clone().lerp(n.skyHorizon, night),
    ground:     d.ground.clone().lerp(n.ground, night),
    ambColor:   d.ambColor.clone().lerp(n.ambColor, night),
    ambInt:     THREE.MathUtils.lerp(d.ambInt, n.ambInt, night),
    fogColor:   d.fogColor.clone().lerp(n.fogColor, night),
  };
}

function getSunDir(progress: number): THREE.Vector3 {
  // Light theme: keep the sun high all the way through (gentle drift, never sets).
  const elevDeg = THREE.MathUtils.lerp(58, 34, progress);
  const elev = (elevDeg * Math.PI) / 180;
  return new THREE.Vector3(0.6, Math.sin(elev), -Math.cos(elev)).normalize();
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SkySystem() {
  const { scene } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null!);
  const sunLightRef = useRef<THREE.DirectionalLight>(null!);
  const fillLightRef = useRef<THREE.DirectionalLight>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const dayKeyColor = useMemo(() => new THREE.Color("#f0e8d4"), []);
  const nightKeyColor = useMemo(() => new THREE.Color("#5a6aa8"), []);
  const _keyColor = useMemo(() => new THREE.Color(), []);

  const uniforms = useMemo(() => ({
    uProgress:    { value: 0 },
    uTime:        { value: 0 },
    uSkyTop:      { value: new THREE.Vector3(0.227, 0.408, 0.600) },
    uSkyHorizon:  { value: new THREE.Vector3(0.941, 0.753, 0.376) },
    uGroundColor: { value: new THREE.Vector3(0.118, 0.078, 0.031) },
    uSunDir:      { value: new THREE.Vector3(0.6, 0.7, -0.3).normalize() },
    uSunVisible:  { value: 1.0 },
    uNight:       { value: 0 },
  }), []);

  // Local eased night factor — chases themeState.night for a smooth day↔night fade.
  const nightRef = useRef(themeState.night);

  useFrame(({ clock }, delta) => {
    const p = scrollState.progress;
    nightRef.current += (themeState.night - nightRef.current) * (1 - Math.exp(-3 * Math.min(delta, 0.1)));
    const night = nightRef.current;
    const { skyTop, skyHorizon, ground, ambColor, ambInt, fogColor } = sampleTheme(p, night);

    if (matRef.current) {
      uniforms.uProgress.value   = p;
      uniforms.uTime.value       = clock.getElapsedTime();
      uniforms.uNight.value      = night;
      uniforms.uSkyTop.value.set(skyTop.x, skyTop.y, skyTop.z);
      uniforms.uSkyHorizon.value.set(skyHorizon.x, skyHorizon.y, skyHorizon.z);
      uniforms.uGroundColor.value.set(ground.x, ground.y, ground.z);
      const sunDir = getSunDir(p);
      uniforms.uSunDir.value.set(sunDir.x, sunDir.y, sunDir.z);
      uniforms.uSunVisible.value = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(sunDir.y, -0.1, 0.15, 0, 1), 0, 1
      );
    }

    if (ambientRef.current) {
      ambientRef.current.color.copy(ambColor);
      // Mobile runs far fewer point lights — lean harder on ambient so the room reads.
      ambientRef.current.intensity = ambInt * (IS_MOBILE ? 2.2 : 1.0);
    }

    // Key/fill "sun" lights dim and cool toward moonlight at night.
    if (sunLightRef.current) {
      sunLightRef.current.intensity = THREE.MathUtils.lerp(0.8, 0.16, night);
      sunLightRef.current.color.copy(_keyColor.copy(dayKeyColor).lerp(nightKeyColor, night));
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.lerp(0.14, 0.05, night);
    }

    if (scene.fog && scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(fogColor);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#f0d898" intensity={0.55} />
      <directionalLight ref={sunLightRef} position={[0, 20, -10]} intensity={0.8} color="#f0e8d4" />
      <directionalLight ref={fillLightRef} position={[6, 8, 30]} intensity={0.14} color="#b8c4d0" />
      <mesh renderOrder={-1}>
        <sphereGeometry args={[120, 48, 28]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={skyVS}
          fragmentShader={skyFS}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </>
  );
}
