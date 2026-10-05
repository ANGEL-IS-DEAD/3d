"use client";

// The interior 3D scene — walls, windows, columns, floor grid, furniture, pendant lights
// and the reception desk, all procedural geometry. Shared materials are the MAT_* consts at the top.
import { useRef, useMemo, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollStore";
import { themeState } from "@/lib/themeStore";
import { IS_MOBILE } from "@/lib/device";
import { woodTextures, marbleTextures, plasterBump, fabricBump, rugTexture,
  wallTextures, slatTextures, stoneTextures, groundTextures, cityFacadeTextures,
  asphaltTextures, pavementTextures } from "@/lib/textures";

// On mobile, MeshPhysicalMaterial's clearcoat adds shader uniforms/varyings that
// — combined with many lights — overflow the mobile fragment-uniform limit and
// make shaders fail to compile (black screen). Fall back to plain Standard.
function reflectiveMaterial(params: THREE.MeshPhysicalMaterialParameters) {
  if (IS_MOBILE) {
    const { clearcoat, clearcoatRoughness, ...std } = params;
    void clearcoat; void clearcoatRoughness;
    return new THREE.MeshStandardMaterial(std as THREE.MeshStandardMaterialParameters);
  }
  return new THREE.MeshPhysicalMaterial(params);
}

// ── MATERIALS ─────────────────────────────────────────────────────────────────

const MAT_FLOOR = reflectiveMaterial({
  color: "#3a2e22", roughness: 0.04, metalness: 0.0,
  clearcoat: 1.0, clearcoatRoughness: 0.04,
});
const MAT_WALL = new THREE.MeshStandardMaterial({
  color: "#3a3028", roughness: 0.72, metalness: 0.04,
});
const MAT_FEATURE_WALL = new THREE.MeshStandardMaterial({
  color: "#342218", roughness: 0.52, metalness: 0.08,
});
const MAT_CEILING = new THREE.MeshStandardMaterial({
  color: "#1c1814", roughness: 0.92, metalness: 0.0,
});
const MAT_COLUMN = reflectiveMaterial({
  color: "#302820", roughness: 0.16, metalness: 0.12,
  clearcoat: 0.6, clearcoatRoughness: 0.12,
});
// Trim / grid lines / window frames / fixtures — purple brand accent.
const MAT_GOLD = new THREE.MeshStandardMaterial({
  color: "#6d3cf0", roughness: 0.05, metalness: 1.0,
  emissive: new THREE.Color("#6d3cf0"), emissiveIntensity: 0.55,
});
// Cove / accent light strips — the signature brand glow. Recolour via `color` +
// `emissive` here (and the sibling MAT_* materials) to match your own brand.
const MAT_GOLD_GLOW = new THREE.MeshStandardMaterial({
  color: "#6d3cf0", roughness: 0.05, metalness: 0.6,
  emissive: new THREE.Color("#6d3cf0"), emissiveIntensity: 2.2,
});
const MAT_GLASS = new THREE.MeshStandardMaterial({
  color: "#aac4d4", roughness: 0.02, metalness: 0.1,
  transparent: true, opacity: 0.32,
  envMapIntensity: 1.0,
  side: THREE.DoubleSide, depthWrite: false,
});
// Neutral dark-bronze window mullions — not the purple brand accent.
const MAT_FRAME = new THREE.MeshStandardMaterial({
  color: "#2a241d", roughness: 0.35, metalness: 0.7,
});
// Exterior stone-paver ground — matte so it doesn't blow out to white under the sun.
const _ground = groundTextures(80);
const MAT_GROUND = new THREE.MeshStandardMaterial({
  color: "#ffffff", map: _ground.map, bumpMap: _ground.bump, bumpScale: 0.04,
  roughness: 0.82, metalness: 0.0,
});
const MAT_WOOD = new THREE.MeshStandardMaterial({
  color: "#2c1f14", roughness: 0.85, metalness: 0.0,
});
const MAT_SOFA = new THREE.MeshStandardMaterial({
  color: "#3a2e26", roughness: 0.90, metalness: 0.0,
});
const MAT_SOFA_CUSHION = new THREE.MeshStandardMaterial({
  color: "#46382c", roughness: 0.95, metalness: 0.0,
});
const MAT_SCREEN = new THREE.MeshBasicMaterial({
  color: "#80a8d8", transparent: true, opacity: 0.85,
});
const MAT_MARBLE = reflectiveMaterial({
  color: "#5a4e40", roughness: 0.12, metalness: 0.0,
  clearcoat: 0.7, clearcoatRoughness: 0.12,
});

// ── PROCEDURAL TEXTURE MAPS ─────────────────────────────────────────────────────
// Applied after material creation so the SSR-safe material defs stay declarative.
// Generators are DOM-based but this module is client-only (loaded via ssr:false).
const _wood = woodTextures();
const _marble = marbleTextures();
const _plaster = plasterBump();
const _fabric = fabricBump();
const _wall = wallTextures();
const _slat = slatTextures();
const _stone = stoneTextures();

// Polished dark-walnut floor — texture carries the colour, lighting + clearcoat do the sheen.
MAT_FLOOR.color.set("#ffffff");
MAT_FLOOR.map = _wood.map;
MAT_FLOOR.bumpMap = _wood.bump;
MAT_FLOOR.bumpScale = 0.015;

// Warm hand-plastered colour + relief on the broad interior walls.
MAT_WALL.color.set("#ffffff");
MAT_WALL.map = _wall.map;
MAT_WALL.bumpMap = _wall.bump; MAT_WALL.bumpScale = 0.05;

// Vertical wood-slat accent on the feature walls — ties to the floor.
MAT_FEATURE_WALL.color.set("#d8c0a0");
MAT_FEATURE_WALL.map = _slat.map;
MAT_FEATURE_WALL.bumpMap = _slat.bump; MAT_FEATURE_WALL.bumpScale = 0.06;

// Ceiling keeps plain plaster relief.
MAT_CEILING.bumpMap = _plaster; MAT_CEILING.bumpScale = 0.05;

// Dark veined stone on the columns — matches the marble counters.
MAT_COLUMN.color.set("#ffffff");
MAT_COLUMN.map = _stone.map;
MAT_COLUMN.bumpMap = _stone.bump; MAT_COLUMN.bumpScale = 0.02;

// Real wood grain on furniture surfaces.
MAT_WOOD.color.set("#c8b088");
MAT_WOOD.map = _wood.map;
MAT_WOOD.bumpMap = _wood.bump;
MAT_WOOD.bumpScale = 0.02;

// Veined marble on countertops / tabletops.
MAT_MARBLE.color.set("#ffffff");
MAT_MARBLE.map = _marble.map;
MAT_MARBLE.bumpMap = _marble.bump;
MAT_MARBLE.bumpScale = 0.015;

// Woven-fabric relief on upholstery.
MAT_SOFA.bumpMap = _fabric; MAT_SOFA.bumpScale = 0.03;
MAT_SOFA_CUSHION.bumpMap = _fabric; MAT_SOFA_CUSHION.bumpScale = 0.04;

// ── REUSABLE PRIMITIVES ───────────────────────────────────────────────────────

function Column({ pos, h = 10, size = 0.45 }: {
  pos: [number, number, number]; h?: number; size?: number;
}) {
  return (
    <group position={pos}>
      <mesh material={MAT_COLUMN} position={[0, h / 2, 0]}>
        <boxGeometry args={[size, h, size]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[0, 0.08, 0]}>
        <boxGeometry args={[size + 0.18, 0.16, size + 0.18]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[0, h - 0.08, 0]}>
        <boxGeometry args={[size + 0.18, 0.16, size + 0.18]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[0, h * 0.38, 0]}>
        <boxGeometry args={[size + 0.04, 0.04, size + 0.04]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[0, h * 0.62, 0]}>
        <boxGeometry args={[size + 0.04, 0.04, size + 0.04]} />
      </mesh>
    </group>
  );
}

function Pendant({ pos, cordLen = 4, brightness = 2.0 }: {
  pos: [number, number, number]; cordLen?: number; brightness?: number;
}) {
  const glowRef = useRef<THREE.Mesh>(null!);
  // Deterministic per-pendant phase (hash of position) — stable across reloads and
  // pure (no Math.random in render).
  const phase = useMemo(() => {
    const h = Math.sin(pos[0] * 12.9898 + pos[2] * 78.233) * 43758.5453;
    return (h - Math.floor(h)) * Math.PI * 2;
  }, [pos]);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = brightness * 0.7 + Math.sin(clock.getElapsedTime() * 0.5 + phase) * 0.12;
    }
  });
  return (
    <group position={pos}>
      <mesh material={MAT_GOLD} position={[0, -cordLen / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, cordLen, 6]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[0, -cordLen - 0.1, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.12, 12]} />
      </mesh>
      <mesh ref={glowRef} position={[0, -cordLen - 0.22, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#ffe8b0" emissive={new THREE.Color("#ffe8b0")}
          emissiveIntensity={brightness * 0.7} roughness={0.05} metalness={0} />
      </mesh>
      {/* Real point light on desktop only — mobile keeps just the emissive glow */}
      {!IS_MOBILE && (
        <pointLight position={[0, -cordLen - 0.22, 0]} color="#ffe0a0"
          intensity={brightness} distance={12} decay={2} />
      )}
    </group>
  );
}

function CofferedCeiling({ pos, w, d, rows = 3, cols = 4 }: {
  pos: [number, number, number]; w: number; d: number; rows?: number; cols?: number;
}) {
  const cellW = w / cols;
  const cellD = d / rows;
  const borderW = 0.12;
  return (
    <group position={pos}>
      <mesh material={MAT_CEILING}><boxGeometry args={[w, 0.12, d]} /></mesh>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <mesh key={`${r}-${c}`} material={MAT_CEILING}
            position={[-w / 2 + cellW * (c + 0.5), 0.09, -d / 2 + cellD * (r + 0.5)]}>
            <boxGeometry args={[cellW - borderW, 0.06, cellD - borderW]} />
          </mesh>
        ))
      )}
      <mesh material={MAT_GOLD_GLOW} position={[0, 0.07, -d / 2 + 0.04]}>
        <boxGeometry args={[w - 0.02, 0.03, 0.04]} />
      </mesh>
      <mesh material={MAT_GOLD_GLOW} position={[0, 0.07, d / 2 - 0.04]}>
        <boxGeometry args={[w - 0.02, 0.03, 0.04]} />
      </mesh>
      <mesh material={MAT_GOLD_GLOW} position={[-w / 2 + 0.04, 0.07, 0]}>
        <boxGeometry args={[0.04, 0.03, d - 0.02]} />
      </mesh>
      <mesh material={MAT_GOLD_GLOW} position={[w / 2 - 0.04, 0.07, 0]}>
        <boxGeometry args={[0.04, 0.03, d - 0.02]} />
      </mesh>
    </group>
  );
}

// ── FURNITURE ─────────────────────────────────────────────────────────────────

function Sofa({ pos, rot = 0, w = 2.2 }: {
  pos: [number, number, number]; rot?: number; w?: number;
}) {
  const legPositions: [number, number][] = [
    [-w / 2 + 0.15, -0.35], [w / 2 - 0.15, -0.35],
    [-w / 2 + 0.15,  0.35], [w / 2 - 0.15,  0.35],
  ];
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh material={MAT_SOFA} position={[0, 0.22, 0]}>
        <boxGeometry args={[w, 0.44, 0.85]} />
      </mesh>
      <mesh material={MAT_SOFA} position={[0, 0.62, -0.36]}>
        <boxGeometry args={[w, 0.52, 0.14]} />
      </mesh>
      <mesh material={MAT_SOFA_CUSHION} position={[0, 0.46, 0.04]}>
        <boxGeometry args={[w - 0.1, 0.06, 0.62]} />
      </mesh>
      <mesh material={MAT_SOFA} position={[-w / 2 + 0.07, 0.52, 0]}>
        <boxGeometry args={[0.14, 0.62, 0.85]} />
      </mesh>
      <mesh material={MAT_SOFA} position={[w / 2 - 0.07, 0.52, 0]}>
        <boxGeometry args={[0.14, 0.62, 0.85]} />
      </mesh>
      {legPositions.map(([lx, lz], i) => (
        <mesh key={i} material={MAT_GOLD} position={[lx, 0.05, lz]}>
          <boxGeometry args={[0.05, 0.1, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable({ pos }: { pos: [number, number, number] }) {
  const legPositions: [number, number][] = [[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.22], [0.42, 0.22]];
  return (
    <group position={pos}>
      <mesh material={MAT_MARBLE} position={[0, 0.38, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.55]} />
      </mesh>
      {legPositions.map(([lx, lz], i) => (
        <mesh key={i} material={MAT_GOLD} position={[lx, 0.19, lz]}>
          <boxGeometry args={[0.03, 0.38, 0.03]} />
        </mesh>
      ))}
    </group>
  );
}

function WorkTable({ pos, numLaptops = 3 }: {
  pos: [number, number, number]; numLaptops?: number;
}) {
  return (
    <group position={pos}>
      <mesh material={MAT_WOOD} position={[0, 0.74, 0]}>
        <boxGeometry args={[2.8, 0.06, 1.1]} />
      </mesh>
      {([-1.2, 1.2] as const).map((x, i) => (
        <group key={i}>
          <mesh material={MAT_GOLD} position={[x, 0.37, -0.45]}>
            <boxGeometry args={[0.04, 0.74, 0.04]} />
          </mesh>
          <mesh material={MAT_GOLD} position={[x, 0.37, 0.45]}>
            <boxGeometry args={[0.04, 0.74, 0.04]} />
          </mesh>
          <mesh material={MAT_GOLD} position={[x, 0.08, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.94]} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: numLaptops }).map((_, i) => (
        <group key={i} position={[-1.0 + i * 1.0, 0.77, i % 2 === 0 ? -0.15 : 0.15]}
          rotation={[0, i % 2 === 0 ? 0.08 : -0.06, 0]}>
          <mesh material={MAT_WOOD} position={[0, 0, 0]}>
            <boxGeometry args={[0.32, 0.02, 0.22]} />
          </mesh>
          <mesh material={MAT_SCREEN} position={[0, 0.12, -0.09]} rotation={[-Math.PI * 0.32, 0, 0]}>
            <planeGeometry args={[0.28, 0.18]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── POOL TABLE (8-ball) ──────────────────────────────────────────────────────────
const MAT_FELT = new THREE.MeshStandardMaterial({
  color: "#1f5a3a", roughness: 0.95, metalness: 0.0,
});
const MAT_RAIL = new THREE.MeshStandardMaterial({
  color: "#2a1a10", roughness: 0.4, metalness: 0.1,
});
const MAT_POCKET = new THREE.MeshStandardMaterial({
  color: "#050403", roughness: 0.9, metalness: 0.0,
});
// 8-ball set: cue (white), 8 (black), then a spread of solids/stripes (approximated by colour).
const BALL_COLORS = [
  "#e8e4d8", "#1a1a1a", "#d4a017", "#1f4fa0", "#b01818", "#5a2a8a",
  "#d06010", "#1f7a3a", "#7a1830", "#d4a017", "#1f4fa0", "#b01818",
  "#5a2a8a", "#d06010", "#1f7a3a", "#7a1830",
];
const MAT_BALLS = BALL_COLORS.map((c) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.15, metalness: 0.0 })
);

function PoolTable({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  const W = 2.4;   // length (x)
  const D = 1.3;   // width (z)
  const TOP = 0.78;
  const BALL_R = 0.05;
  const BY = TOP + 0.06 + BALL_R; // ball centre height

  // Racked triangle of 15 near +x foot, cue ball near -x.
  const racked: Array<{ p: [number, number, number]; ci: number }> = [];
  let ci = 2;
  const apexX = W * 0.22;
  for (let row = 0; row < 5; row++) {
    for (let s = 0; s <= row; s++) {
      const x = apexX + row * BALL_R * 1.74;
      const z = (s - row / 2) * BALL_R * 2.02;
      // Keep the 8-ball (index 1) in the centre of the rack.
      const isCentre = row === 2 && s === 1;
      racked.push({ p: [x, BY, z], ci: isCentre ? 1 : ci++ % BALL_COLORS.length });
    }
  }

  const pockets: [number, number][] = [
    [-W / 2, -D / 2], [0, -D / 2 - 0.02], [W / 2, -D / 2],
    [-W / 2,  D / 2], [0,  D / 2 + 0.02], [W / 2,  D / 2],
  ];
  const legX = W / 2 - 0.18, legZ = D / 2 - 0.18;

  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Cabinet body */}
      <mesh material={MAT_WOOD} position={[0, TOP - 0.16, 0]}>
        <boxGeometry args={[W + 0.2, 0.32, D + 0.2]} />
      </mesh>
      {/* Felt bed */}
      <mesh material={MAT_FELT} position={[0, TOP + 0.02, 0]}>
        <boxGeometry args={[W, 0.04, D] } />
      </mesh>
      {/* Cushion rails (top frame) */}
      {([[0, (D / 2) + 0.06, W + 0.24, 0.12], [0, -(D / 2) - 0.06, W + 0.24, 0.12]] as const).map(
        ([rx, rz, rw, rd], i) => (
          <mesh key={`rh${i}`} material={MAT_RAIL} position={[rx, TOP + 0.07, rz]}>
            <boxGeometry args={[rw, 0.1, rd]} />
          </mesh>
        )
      )}
      {([[(W / 2) + 0.06, 0, 0.12, D - 0.04], [-(W / 2) - 0.06, 0, 0.12, D - 0.04]] as const).map(
        ([rx, rz, rw, rd], i) => (
          <mesh key={`rv${i}`} material={MAT_RAIL} position={[rx, TOP + 0.07, rz]}>
            <boxGeometry args={[rw, 0.1, rd]} />
          </mesh>
        )
      )}
      {/* Pockets */}
      {pockets.map(([px, pz], i) => (
        <mesh key={i} material={MAT_POCKET} position={[px, TOP + 0.08, pz]}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 14]} />
        </mesh>
      ))}
      {/* Diamond sight markers on rails */}
      {[-0.7, 0, 0.7].map((mx, i) => (
        <group key={i}>
          <mesh material={MAT_GOLD} position={[mx, TOP + 0.13, (D / 2) + 0.06]}>
            <sphereGeometry args={[0.018, 6, 6]} />
          </mesh>
          <mesh material={MAT_GOLD} position={[mx, TOP + 0.13, -(D / 2) - 0.06]}>
            <sphereGeometry args={[0.018, 6, 6]} />
          </mesh>
        </group>
      ))}
      {/* Legs */}
      {([[legX, legZ], [-legX, legZ], [legX, -legZ], [-legX, -legZ]] as const).map(([lx, lz], i) => (
        <mesh key={i} material={MAT_RAIL} position={[lx, (TOP - 0.32) / 2, lz]}>
          <boxGeometry args={[0.22, TOP - 0.32, 0.22]} />
        </mesh>
      ))}
      {/* Racked balls + cue ball */}
      {racked.map((b, i) => (
        <mesh key={i} material={MAT_BALLS[b.ci]} position={b.p}>
          <sphereGeometry args={[BALL_R, 12, 12]} />
        </mesh>
      ))}
      <mesh material={MAT_BALLS[0]} position={[-W * 0.28, BY, 0.04]}>
        <sphereGeometry args={[BALL_R, 12, 12]} />
      </mesh>
      {/* Two cue sticks leaning on the side rail */}
      {([0.35, -0.2] as const).map((dz, i) => (
        <mesh key={i} material={MAT_WOOD}
          position={[(W / 2) + 0.35, TOP + 0.6, dz]} rotation={[0.1 * (i ? -1 : 1), 0, Math.PI * 0.13]}>
          <cylinderGeometry args={[0.012, 0.022, 1.5, 8]} />
        </mesh>
      ))}
      {/* Low pendant glow over the table */}
      {!IS_MOBILE && <pointLight position={[0, TOP + 1.4, 0]} color="#fff0d0" intensity={3.0} distance={6} decay={2} />}
    </group>
  );
}

// Reusable emissive bottle material cache (one per colour) keeps draw setup cheap.
const BOTTLE_COLORS = ["#6d3cf0", "#c9a96e", "#3a7e64", "#9a3a4a", "#2a5a8a", "#c08030", "#7a3a8a"];
const MAT_BOTTLES = BOTTLE_COLORS.map((c) =>
  new THREE.MeshStandardMaterial({
    color: c, emissive: new THREE.Color(c), emissiveIntensity: 0.3,
    roughness: 0.12, metalness: 0.0, transparent: true, opacity: 0.9,
  })
);
const MAT_LED_PURPLE = new THREE.MeshStandardMaterial({
  color: "#6d3cf0", emissive: new THREE.Color("#6d3cf0"), emissiveIntensity: 2.0, roughness: 0.4,
});
const MAT_LED_WARM = new THREE.MeshStandardMaterial({
  color: "#c9a96e", emissive: new THREE.Color("#c9a96e"), emissiveIntensity: 1.6, roughness: 0.4,
});
const MAT_BACKLIT = new THREE.MeshBasicMaterial({
  color: "#3a205c", transparent: true, opacity: 0.55,
});
const MAT_LEATHER = new THREE.MeshStandardMaterial({
  color: "#3a2a22", roughness: 0.6, metalness: 0.05, bumpMap: fabricBump(), bumpScale: 0.02,
});

// A single bottle (body + neck) on the back-bar shelves.
function Bottle({ pos, h, ci }: { pos: [number, number, number]; h: number; ci: number }) {
  return (
    <group position={pos}>
      <mesh material={MAT_BOTTLES[ci]} position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.06, h, 10]} />
      </mesh>
      <mesh material={MAT_BOTTLES[ci]} position={[0, h + 0.06, 0]}>
        <cylinderGeometry args={[0.018, 0.024, 0.12, 8]} />
      </mesh>
    </group>
  );
}

// Bar stool — pedestal, leather seat, brass foot-ring and a low back.
function BarStool({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh material={MAT_FRAME} position={[0, 0.40, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.8, 10]} />
      </mesh>
      <mesh material={MAT_FRAME} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.04, 14]} />
      </mesh>
      {/* Foot ring */}
      <mesh material={MAT_GOLD} position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.012, 8, 20]} />
      </mesh>
      {/* Seat */}
      <mesh material={MAT_LEATHER} position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.21, 0.20, 0.1, 18]} />
      </mesh>
      {/* Low back */}
      <mesh material={MAT_FRAME} position={[0, 1.0, -0.18]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[0.34, 0.28, 0.04]} />
      </mesh>
    </group>
  );
}

// A proper cocktail/lounge bar. Long axis runs along Z; the patron side (with stools)
// faces -x, the illuminated back-bar bottle display faces the wall side (+x).
function CoffeeBar({ pos }: { pos: [number, number, number] }) {
  const shelfYs = [1.5, 2.05, 2.6];
  const bottlesPerShelf = IS_MOBILE ? 6 : 10;
  const shelfData = IS_MOBILE ? shelfYs.slice(0, 2) : shelfYs;
  const barLen = 3.6;

  return (
    <group position={pos}>
      {/* ── FRONT COUNTER (long in Z, depth in X) ── */}
      <mesh material={MAT_WOOD} position={[0, 0.55, 0]}>
        <boxGeometry args={[0.7, 1.1, barLen]} />
      </mesh>
      {/* Recessed front panel detail */}
      <mesh material={MAT_FEATURE_WALL} position={[-0.36, 0.55, 0]}>
        <boxGeometry args={[0.02, 0.86, barLen - 0.3]} />
      </mesh>
      {/* Marble top with patron-side overhang */}
      <mesh material={MAT_MARBLE} position={[-0.06, 1.14, 0]}>
        <boxGeometry args={[0.92, 0.06, barLen + 0.1]} />
      </mesh>
      {/* Under-counter purple LED wash */}
      <mesh material={MAT_LED_PURPLE} position={[-0.37, 0.06, 0]}>
        <boxGeometry args={[0.015, 0.03, barLen - 0.4]} />
      </mesh>
      {/* Brass foot rail on patron side */}
      <mesh material={MAT_GOLD} position={[-0.62, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, barLen - 0.2, 10]} />
      </mesh>
      {[-1.4, 0, 1.4].map((z, i) => (
        <mesh key={i} material={MAT_GOLD} position={[-0.62, 0.09, z]}>
          <boxGeometry args={[0.04, 0.18, 0.04]} />
        </mesh>
      ))}

      {/* ── BACK-BAR CABINET (wall side, +x) ── */}
      <group position={[0.62, 0, 0]}>
        {/* Backboard */}
        <mesh material={MAT_FEATURE_WALL} position={[0.14, 1.95, 0]}>
          <boxGeometry args={[0.12, 2.9, barLen]} />
        </mesh>
        {/* Backlit panel facing the room */}
        <mesh material={MAT_BACKLIT} position={[0.07, 2.0, 0]}>
          <boxGeometry args={[0.02, 2.4, barLen - 0.3]} />
        </mesh>
        {/* Shelves + glow strips + bottles */}
        {shelfData.map((sy, si) => (
          <group key={si}>
            <mesh material={MAT_GOLD} position={[-0.02, sy - 0.03, 0]}>
              <boxGeometry args={[0.26, 0.025, barLen - 0.2]} />
            </mesh>
            <mesh material={MAT_LED_WARM} position={[-0.14, sy - 0.04, 0]}>
              <boxGeometry args={[0.012, 0.012, barLen - 0.3]} />
            </mesh>
            {Array.from({ length: bottlesPerShelf }).map((_, bi) => {
              const span = barLen - 0.5;
              const z = -span / 2 + (span / (bottlesPerShelf - 1)) * bi;
              const h = 0.26 + ((bi * 5 + si * 3) % 4) * 0.06;
              return (
                <Bottle key={bi} pos={[-0.05, sy, z]} h={h} ci={(bi + si) % BOTTLE_COLORS.length} />
              );
            })}
          </group>
        ))}
      </group>

      {/* ── ON-COUNTER PROPS ── */}
      {/* Cocktail shaker */}
      <mesh material={MAT_GOLD} position={[0.05, 1.32, 0.7]}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 12]} />
      </mesh>
      {/* Stacked rocks glasses */}
      {[-0.9, -0.65, -0.4].map((z, i) => (
        <mesh key={i} material={MAT_GLASS} position={[0.05, 1.22, z]}>
          <cylinderGeometry args={[0.05, 0.04, 0.13, 12]} />
        </mesh>
      ))}
      {/* Garnish caddy */}
      <mesh material={MAT_WOOD} position={[0.1, 1.24, 1.1]}>
        <boxGeometry args={[0.2, 0.14, 0.2]} />
      </mesh>

      {/* ── STOOLS (patron side) ── */}
      {[-1.2, 0, 1.2].map((z, i) => (
        <BarStool key={i} pos={[-1.05, 0, z]} />
      ))}

      {/* Warm bar lighting */}
      {!IS_MOBILE && <pointLight position={[0.2, 2.6, 0]} color="#ffcaa0" intensity={3.0} distance={7} decay={2} />}
      {!IS_MOBILE && <pointLight position={[0.4, 1.7, 0]} color="#c9a96e" intensity={2.2} distance={5} decay={2} />}
    </group>
  );
}

// ── DECOR ───────────────────────────────────────────────────────────────────────

const MAT_RUG = new THREE.MeshStandardMaterial({
  map: rugTexture(), roughness: 0.95, metalness: 0.0,
});
const MAT_PLANT = new THREE.MeshStandardMaterial({
  color: "#23381f", roughness: 0.85, metalness: 0.0,
});
const MAT_PLANT_HI = new THREE.MeshStandardMaterial({
  color: "#33512a", roughness: 0.8, metalness: 0.0,
});
const MAT_POT = new THREE.MeshStandardMaterial({
  color: "#241b14", roughness: 0.5, metalness: 0.1,
});

function Rug({ pos, w = 4, d = 3, rot = 0 }: {
  pos: [number, number, number]; w?: number; d?: number; rot?: number;
}) {
  return (
    <mesh material={MAT_RUG} rotation={[-Math.PI / 2, 0, rot]} position={[pos[0], 0.11, pos[2]]}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

function PottedPlant({ pos, scale = 1 }: { pos: [number, number, number]; scale?: number }) {
  // Deterministic-ish foliage cluster
  const blobs = useMemo(() => {
    const out: Array<{ p: [number, number, number]; r: number; hi: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const rad = 0.12 + (i % 3) * 0.06;
      out.push({
        p: [Math.cos(a) * rad, 0.95 + (i % 4) * 0.14, Math.sin(a) * rad],
        r: 0.18 + (i % 3) * 0.05,
        hi: i % 2 === 0,
      });
    }
    out.push({ p: [0, 1.35, 0], r: 0.22, hi: true });
    return out;
  }, []);
  return (
    <group position={pos} scale={scale}>
      {/* Pot */}
      <mesh material={MAT_POT} position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.32, 0.24, 0.6, 16]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[0, 0.58, 0]}>
        <torusGeometry args={[0.31, 0.015, 8, 24]} />
      </mesh>
      {/* Trunk */}
      <mesh material={MAT_WOOD} position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.5, 8]} />
      </mesh>
      {/* Foliage */}
      {blobs.map((b, i) => (
        <mesh key={i} material={b.hi ? MAT_PLANT_HI : MAT_PLANT} position={b.p}>
          <icosahedronGeometry args={[b.r, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function WallArt({ pos, rot = 0, w = 1.6, h = 2.2, tint = "#6d3cf0" }: {
  pos: [number, number, number]; rot?: number; w?: number; h?: number; tint?: string;
}) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Gold frame */}
      <mesh material={MAT_GOLD} position={[0, 0, 0]}>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.04]} />
      </mesh>
      {/* Canvas */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#0d0a12" roughness={0.6} metalness={0.1}
          emissive={new THREE.Color(tint)} emissiveIntensity={0.12} />
      </mesh>
      {/* Abstract brush stroke */}
      <mesh position={[0, -h * 0.1, 0.035]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[w * 0.5, h * 0.18]} />
        <meshBasicMaterial color={tint} transparent opacity={0.5} />
      </mesh>
      <mesh position={[w * 0.12, h * 0.2, 0.035]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[w * 0.35, h * 0.1]} />
        <meshBasicMaterial color="#c9a96e" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function Bookshelf({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  const bookColors = ["#3a2418", "#1f2a3a", "#2a1f2a", "#33281a", "#1a2a24", "#2e1a1a"];
  const shelves = [0.5, 1.4, 2.3];
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Carcass */}
      <mesh material={MAT_WOOD} position={[0, 1.4, 0]}>
        <boxGeometry args={[2.0, 2.8, 0.4]} />
      </mesh>
      {/* Hollow front (dark recess) */}
      <mesh position={[0, 1.4, 0.16]}>
        <boxGeometry args={[1.8, 2.6, 0.12]} />
        <meshStandardMaterial color="#0c0908" roughness={0.95} />
      </mesh>
      {/* Shelf boards + books */}
      {shelves.map((sy, si) => (
        <group key={si}>
          <mesh material={MAT_WOOD} position={[0, sy + 0.02, 0.16]}>
            <boxGeometry args={[1.8, 0.04, 0.34]} />
          </mesh>
          {Array.from({ length: 9 }).map((_, bi) => {
            const bh = 0.5 + ((bi * 7 + si * 3) % 4) * 0.07;
            const lean = bi === 8 ? 0.12 : 0;
            return (
              <mesh key={bi} position={[-0.8 + bi * 0.19, sy + 0.04 + bh / 2, 0.18]}
                rotation={[0, 0, lean]}>
                <boxGeometry args={[0.14, bh, 0.28]} />
                <meshStandardMaterial color={bookColors[(bi + si) % bookColors.length]}
                  roughness={0.8} metalness={0.0} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// ── WALLS WITH WINDOW OPENINGS ────────────────────────────────────────────────

// Wall spans z: -4 to -26 (22 units). Windows at z: -10→-14, -16→-20, -22→-25.
const WIN_H = 7.0;
const SOLID_H = (10 - WIN_H) / 2; // 1.5 top/bottom strips

function WallSegment({ x, z1, z2, side }: { x: number; z1: number; z2: number; side: 1 | -1 }) {
  const len = Math.abs(z2 - z1);
  const zc = (z1 + z2) / 2;
  const xInner = x + side * (-0.07);
  return (
    <group>
      <mesh material={MAT_WALL} position={[x, 5, zc]}>
        <boxGeometry args={[0.14, 10, len]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[xInner, 0.07, zc]}>
        <boxGeometry args={[0.04, 0.14, len]} />
      </mesh>
      <mesh material={MAT_GOLD_GLOW} position={[xInner, 9.94, zc]}>
        <boxGeometry args={[0.04, 0.05, len]} />
      </mesh>
    </group>
  );
}

function WindowSegment({ x, z1, z2, side }: { x: number; z1: number; z2: number; side: 1 | -1 }) {
  const len = Math.abs(z2 - z1);
  const zc = (z1 + z2) / 2;
  const xInner = x + side * (-0.07);
  return (
    <group>
      {/* Bottom solid strip */}
      <mesh material={MAT_WALL} position={[x, SOLID_H / 2, zc]}>
        <boxGeometry args={[0.14, SOLID_H, len]} />
      </mesh>
      {/* Top solid strip */}
      <mesh material={MAT_WALL} position={[x, 10 - SOLID_H / 2, zc]}>
        <boxGeometry args={[0.14, SOLID_H, len]} />
      </mesh>
      {/* Gold trim bottom */}
      <mesh material={MAT_GOLD} position={[xInner, 0.07, zc]}>
        <boxGeometry args={[0.04, 0.14, len]} />
      </mesh>
      {/* Gold trim top */}
      <mesh material={MAT_GOLD_GLOW} position={[xInner, 9.94, zc]}>
        <boxGeometry args={[0.04, 0.05, len]} />
      </mesh>
      {/* Brass sill + header */}
      <mesh material={MAT_GOLD} position={[xInner, SOLID_H, zc]}>
        <boxGeometry args={[0.04, 0.06, len]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[xInner, SOLID_H + WIN_H, zc]}>
        <boxGeometry args={[0.04, 0.06, len]} />
      </mesh>
      {/* Glass pane */}
      <mesh material={MAT_GLASS} position={[xInner, SOLID_H + WIN_H / 2, zc]}>
        <boxGeometry args={[0.06, WIN_H, len - 0.1]} />
      </mesh>
      {/* Mullion grid — vertical bars divide the pane into ~1.3-unit lights */}
      {(() => {
        const vDiv = Math.max(2, Math.round(len / 1.3));
        const bars = [];
        for (let i = 1; i < vDiv; i++) {
          const mz = (zc - len / 2) + (len / vDiv) * i;
          bars.push(
            <mesh key={`v${i}`} material={MAT_FRAME} position={[xInner, SOLID_H + WIN_H / 2, mz]}>
              <boxGeometry args={[0.05, WIN_H, 0.045]} />
            </mesh>
          );
        }
        return bars;
      })()}
      {/* Horizontal transom rails at 1/3 and 2/3 height */}
      {[SOLID_H + WIN_H / 3, SOLID_H + (WIN_H * 2) / 3].map((my, i) => (
        <mesh key={`h${i}`} material={MAT_FRAME} position={[xInner, my, zc]}>
          <boxGeometry args={[0.05, 0.045, len - 0.08]} />
        </mesh>
      ))}
      {/* City glow bleed */}
      <mesh position={[x - side * 0.3, SOLID_H + WIN_H / 2, zc]}>
        <planeGeometry args={[len - 0.2, WIN_H * 0.9]} />
        <meshBasicMaterial color="#203060" transparent opacity={0.04}
          depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SideWalls() {
  // Left wall (x=-8, side=-1 means xInner = -8+0.07 = -7.93)
  // Right wall (x=+8, side=+1 means xInner = 8-0.07 = 7.93)
  const configs: Array<{ x: number; side: 1 | -1 }> = [
    { x: -8, side: -1 },
    { x:  8, side:  1 },
  ];
  return (
    <>
      {configs.map(({ x, side }) => (
        <group key={x}>
          <WallSegment  x={x} z1={-4}  z2={-10} side={side} />
          <WindowSegment x={x} z1={-10} z2={-14} side={side} />
          <WallSegment  x={x} z1={-14} z2={-16} side={side} />
          <WindowSegment x={x} z1={-16} z2={-20} side={side} />
          <WallSegment  x={x} z1={-20} z2={-22} side={side} />
          <WindowSegment x={x} z1={-22} z2={-25} side={side} />
          <WallSegment  x={x} z1={-25} z2={-26} side={side} />
          {/* Vertical gold dividers at window transitions */}
          {[-10, -14, -16, -20, -22, -25].map((z, i) => (
            <mesh key={i} material={MAT_GOLD} position={[x + side * (-0.07), 5, z]}>
              <boxGeometry args={[0.04, 9.6, 0.04]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

// ── CITY SKYLINE (surrounds the building) ─────────────────────────────────────
// A textured glass-tower skyline that frames the whole plot — lines the approach
// street and reads through the side windows. Each template is one instanced mesh
// (≈6 draw calls total) with a procedural facade (lit windows that glow at night).

// w≈d so every face reads as the same tower; cols/rows tuned to ~square windows.
const CITY_TEMPLATES = [
  { w: 4.0, d: 3.8, h: 8,  cols: 4, rows: 6 },
  { w: 3.6, d: 3.5, h: 13, cols: 4, rows: 10 },
  { w: 3.0, d: 3.0, h: 20, cols: 3, rows: 15 },
  { w: 5.0, d: 4.6, h: 11, cols: 5, rows: 8 },
  { w: 4.2, d: 4.0, h: 17, cols: 4, rows: 13 },
  { w: 6.0, d: 5.4, h: 6,  cols: 6, rows: 5 },
] as const;

type CityInstance = { x: number; z: number; rot: number };

function CityCluster({
  template, instances, material,
}: {
  template: (typeof CITY_TEMPLATES)[number];
  instances: CityInstance[];
  material: THREE.Material;
}) {
  const setRef = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3(1, 1, 1);
    const pos = new THREE.Vector3();
    instances.forEach((it, i) => {
      e.set(0, it.rot, 0); q.setFromEuler(e);
      pos.set(it.x, template.h / 2, it.z);
      m.compose(pos, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    // InstancedMesh frustum culling uses the single box bounding sphere, not the spread
    // of instances, so it would wrongly cull the whole cluster — disable it (only 6 meshes).
    mesh.frustumCulled = false;
  };
  return (
    <instancedMesh ref={setRef} args={[undefined, undefined, instances.length]} material={material}>
      <boxGeometry args={[template.w, template.h, template.d]} />
    </instancedMesh>
  );
}

// ── CITY STREET GRID ───────────────────────────────────────────────────────────
// A simple orthogonal grid. Towers are placed in the blocks between these streets,
// and the Streetscape component paves the same lines — so every building lines a road.
const STREET_HALF = 4;                         // half road width (≈8 wide)
const CROSS_STREET_Z = 20;                      // the main cross street in front
const V_STREETS = [                             // run along Z (depth)
  { x: -40, z0: -44, z1: 48 },
  { x: -22, z0: -44, z1: 48 },
  { x: 0,   z0: 6,   z1: 48 },                  // approach avenue (front of building only)
  { x: 22,  z0: -44, z1: 48 },
  { x: 40,  z0: -44, z1: 48 },
] as const;
const H_STREETS = [                             // run along X (width)
  { z: 38,             x0: -44, x1: 44 },
  { z: CROSS_STREET_Z, x0: -44, x1: 44 },
  { z: -34,            x0: -44, x1: 44 },
] as const;

// True if (x,z) sits on (or within `margin` of) any street.
function onStreet(x: number, z: number, margin = 0): boolean {
  for (const s of V_STREETS)
    if (Math.abs(x - s.x) < STREET_HALF + margin && z >= s.z0 - margin && z <= s.z1 + margin) return true;
  for (const s of H_STREETS)
    if (Math.abs(z - s.z) < STREET_HALF + margin && x >= s.x0 - margin && x <= s.x1 + margin) return true;
  return false;
}

function CityExterior({ mobile = false }: { mobile?: boolean }) {
  const COUNT = mobile ? 26 : 62;

  // Procedural facade material per template (shared across that template's instances).
  const materials = useMemo(
    () => CITY_TEMPLATES.map((t, i) => {
      const { map, emissive } = cityFacadeTextures(t.cols, t.rows, i + 1);
      return new THREE.MeshStandardMaterial({
        map, emissiveMap: emissive, emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.12, roughness: 0.66, metalness: 0.18, fog: true,
      });
    }),
    [],
  );

  // Fill the blocks between streets with towers — set back from every curb so each one
  // lines a road. Deterministic RNG → identical every load.
  const clusters = useMemo(() => {
    const rng = mulberry32Local(20260625);
    const buckets: CityInstance[][] = CITY_TEMPLATES.map(() => []);
    let placed = 0, tries = 0;
    while (placed < COUNT && tries < COUNT * 40) {
      tries++;
      const x = (rng() * 2 - 1) * 46;
      const z = 46 - rng() * 90;                 // +46 (far street) → -44 (behind)
      // Keep our own plot + forecourt clear…
      if (Math.abs(x) < 12 && z < 6 && z > -30) continue;
      // …keep the avenue road + sidewalk clear (towers line it from x≈8 out)…
      if (Math.abs(x) < 7.5 && z >= 6) continue;
      // …and set every tower back from any street curb.
      if (onStreet(x, z, 2)) continue;

      // Near the plot → shorter towers (don't wall off the windows); far → allow tall.
      const near = Math.abs(x) < 26 && z > -32;
      const pool = near ? [0, 1, 5, 3] : [1, 2, 3, 4];
      const ti = pool[Math.floor(rng() * pool.length)];
      const rot = Math.floor(rng() * 4) * (Math.PI / 2) + (rng() - 0.5) * 0.18;
      buckets[ti].push({ x, z, rot });
      placed++;
    }
    return buckets;
  }, [COUNT]);

  // Day → night: lit windows glow. Eased so the toggle fades smoothly.
  const nightRef = useRef(themeState.night);
  useFrame((_state, delta) => {
    nightRef.current += (themeState.night - nightRef.current) * (1 - Math.exp(-3 * Math.min(delta, 0.1)));
    const ei = 0.1 + nightRef.current * 1.5;
    for (const m of materials) m.emissiveIntensity = ei;
  });

  return (
    <group>
      {CITY_TEMPLATES.map((t, i) =>
        clusters[i].length > 0 ? (
          <CityCluster key={i} template={t} instances={clusters[i]} material={materials[i]} />
        ) : null,
      )}
    </group>
  );
}

// Local deterministic RNG (same algorithm as lib/textures) so the skyline layout is
// stable across reloads without importing the texture module's private helper.
function mulberry32Local(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── STREETSCAPE (road grid, plaza, markings, streetlights, trees, cars) ────────
// Paves the same grid the towers line, plus the building's avenue/forecourt, painted
// markings, a crosswalk, instanced streetlights, street trees and parked cars — and a
// wet-asphalt sheen + light reflections at night. Every piece is a flat quad or an
// InstancedMesh, so the whole streetscape stays at a few dozen draw calls.

// Lane paint / curbs — white, faintly emissive so markings still read at night.
const MAT_LINE = new THREE.MeshStandardMaterial({
  color: "#d9d6c8", roughness: 0.8, metalness: 0.0,
  emissive: new THREE.Color("#d9d6c8"), emissiveIntensity: 0.12,
});
const MAT_CURB = new THREE.MeshStandardMaterial({ color: "#6a655c", roughness: 0.9, metalness: 0.0 });
const MAT_POLE = new THREE.MeshStandardMaterial({ color: "#1c1c1e", roughness: 0.4, metalness: 0.7 });
const MAT_LAMP = new THREE.MeshStandardMaterial({
  color: "#fff0d4", roughness: 0.4, metalness: 0.0,
  emissive: new THREE.Color("#ffdfa0"), emissiveIntensity: 0.3,
});
const MAT_TREE_TRUNK = new THREE.MeshStandardMaterial({ color: "#2a2018", roughness: 0.9, metalness: 0.0 });
const MAT_TREE_LEAF = new THREE.MeshStandardMaterial({ color: "#2f4a26", roughness: 0.85, metalness: 0.0 });
const MAT_CAR_BODY = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.34, metalness: 0.5 });
const MAT_CAR_GLASS = new THREE.MeshStandardMaterial({ color: "#11151c", roughness: 0.18, metalness: 0.5 });
const MAT_CAR_TRIM = new THREE.MeshStandardMaterial({ color: "#08080a", roughness: 0.7, metalness: 0.2 });
// Warm light reflection on wet asphalt — additive, opacity driven by the night factor.
const MAT_STREAK = new THREE.MeshBasicMaterial({
  color: "#ffd9a0", transparent: true, opacity: 0, depthWrite: false,
  blending: THREE.AdditiveBlending,
});

// Build a flat road/pavement material with world-consistent texture density.
function roadMaterial(
  tex: { map: THREE.Texture; bump: THREE.Texture },
  w: number, l: number, tile: number,
): THREE.MeshStandardMaterial {
  const map = tex.map.clone(); map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(w / tile, l / tile); map.needsUpdate = true;
  const bump = tex.bump.clone(); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(w / tile, l / tile); bump.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    map, bumpMap: bump, bumpScale: 0.02, roughness: 0.9, metalness: 0.0,
  });
}

// Instanced flat boxes (markings, crosswalk bars, lamp posts/heads) — one draw call.
function InstancedBoxes({ size, material, positions, rotY = 0 }: {
  size: [number, number, number]; material: THREE.Material;
  positions: [number, number, number][]; rotY?: number;
}) {
  const setRef = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0));
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    positions.forEach((pos, i) => { p.set(pos[0], pos[1], pos[2]); m.compose(p, q, s); mesh.setMatrixAt(i, m); });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
  };
  if (positions.length === 0) return null;
  return (
    <instancedMesh ref={setRef} args={[undefined, undefined, positions.length]} material={material}>
      <boxGeometry args={size} />
    </instancedMesh>
  );
}

// Generic instanced thing — arbitrary child geometry, per-instance rotation/scale/colour.
type ThingItem = { pos: [number, number, number]; rotY?: number; scale?: number | [number, number, number]; color?: string };
function InstancedThings({ children, material, items }: {
  children: ReactNode; material: THREE.Material; items: ThingItem[];
}) {
  const setRef = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const col = new THREE.Color();
    let anyColor = false;
    items.forEach((it, i) => {
      e.set(0, it.rotY ?? 0, 0); q.setFromEuler(e);
      const sc = it.scale ?? 1;
      if (typeof sc === "number") s.set(sc, sc, sc); else s.set(sc[0], sc[1], sc[2]);
      p.set(it.pos[0], it.pos[1], it.pos[2]);
      m.compose(p, q, s); mesh.setMatrixAt(i, m);
      if (it.color) { mesh.setColorAt(i, col.set(it.color)); anyColor = true; }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (anyColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  };
  if (items.length === 0) return null;
  return (
    <instancedMesh ref={setRef} args={[undefined, undefined, items.length]} material={material}>
      {children}
    </instancedMesh>
  );
}

function Streetscape({ mobile = false }: { mobile?: boolean }) {
  // Per-road materials (kept so the night sheen can lower their roughness).
  const surfaces = useMemo(() => {
    const asph = asphaltTextures();
    const pave = pavementTextures();
    const roads: { key: string; geoW: number; geoL: number; pos: [number, number, number]; mat: THREE.MeshStandardMaterial }[] = [];
    for (const s of V_STREETS) {
      const len = s.z1 - s.z0;
      roads.push({ key: "v" + s.x, geoW: STREET_HALF * 2, geoL: len, pos: [s.x, 0.0, (s.z0 + s.z1) / 2], mat: roadMaterial(asph, STREET_HALF * 2, len, 7) });
    }
    for (const s of H_STREETS) {
      const len = s.x1 - s.x0;
      roads.push({ key: "h" + s.z, geoW: len, geoL: STREET_HALF * 2, pos: [(s.x0 + s.x1) / 2, 0.004, s.z], mat: roadMaterial(asph, len, STREET_HALF * 2, 7) });
    }
    return { roads, plaza: roadMaterial(pave, 22, 8, 4), sidewalk: roadMaterial(pave, 3.3, 42, 3) };
  }, []);

  // Markings, lights, trees, cars (all deterministic). Lights/trees go on the SIDEWALK
  // (just past the kerb); cars park in the kerbside lane (just inside the road). Nothing
  // is placed where a perpendicular street crosses, so junctions stay clear.
  const layout = useMemo(() => {
    const rng = mulberry32Local(7777);
    const inPlot = (x: number, z: number) => Math.abs(x) < 12 && z < 6 && z > -30;
    const lightOff = STREET_HALF + 0.8;   // 4.8 → on the sidewalk near the kerb
    const treeOff = STREET_HALF + 1.9;    // 5.9 → further onto the sidewalk
    const parkOff = STREET_HALF - 1.3;    // 2.7 → kerbside parking lane (inside the road)

    // Centre-line dashes for every street.
    const vDashes: [number, number, number][] = [];
    for (const s of V_STREETS) for (let z = s.z0 + 2; z <= s.z1 - 2; z += 3) vDashes.push([s.x, 0.02, z]);
    const hDashes: [number, number, number][] = [];
    for (const s of H_STREETS) for (let x = s.x0 + 2; x <= s.x1 - 2; x += 3) hDashes.push([x, 0.022, s.z]);

    const crosswalk: [number, number, number][] = [];
    for (let i = 0; i < 7; i++) crosswalk.push([-3.6 + i * 1.2, 0.026, 8]);

    // Streetlights — on the avenue + cross-street sidewalks, skipping junctions.
    const lights: { pos: [number, number, number]; ave: boolean }[] = [];
    const lightCap = mobile ? 14 : 40;
    const pushLight = (x: number, z: number, ave: boolean) => {
      if (lights.length >= lightCap || inPlot(x, z)) return;
      lights.push({ pos: [x, 0, z], ave });
    };
    for (let z = 11; z <= 46; z += (mobile ? 13 : 9)) {
      if (H_STREETS.some((s) => Math.abs(z - s.z) < STREET_HALF + 2)) continue;  // skip cross-street junction
      pushLight(-lightOff, z, true); pushLight(lightOff, z, true);
    }
    if (!mobile) for (let x = -38; x <= 38; x += 11) {
      if (V_STREETS.some((s) => Math.abs(x - s.x) < STREET_HALF + 2)) continue;  // skip vertical-street junctions
      pushLight(x, CROSS_STREET_Z - lightOff, false); pushLight(x, CROSS_STREET_Z + lightOff, false);
    }

    // Street trees along every street's sidewalk (off the carriageway + off junctions).
    const trees: ThingItem[] = [];
    const treeCap = mobile ? 16 : 44;
    const pushTree = (x: number, z: number) => {
      if (trees.length >= treeCap || inPlot(x, z) || onStreet(x, z, 0.3)) return;
      trees.push({ pos: [x, 0, z], scale: 0.8 + rng() * 0.5, rotY: rng() * Math.PI });
    };
    for (const s of V_STREETS) for (let z = s.z0 + 5; z <= s.z1 - 5; z += 8) { pushTree(s.x - treeOff, z); pushTree(s.x + treeOff, z); }
    for (const s of H_STREETS) for (let x = s.x0 + 5; x <= s.x1 - 5; x += 9) { pushTree(x, s.z - treeOff); pushTree(x, s.z + treeOff); }

    // Parked cars in the kerbside lane of the avenue + cross street (never in a junction).
    const carColors = ["#3a3f4a", "#7a2a2a", "#23304a", "#5a5a5e", "#2a3a2e", "#6a5a3a"];
    const cars: ThingItem[] = [];
    const carCap = mobile ? 6 : 22;
    const pushCar = (x: number, z: number, rotY: number) => {
      if (cars.length >= carCap || inPlot(x, z)) return;
      cars.push({ pos: [x, 0, z], rotY, color: carColors[Math.floor(rng() * carColors.length)] });
    };
    for (let z = 11; z <= 46; z += (mobile ? 12 : 8)) {
      if (H_STREETS.some((s) => Math.abs(z - s.z) < STREET_HALF + 3)) continue;
      pushCar(-parkOff, z, 0);
      if (!mobile) pushCar(parkOff, z, Math.PI);
    }
    if (!mobile) for (let x = -36; x <= 36; x += 9) {
      if (V_STREETS.some((s) => Math.abs(x - s.x) < STREET_HALF + 3)) continue;
      pushCar(x, CROSS_STREET_Z - parkOff, Math.PI / 2);
      pushCar(x, CROSS_STREET_Z + parkOff, -Math.PI / 2);
    }

    return { vDashes, hDashes, crosswalk, lights, trees, cars };
  }, [mobile]);

  const nightRef = useRef(themeState.night);
  const realLightRefs = useRef<(THREE.PointLight | null)[]>([]);

  const poleH = 5.0;
  const poles = layout.lights.map((l) => [l.pos[0], poleH / 2, l.pos[2]] as [number, number, number]);
  const lamps = layout.lights.map((l) => [l.pos[0], poleH + 0.05, l.pos[2]] as [number, number, number]);
  const streaks = layout.lights.filter((l) => l.ave).map((l) => ({ pos: [l.pos[0], 0.03, l.pos[2]] as [number, number, number] }));
  // The nearest avenue lamps get a real point light so the street is genuinely lit at
  // night (desktop only — mobile keeps the emissive glow to stay under its light budget).
  const realLamps = mobile ? [] : layout.lights.filter((l) => l.ave).slice(0, 6).map((l) => [l.pos[0], poleH - 0.2, l.pos[2]] as [number, number, number]);

  // Day → night: lamp heads + real lights switch on, wet-asphalt sheen + reflections appear.
  useFrame((_s, delta) => {
    nightRef.current += (themeState.night - nightRef.current) * (1 - Math.exp(-3 * Math.min(delta, 0.1)));
    const n = nightRef.current;
    MAT_LAMP.emissiveIntensity = 0.3 + n * 3.4;
    MAT_STREAK.opacity = n * 0.55;
    for (const r of surfaces.roads) { r.mat.roughness = 0.9 - n * 0.5; r.mat.metalness = n * 0.18; }
    for (const lt of realLightRefs.current) if (lt) lt.intensity = n * 5.5;
  });

  return (
    <group>
      {/* ── Road grid ── */}
      {surfaces.roads.map((r) => (
        <mesh key={r.key} material={r.mat} rotation={[-Math.PI / 2, 0, 0]} position={r.pos}>
          <planeGeometry args={[r.geoW, r.geoL]} />
        </mesh>
      ))}
      {/* Entrance forecourt / plaza */}
      <mesh material={surfaces.plaza} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 3.2]}>
        <planeGeometry args={[22, 8]} />
      </mesh>
      {/* Sidewalks flanking the avenue */}
      {([-5.75, 5.75] as const).map((x) => (
        <mesh key={x} material={surfaces.sidewalk} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, 27]}>
          <planeGeometry args={[3.3, 42]} />
        </mesh>
      ))}

      {/* ── Curbs (raised edge between avenue and sidewalk) ── */}
      {([-4.15, 4.15] as const).map((x) => (
        <mesh key={x} material={MAT_CURB} position={[x, 0.06, 27]}>
          <boxGeometry args={[0.16, 0.12, 42]} />
        </mesh>
      ))}

      {/* ── Lane markings ── */}
      {([-3.0, 3.0] as const).map((x) => (
        <mesh key={x} material={MAT_LINE} position={[x, 0.02, 27]}>
          <boxGeometry args={[0.1, 0.01, 40]} />
        </mesh>
      ))}
      <InstancedBoxes size={[0.18, 0.01, 1.5]} material={MAT_LINE} positions={layout.vDashes} />
      <InstancedBoxes size={[1.5, 0.01, 0.18]} material={MAT_LINE} positions={layout.hDashes} />
      <InstancedBoxes size={[0.55, 0.012, 3.0]} material={MAT_LINE} positions={layout.crosswalk} />

      {/* ── Streetlights (instanced posts + emissive heads) ── */}
      <InstancedBoxes size={[0.14, poleH, 0.14]} material={MAT_POLE} positions={poles} />
      <InstancedBoxes size={[0.5, 0.22, 0.5]} material={MAT_LAMP} positions={lamps} />
      {/* Real lights for the nearest avenue lamps — switch on at night */}
      {realLamps.map((p, i) => (
        <pointLight key={i} ref={(el) => { realLightRefs.current[i] = el; }}
          position={p} color="#ffdca0" intensity={0} distance={16} decay={2} />
      ))}
      {/* Wet-asphalt light reflections (night only) */}
      <InstancedThings material={MAT_STREAK} items={streaks}>
        <boxGeometry args={[0.7, 0.01, 4.5]} />
      </InstancedThings>

      {/* ── Street trees (instanced trunk + foliage) ── */}
      <InstancedThings material={MAT_TREE_TRUNK}
        items={layout.trees.map((t) => ({ pos: [t.pos[0], 0.9 * (t.scale as number), t.pos[2]], scale: [1, t.scale as number, 1] }))}>
        <cylinderGeometry args={[0.1, 0.14, 1.8, 6]} />
      </InstancedThings>
      <InstancedThings material={MAT_TREE_LEAF}
        items={layout.trees.map((t) => ({ pos: [t.pos[0], 2.5 * (t.scale as number), t.pos[2]], scale: t.scale, rotY: t.rotY }))}>
        <icosahedronGeometry args={[1.1, 0]} />
      </InstancedThings>

      {/* ── Parked cars (instanced body + cabin + wheels) ── */}
      <InstancedThings material={MAT_CAR_BODY}
        items={layout.cars.map((c) => ({ pos: [c.pos[0], 0.55, c.pos[2]], rotY: c.rotY, color: c.color }))}>
        <boxGeometry args={[2.0, 0.5, 4.3]} />
      </InstancedThings>
      <InstancedThings material={MAT_CAR_GLASS}
        items={layout.cars.map((c) => ({ pos: [c.pos[0], 0.96, c.pos[2]], rotY: c.rotY }))}>
        <boxGeometry args={[1.7, 0.46, 2.1]} />
      </InstancedThings>
      <InstancedThings material={MAT_CAR_TRIM}
        items={layout.cars.map((c) => ({ pos: [c.pos[0], 0.2, c.pos[2]], rotY: c.rotY }))}>
        <boxGeometry args={[2.05, 0.3, 3.9]} />
      </InstancedThings>
    </group>
  );
}

// ── FIREPLACE (left wall, lounge zone) ───────────────────────────────────────

function Fireplace({ pos }: { pos: [number, number, number] }) {
  const fireRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!fireRef.current) return;
    const t = clock.getElapsedTime();
    const mat = fireRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.50 + Math.sin(t * 2.2 + 0.5) * 0.16 + Math.sin(t * 3.9 + 1.1) * 0.08;
  });
  return (
    <group position={pos}>
      {/* Stone surround — thin in X, tall in Y, wide in Z */}
      <mesh material={MAT_COLUMN} position={[0, 0.9, 0]}>
        <boxGeometry args={[0.12, 1.8, 1.6]} />
      </mesh>
      {/* Dark firebox */}
      <mesh position={[0.07, 0.55, 0]}>
        <boxGeometry args={[0.08, 0.8, 0.9]} />
        <meshBasicMaterial color="#080604" />
      </mesh>
      {/* Fire glow */}
      <mesh ref={fireRef} position={[0.1, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.84, 0.62]} />
        <meshBasicMaterial color="#e05808" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Gold mantel */}
      <mesh material={MAT_GOLD} position={[0.07, 1.87, 0]}>
        <boxGeometry args={[0.2, 0.07, 1.72]} />
      </mesh>
      {!IS_MOBILE && <pointLight position={[1.2, 0.6, 0]} color="#ff5800" intensity={3.5} distance={9} decay={2} />}
    </group>
  );
}

// ── SCROLL-DRIVEN INTERIOR LIGHTS ─────────────────────────────────────────────

function InteriorScrollLights() {
  const lightsRef = useRef<(THREE.PointLight | null)[]>([]);
  const allLights: Array<{ pos: [number, number, number]; color: string; peak: number; dist: number; ph: number }> = [
    { pos: [0,   9,  -8],  color: "#f5e8c8", peak: 8.0, dist: 26, ph: 0.0 },
    { pos: [0,   9, -13],  color: "#f0e0b8", peak: 7.0, dist: 26, ph: 1.2 },
    { pos: [0,   9, -18],  color: "#ffe0b0", peak: 7.5, dist: 26, ph: 0.6 },
    { pos: [-6,  5, -12],  color: "#f5e0c0", peak: 4.0, dist: 18, ph: 2.1 },
    { pos: [ 6,  5, -12],  color: "#f5e0c0", peak: 4.0, dist: 18, ph: 0.9 },
    { pos: [-6,  5, -18],  color: "#f0e0b0", peak: 4.0, dist: 18, ph: 1.5 },
    { pos: [ 6,  5, -18],  color: "#f0e0b0", peak: 4.0, dist: 18, ph: 2.7 },
    { pos: [0,  10, -23],  color: "#7a3cf0", peak: 6.0, dist: 22, ph: 1.0 },  // purple wash on feature wall (finale accent)
    { pos: [0,   4,  -2],  color: "#ffe8c8", peak: 5.0, dist: 16, ph: 0.3 },
    { pos: [-4,  3, -13],  color: "#f5d890", peak: 3.5, dist: 12, ph: 1.8 },
    { pos: [ 5,  3, -12],  color: "#ffe8a0", peak: 4.0, dist: 10, ph: 2.4 },
  ];
  // Mobile: keep only 4 wide-coverage lights with larger distance + boosted peak,
  // so the whole room still reads as lit without overflowing the fragment-uniform limit.
  const lightData = IS_MOBILE
    ? [
        { pos: [0, 9,  -7] as [number, number, number], color: "#f5e8c8", peak: 13.0, dist: 34, ph: 0.0 },
        { pos: [0, 9, -15] as [number, number, number], color: "#f0e0b8", peak: 13.0, dist: 34, ph: 1.2 },
        { pos: [0, 8, -22] as [number, number, number], color: "#ffe0b0", peak: 11.0, dist: 30, ph: 0.6 },
        { pos: [0, 4,  -2] as [number, number, number], color: "#ffe8c8", peak: 7.0,  dist: 18, ph: 0.3 },
      ]
    : allLights;

  const nightRef = useRef(themeState.night);
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const p = scrollState.progress;
    nightRef.current += (themeState.night - nightRef.current) * (1 - Math.exp(-3 * Math.min(delta, 0.1)));
    // Day: bright room (high floor). Night: low sky ambient, so the warm interior
    // lights carry the room — boost them for cozy pools of light.
    const level = (0.75 + 0.25 * Math.pow(Math.max(0, p), 0.50)) * (1 + nightRef.current * 0.45);
    lightsRef.current.forEach((light, i) => {
      if (!light || i >= lightData.length) return;
      const d = lightData[i];
      light.intensity = d.peak * level * (0.92 + Math.sin(t * 0.4 + d.ph) * 0.08);
    });
  });

  return (
    <>
      {lightData.map((l, i) => (
        <pointLight key={i} ref={el => { lightsRef.current[i] = el; }}
          position={l.pos} color={l.color} intensity={0} distance={l.dist} decay={2} />
      ))}
    </>
  );
}

// ── MODERN SLIDING GLASS ENTRANCE DOORS ──────────────────────────────────────────
const MAT_DOORGLASS = new THREE.MeshStandardMaterial({
  color: "#bcd4e0", roughness: 0.02, metalness: 0.1,
  transparent: true, opacity: 0.28, envMapIntensity: 1.0,
  side: THREE.DoubleSide, depthWrite: false,
});
const MAT_DOORFRAME = new THREE.MeshStandardMaterial({
  color: "#1c1c1e", roughness: 0.3, metalness: 0.85,
});
const MAT_HANDLE = new THREE.MeshStandardMaterial({
  color: "#9aa0a6", roughness: 0.25, metalness: 0.95,
});

// One glass leaf: minimal metal frame, full glass, vertical pull handle on the meeting edge.
function DoorLeaf({ w = 1.08, handle }: { w?: number; handle: "left" | "right" }) {
  const h = 4.3, fr = 0.05, t = 0.07;
  const hx = handle === "right" ? w / 2 - 0.09 : -w / 2 + 0.09;
  return (
    <group>
      {/* Glass */}
      <mesh material={MAT_DOORGLASS} position={[0, h / 2, 0]}>
        <boxGeometry args={[w - 0.04, h - 0.08, 0.03]} />
      </mesh>
      {/* Minimal perimeter frame */}
      <mesh material={MAT_DOORFRAME} position={[0, h - fr, 0]}><boxGeometry args={[w, fr * 2, t]} /></mesh>
      <mesh material={MAT_DOORFRAME} position={[0, fr, 0]}><boxGeometry args={[w, fr * 2, t]} /></mesh>
      <mesh material={MAT_DOORFRAME} position={[-w / 2 + fr, h / 2, 0]}><boxGeometry args={[fr * 2, h, t]} /></mesh>
      <mesh material={MAT_DOORFRAME} position={[ w / 2 - fr, h / 2, 0]}><boxGeometry args={[fr * 2, h, t]} /></mesh>
      {/* Vertical pull handle */}
      <mesh material={MAT_HANDLE} position={[hx, h / 2, t / 2 + 0.05]}>
        <cylinderGeometry args={[0.018, 0.018, 1.5, 10]} />
      </mesh>
    </group>
  );
}

// Two leaves that slide apart as the camera scrolls toward the threshold, then stay open.
function EntranceDoors() {
  const lref = useRef<THREE.Group>(null!);
  const rref = useRef<THREE.Group>(null!);
  useFrame(() => {
    const p = scrollState.progress;
    // Open for entry (0.04 → 0.14), held open while passing through, then slide
    // closed again behind the camera (0.30 → 0.40) for a sealed glass storefront.
    let open: number;
    if (p < 0.14) open = (p - 0.04) / 0.10;
    else if (p < 0.30) open = 1;
    else open = 1 - (p - 0.30) / 0.10;
    open = Math.max(0, Math.min(1, open));
    const eased = open * open * (3 - 2 * open); // smoothstep
    const slide = eased * 1.18;
    if (lref.current) lref.current.position.x = -0.55 - slide;
    if (rref.current) rref.current.position.x =  0.55 + slide;
  });
  return (
    <group position={[0, 0, 0.12]}>
      <group ref={lref} position={[-0.55, 0, 0]}><DoorLeaf handle="right" /></group>
      <group ref={rref} position={[ 0.55, 0, 0]}><DoorLeaf handle="left" /></group>
      {/* Track header above the leaves */}
      <mesh material={MAT_DOORFRAME} position={[0, 4.4, 0]}>
        <boxGeometry args={[2.5, 0.1, 0.12]} />
      </mesh>
    </group>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export default function Architecture({ mobile = false }: { mobile?: boolean }) {
  return (
    <group>
      <InteriorScrollLights />

      {/* Feature wall spotlight */}
      <spotLight position={[0, 14, -20]} target-position={[0, 5, -26]}
        color="#f5ecd8" intensity={15} angle={0.35} penumbra={0.7} distance={20} decay={1.5} />

      {/* Exterior facade wash — lights the textured front of the building from outside
          so it doesn't read as black during the approach. Distance-limited so it fades
          before reaching deep interior (and the facade occludes it anyway). Desktop only:
          mobile has a tight fragment-uniform light budget and leans on boosted ambient. */}
      {!mobile && (
        <>
          <spotLight position={[0, 12, 24]} target-position={[0, 4, 0]}
            color="#f0d6aa" intensity={7} angle={0.7} penumbra={0.9} distance={42} decay={1.1} />
          <pointLight position={[0, 6, 14]} color="#e8cfa0" intensity={1.6} distance={32} decay={1.6} />
        </>
      )}
      <mesh material={MAT_CEILING} position={[0, 5.4, 0.5]}>
        <boxGeometry args={[10, 0.14, 3.5]} />
      </mesh>
      <mesh material={MAT_FEATURE_WALL} position={[-5, 3.5, 0]}>
        <boxGeometry args={[6.6, 7, 0.2]} />
      </mesh>
      <mesh material={MAT_FEATURE_WALL} position={[5, 3.5, 0]}>
        <boxGeometry args={[6.6, 7, 0.2]} />
      </mesh>
      {/* Door surrounds — solid wall around the opening: transom above + side panels.
          The opening itself (x: -1.2→1.2, y: 0→4.4) is filled by the sliding glass doors. */}
      <mesh material={MAT_FEATURE_WALL} position={[0, 5.7, 0]}>
        <boxGeometry args={[3.4, 2.6, 0.2]} />
      </mesh>
      <mesh material={MAT_FEATURE_WALL} position={[-1.45, 2.2, 0]}>
        <boxGeometry args={[0.5, 4.4, 0.2]} />
      </mesh>
      <mesh material={MAT_FEATURE_WALL} position={[1.45, 2.2, 0]}>
        <boxGeometry args={[0.5, 4.4, 0.2]} />
      </mesh>
      {/* Modern sliding glass entrance doors — open as you scroll in */}
      <EntranceDoors />

      {/* ── ENTRANCE CLERESTORY GLASS (above facade, y: 7 → 10) ──
          Glazes the open band over the entrance to match the side windows. */}
      {(() => {
        const X1 = -8, X2 = 8, Y1 = 7, Y2 = 10, zc = 0;
        const w = X2 - X1, h = Y2 - Y1, cx = (X1 + X2) / 2, cy = (Y1 + Y2) / 2;
        const vDiv = Math.round(w / 1.6);
        const bars = [];
        for (let i = 1; i < vDiv; i++) {
          const mx = X1 + (w / vDiv) * i;
          bars.push(
            <mesh key={`cv${i}`} material={MAT_FRAME} position={[mx, cy, zc]}>
              <boxGeometry args={[0.05, h, 0.05]} />
            </mesh>
          );
        }
        return (
          <group>
            {/* Glass pane */}
            <mesh material={MAT_GLASS} position={[cx, cy, zc]}>
              <boxGeometry args={[w - 0.1, h, 0.06]} />
            </mesh>
            {/* Brass sill + glowing header */}
            <mesh material={MAT_GOLD} position={[cx, Y1, zc]}>
              <boxGeometry args={[w, 0.08, 0.1]} />
            </mesh>
            <mesh material={MAT_GOLD_GLOW} position={[cx, Y2 - 0.04, zc]}>
              <boxGeometry args={[w, 0.06, 0.1]} />
            </mesh>
            {/* Horizontal transom rail */}
            <mesh material={MAT_FRAME} position={[cx, cy, zc]}>
              <boxGeometry args={[w - 0.08, 0.05, 0.05]} />
            </mesh>
            {/* Vertical mullions */}
            {bars}
          </group>
        );
      })()}

      {/* Roof cap over the entrance bay — closes the gap above the clerestory so the
          sky only shows through the glass, not over an open roof. */}
      <mesh material={MAT_CEILING} position={[0, 10.06, -2]}>
        <boxGeometry args={[16, 0.14, 4.2]} />
      </mesh>
      {/* Entry-bay side walls (z: 0 → -4) — the main SideWalls only begin at z=-4, so
          without these the sky leaked in at the left/right entrance corners. */}
      {([-8, 8] as const).map((x) => (
        <mesh key={x} material={MAT_WALL} position={[x, 5, -2]}>
          <boxGeometry args={[0.14, 10, 4]} />
        </mesh>
      ))}

      {/* ── ENTRY CORRIDOR (z: 0 → -4) ── */}
      <mesh material={MAT_FLOOR} position={[0, 0.04, -2]}>
        <boxGeometry args={[4.8, 0.08, 4]} />
      </mesh>
      <mesh material={MAT_WALL} position={[-2.5, 2.5, -2]}>
        <boxGeometry args={[0.12, 5, 4]} />
      </mesh>
      <mesh material={MAT_WALL} position={[2.5, 2.5, -2]}>
        <boxGeometry args={[0.12, 5, 4]} />
      </mesh>
      <mesh material={MAT_CEILING} position={[0, 5.1, -2]}>
        <boxGeometry args={[5, 0.12, 4]} />
      </mesh>
      <mesh material={MAT_GOLD_GLOW} position={[0, 4.98, -2]}>
        <boxGeometry args={[0.16, 0.04, 3.6]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[-2.43, 0.07, -2]}>
        <boxGeometry args={[0.04, 0.14, 4]} />
      </mesh>
      <mesh material={MAT_GOLD} position={[2.43, 0.07, -2]}>
        <boxGeometry args={[0.04, 0.14, 4]} />
      </mesh>

      {/* ── MAIN FLOOR (z: -4 → -26) ── */}
      <mesh material={MAT_FLOOR} position={[0, 0.05, -15]}>
        <boxGeometry args={[16, 0.1, 22]} />
      </mesh>
      {/* Gold inlay grid */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} material={MAT_GOLD} position={[x, 0.11, -15]}>
          <boxGeometry args={[0.04, 0.02, 21.8]} />
        </mesh>
      ))}
      {[-10, -16, -22].map((z, i) => (
        <mesh key={i} material={MAT_GOLD} position={[0, 0.11, z]}>
          <boxGeometry args={[15.8, 0.02, 0.04]} />
        </mesh>
      ))}

      {/* ── SIDE WALLS WITH WINDOWS ── */}
      <SideWalls />

      {/* ── BACK / FEATURE WALL ── */}
      <mesh material={MAT_FEATURE_WALL} position={[0, 5, -26]}>
        <boxGeometry args={[16, 10, 0.18]} />
      </mesh>
      {([-6, -3, 0, 3, 6] as const).map((x, i) => (
        <mesh key={i} material={MAT_GOLD} position={[x, 5, -25.9]}>
          <boxGeometry args={[0.04, 9.6, 0.04]} />
        </mesh>
      ))}
      <mesh material={MAT_GOLD} position={[0, 5, -25.9]}>
        <boxGeometry args={[16, 0.04, 0.04]} />
      </mesh>
      <mesh position={[0, 5, -26.6]}>
        <planeGeometry args={[12, 8]} />
        <meshBasicMaterial color="#6d3cf0" transparent opacity={0.07} />
      </mesh>

      {/* ── CEILING ── */}
      <CofferedCeiling pos={[0, 10.06, -15]} w={15.8} d={21.8} rows={3} cols={4} />

      {/* ── STRUCTURAL COLUMNS ── */}
      <Column pos={[-5.5, 0, -11]} h={10} size={0.45} />
      <Column pos={[ 5.5, 0, -11]} h={10} size={0.45} />
      <Column pos={[-5.5, 0, -21]} h={10} size={0.45} />
      <Column pos={[ 5.5, 0, -21]} h={10} size={0.45} />

      {/* ── PENDANT CLUSTERS ── */}
      <Pendant pos={[0,    10.1,  -8]} cordLen={3.2} brightness={2.2} />
      <Pendant pos={[-2.8, 10.1, -12]} cordLen={3.8} brightness={2.0} />
      <Pendant pos={[ 2.8, 10.1, -12]} cordLen={3.2} brightness={1.9} />
      <Pendant pos={[0,    10.1, -16]} cordLen={4.4} brightness={2.4} />
      <Pendant pos={[-2.8, 10.1, -16]} cordLen={3.8} brightness={1.8} />
      <Pendant pos={[ 2.8, 10.1, -16]} cordLen={3.8} brightness={1.8} />
      <Pendant pos={[0,    10.1, -21]} cordLen={3.6} brightness={2.0} />

      {/* ── ZONE 1: RECEPTION (z: -6 → -10) ── */}
      <group position={[0, 0, -8]}>
        <mesh material={MAT_COLUMN} position={[0, 0.55, 0]}>
          <boxGeometry args={[4.5, 1.1, 1.0]} />
        </mesh>
        <mesh material={MAT_GOLD} position={[0, 1.13, 0]}>
          <boxGeometry args={[4.55, 0.06, 1.05]} />
        </mesh>
        <mesh position={[0, 0.55, -0.52]}>
          <planeGeometry args={[2.2, 0.55]} />
          <meshBasicMaterial color="#6d3cf0" transparent opacity={0.18} />
        </mesh>
        {/* Desk screen */}
        <mesh position={[1.4, 1.35, 0.1]} rotation={[-Math.PI * 0.15, 0, 0]}>
          <planeGeometry args={[0.38, 0.24]} />
          <meshBasicMaterial color="#4060b0" transparent opacity={0.8} />
        </mesh>
      </group>
      <Sofa pos={[-3.5, 0, -6.5]} rot={Math.PI * 0.5} w={1.4} />
      <Sofa pos={[ 3.5, 0, -6.5]} rot={-Math.PI * 0.5} w={1.4} />

      {/* ── ZONE 2: NETWORKING LOUNGE (left, z: -10 → -16) ── */}
      <Sofa pos={[-4.6, 0, -13.6]} rot={Math.PI * 0.5} w={1.8} />
      <CoffeeTable pos={[-4.6, 0, -12.0]} />
      <Fireplace pos={[-7.88, 0, -12.2]} />
      {/* Floor lamp */}
      <group position={[-6.4, 0, -10.8]}>
        <mesh material={MAT_GOLD} position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 3.0, 8]} />
        </mesh>
        <mesh material={MAT_GOLD} position={[0, 3.05, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 0.22, 12]} />
        </mesh>
        {!IS_MOBILE && <pointLight position={[0, 2.7, 0]} color="#ffe0a0" intensity={2.0} distance={6} decay={2} />}
      </group>

      {/* ── ZONE 3: BAR (right, z: -10 → -15) — counter, back-bar & stools self-contained ── */}
      <CoffeeBar pos={[6.2, 0, -13]} />

      {/* ── ZONE 4: FOUNDER WORKSPACE (z: -16 → -22) ── */}
      <WorkTable pos={[-2.5, 0, -17.5]} numLaptops={3} />
      <WorkTable pos={[ 2.5, 0, -17.5]} numLaptops={2} />
      {/* 8-ball pool table replaces the far work table */}
      <PoolTable pos={[0, 0, -20.8]} rot={Math.PI / 2} />
      {/* Glass whiteboard */}
      <group position={[-7.5, 4.5, -21]}>
        <mesh material={MAT_GLASS} position={[0, 0, 0.06]}>
          <boxGeometry args={[0.04, 2.4, 3.6]} />
        </mesh>
        <mesh material={MAT_GOLD} position={[0, -1.25, 0.05]}>
          <boxGeometry args={[0.03, 0.04, 3.64]} />
        </mesh>
      </group>

      {/* ── DECOR: rugs, plants, art, books ── */}
      {/* Area rugs anchor the seating zones */}
      <Rug pos={[0, 0, -7]} w={4.2} d={2.4} />
      <Rug pos={[-5.0, 0, -12.4]} w={4.4} d={3.4} />

      {/* Potted plants soften the corners */}
      <PottedPlant pos={[-7.0, 0, -6.0]} scale={1.1} />
      <PottedPlant pos={[ 7.0, 0, -6.0]} scale={1.0} />
      <PottedPlant pos={[ 7.2, 0, -15.5]} scale={1.15} />
      {!mobile && <PottedPlant pos={[-7.2, 0, -24.0]} scale={1.0} />}
      {!mobile && <PottedPlant pos={[ 6.8, 0, -23.5]} scale={0.9} />}

      {/* Framed wall art on the entry feature walls */}
      <WallArt pos={[-4.9, 4.2, 0.12]} w={1.5} h={2.2} tint="#6d3cf0" />
      <WallArt pos={[ 4.9, 4.2, 0.12]} w={1.5} h={2.2} tint="#c9a96e" />

      {/* Bookshelf in the founder workspace */}
      {!mobile && <Bookshelf pos={[7.55, 0, -19.5]} rot={-Math.PI / 2} />}

{/* ── CITY EXTERIOR ── */}
      <CityExterior mobile={mobile} />

      {/* ── STREETSCAPE (roads, plaza, sidewalks, streetlights) ── */}
      <Streetscape mobile={mobile} />

      {/* ── EXTERIOR GROUND ── grounds the building + city so they don't float over
          the void during the outside approach. Sits just below the interior floor and
          fades into the fog/horizon at distance. */}
      <mesh material={MAT_GROUND} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[600, 600]} />
      </mesh>

      {/* ── DEPTH FLOOR ── */}
      <mesh material={MAT_WALL} rotation={[-Math.PI / 2, 0, 0]} position={[0, -12, -15]}>
        <planeGeometry args={[60, 80]} />
      </mesh>
    </group>
  );
}
