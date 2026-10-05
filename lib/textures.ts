// Procedural canvas textures — generated at runtime, no image assets needed (works
// fully offline). Each generator returns a cached THREE.Texture so multiple materials
// can share one. Use the COLOR maps for `.map`, the grayscale maps for `.bumpMap`/
// `.roughnessMap`. Resolution drops on mobile to keep memory/upload cost low.
import * as THREE from "three";
import { IS_MOBILE } from "./device";

const RES = IS_MOBILE ? 256 : 512;

// Small deterministic value-noise so textures look identical across reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = RES;
  return [c, c.getContext("2d")!];
}

function finalize(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  // Anisotropic filtering keeps the floor/walls sharp at the grazing angles this camera
  // lives at. Cheap on modern tile GPUs, so mobile gets 4× (was 1×) for a big crispness win.
  tex.anisotropy = IS_MOBILE ? 4 : 8;
  tex.needsUpdate = true;
  return tex;
}

// Lazy singletons ──────────────────────────────────────────────────────────────
let _wood: { map: THREE.Texture; bump: THREE.Texture } | null = null;
let _marble: { map: THREE.Texture; bump: THREE.Texture } | null = null;
let _plaster: THREE.Texture | null = null;
let _fabric: THREE.Texture | null = null;
let _rug: THREE.Texture | null = null;
let _wall: { map: THREE.Texture; bump: THREE.Texture } | null = null;
let _slat: { map: THREE.Texture; bump: THREE.Texture } | null = null;
let _stone: { map: THREE.Texture; bump: THREE.Texture } | null = null;
let _ground: { map: THREE.Texture; bump: THREE.Texture } | null = null;

// ── WOOD PLANK FLOORING ─────────────────────────────────────────────────────────
export function woodTextures() {
  if (_wood) return _wood;
  const rnd = mulberry32(7);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  ctx.fillStyle = "#3a2a1c"; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#808080"; bctx.fillRect(0, 0, RES, RES);

  const planks = 6;
  const ph = RES / planks;
  for (let p = 0; p < planks; p++) {
    const y = p * ph;
    // Per-plank base tone variation
    const tone = 0.82 + rnd() * 0.34;
    const r = Math.round(64 * tone), g = Math.round(46 * tone), b = Math.round(30 * tone);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, RES, ph);

    // Grain streaks
    const streaks = 26;
    for (let s = 0; s < streaks; s++) {
      const gy = y + rnd() * ph;
      const dark = rnd() > 0.5;
      ctx.strokeStyle = dark
        ? `rgba(20,13,8,${0.12 + rnd() * 0.18})`
        : `rgba(90,66,42,${0.06 + rnd() * 0.12})`;
      ctx.lineWidth = 0.6 + rnd() * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      for (let x = 0; x <= RES; x += 16) {
        ctx.lineTo(x, gy + Math.sin(x * 0.03 + p) * 1.6 + (rnd() - 0.5) * 2);
      }
      ctx.stroke();

      // Mirror faint grain into bump map
      bctx.strokeStyle = dark ? `rgba(70,70,70,0.5)` : `rgba(170,170,170,0.4)`;
      bctx.lineWidth = ctx.lineWidth;
      bctx.stroke();
    }

    // Dark seam between planks
    ctx.fillStyle = "rgba(8,5,3,0.85)";
    ctx.fillRect(0, y, RES, 2);
    bctx.fillStyle = "rgba(30,30,30,1)";
    bctx.fillRect(0, y, RES, 2);
  }

  _wood = { map: finalize(c, 4), bump: finalize(bc, 4) };
  return _wood;
}

// ── MARBLE ──────────────────────────────────────────────────────────────────────
export function marbleTextures() {
  if (_marble) return _marble;
  const rnd = mulberry32(19);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  const grad = ctx.createLinearGradient(0, 0, RES, RES);
  grad.addColorStop(0, "#5e5244");
  grad.addColorStop(0.5, "#6a5e4e");
  grad.addColorStop(1, "#564a3c");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#888"; bctx.fillRect(0, 0, RES, RES);

  // Veins — meandering strokes
  const veins = 14;
  for (let v = 0; v < veins; v++) {
    let x = rnd() * RES, y = rnd() * RES;
    const light = rnd() > 0.55;
    ctx.strokeStyle = light ? `rgba(200,188,160,${0.10 + rnd() * 0.16})`
                            : `rgba(36,28,20,${0.12 + rnd() * 0.20})`;
    ctx.lineWidth = 0.5 + rnd() * 2.2;
    bctx.strokeStyle = light ? "rgba(180,180,180,0.4)" : "rgba(60,60,60,0.5)";
    bctx.lineWidth = ctx.lineWidth;
    ctx.beginPath(); bctx.beginPath();
    ctx.moveTo(x, y); bctx.moveTo(x, y);
    const steps = 40 + Math.floor(rnd() * 40);
    let ang = rnd() * Math.PI * 2;
    for (let s = 0; s < steps; s++) {
      ang += (rnd() - 0.5) * 0.6;
      x += Math.cos(ang) * 8; y += Math.sin(ang) * 8;
      ctx.lineTo(x, y); bctx.lineTo(x, y);
    }
    ctx.stroke(); bctx.stroke();
  }

  _marble = { map: finalize(c, 1), bump: finalize(bc, 1) };
  return _marble;
}

// ── PLASTER WALL (bump only) ─────────────────────────────────────────────────────
export function plasterBump() {
  if (_plaster) return _plaster;
  const rnd = mulberry32(33);
  const [c, ctx] = makeCanvas();
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, RES, RES);
  const img = ctx.getImageData(0, 0, RES, RES);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (rnd() - 0.5) * 46;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
  }
  ctx.putImageData(img, 0, 0);
  // Soft trowel marks
  for (let s = 0; s < 60; s++) {
    ctx.strokeStyle = `rgba(${rnd() > 0.5 ? 150 : 100},${rnd() > 0.5 ? 150 : 100},${rnd() > 0.5 ? 150 : 100},0.06)`;
    ctx.lineWidth = 6 + rnd() * 18;
    ctx.beginPath();
    const x = rnd() * RES, y = rnd() * RES, a = rnd() * Math.PI;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 80, y + Math.sin(a) * 80);
    ctx.stroke();
  }
  _plaster = finalize(c, 3);
  return _plaster;
}

// ── FABRIC WEAVE (bump only) ─────────────────────────────────────────────────────
export function fabricBump() {
  if (_fabric) return _fabric;
  const [c, ctx] = makeCanvas();
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, RES, RES);
  const step = RES / 64;
  for (let i = 0; i < 64; i++) {
    const p = i * step;
    ctx.strokeStyle = "rgba(170,170,170,0.5)";
    ctx.lineWidth = step * 0.45;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, RES); ctx.stroke();
    ctx.strokeStyle = "rgba(70,70,70,0.5)";
    ctx.beginPath(); ctx.moveTo(0, p + step * 0.5); ctx.lineTo(RES, p + step * 0.5); ctx.stroke();
  }
  _fabric = finalize(c, 6);
  return _fabric;
}

// ── PATTERNED RUG (color) ────────────────────────────────────────────────────────
export function rugTexture() {
  if (_rug) return _rug;
  const [c, ctx] = makeCanvas();
  // Deep base
  ctx.fillStyle = "#1b1320"; ctx.fillRect(0, 0, RES, RES);
  // Border bands
  const bands = [
    { inset: 0.02, color: "#2a1d3a" },
    { inset: 0.06, color: "#6d3cf0" },
    { inset: 0.085, color: "#1b1320" },
  ];
  for (const { inset, color } of bands) {
    const m = RES * inset;
    ctx.strokeStyle = color;
    ctx.lineWidth = RES * 0.018;
    ctx.strokeRect(m, m, RES - m * 2, RES - m * 2);
  }
  // Central medallion lattice
  ctx.strokeStyle = "rgba(201,169,110,0.55)";
  ctx.lineWidth = RES * 0.006;
  const cx = RES / 2, cy = RES / 2;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * RES * 0.3, cy + Math.sin(a) * RES * 0.3);
    ctx.stroke();
  }
  for (let r = 0.08; r < 0.32; r += 0.07) {
    ctx.beginPath(); ctx.arc(cx, cy, RES * r, 0, Math.PI * 2); ctx.stroke();
  }
  _rug = finalize(c, 1);
  return _rug;
}

// ── WARM PLASTER WALL (color + bump) ─────────────────────────────────────────────
export function wallTextures() {
  if (_wall) return _wall;
  const rnd = mulberry32(51);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  ctx.fillStyle = "#3a3028"; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#808080"; bctx.fillRect(0, 0, RES, RES);

  // Large soft tonal blotches — uneven hand-plastered look
  for (let i = 0; i < 40; i++) {
    const x = rnd() * RES, y = rnd() * RES, r = RES * (0.08 + rnd() * 0.18);
    const lighter = rnd() > 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, lighter ? "rgba(80,68,56,0.10)" : "rgba(20,16,12,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // Fine grain
  const img = ctx.getImageData(0, 0, RES, RES);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 14;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // Subtle vertical panel reveals (large stone-panel seams) at thirds
  for (const fx of [1 / 3, 2 / 3]) {
    const x = fx * RES;
    ctx.fillStyle = "rgba(10,8,6,0.5)"; ctx.fillRect(x - 1, 0, 2, RES);
    bctx.fillStyle = "rgba(40,40,40,1)"; bctx.fillRect(x - 1, 0, 2, RES);
    ctx.fillStyle = "rgba(90,78,64,0.12)"; ctx.fillRect(x + 1, 0, 1, RES);
  }
  // Bump grain
  const bimg = bctx.getImageData(0, 0, RES, RES);
  for (let i = 0; i < bimg.data.length; i += 4) {
    const n = 128 + (rnd() - 0.5) * 40;
    bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = n;
  }
  bctx.putImageData(bimg, 0, 0);
  for (const fx of [1 / 3, 2 / 3]) { bctx.fillStyle = "rgba(30,30,30,1)"; bctx.fillRect(fx * RES - 1, 0, 2, RES); }

  _wall = { map: finalize(c, 2), bump: finalize(bc, 2) };
  return _wall;
}

// ── VERTICAL WOOD SLAT FEATURE WALL (color + bump) ───────────────────────────────
export function slatTextures() {
  if (_slat) return _slat;
  const rnd = mulberry32(67);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  ctx.fillStyle = "#241a12"; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#808080"; bctx.fillRect(0, 0, RES, RES);

  const slats = 9;
  const sw = RES / slats;
  const groove = sw * 0.16;
  for (let s = 0; s < slats; s++) {
    const x = s * sw;
    const tone = 0.85 + rnd() * 0.3;
    const r = Math.round(58 * tone), g = Math.round(42 * tone), b = Math.round(28 * tone);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x + groove / 2, 0, sw - groove, RES);

    // Vertical grain streaks within the slat
    for (let k = 0; k < 14; k++) {
      const gx = x + groove / 2 + rnd() * (sw - groove);
      ctx.strokeStyle = rnd() > 0.5 ? "rgba(18,12,8,0.18)" : "rgba(96,70,44,0.10)";
      ctx.lineWidth = 0.6 + rnd() * 1.2;
      ctx.beginPath(); ctx.moveTo(gx, 0);
      for (let y = 0; y <= RES; y += 18) ctx.lineTo(gx + Math.sin(y * 0.02 + s) * 1.4, y);
      ctx.stroke();
    }
    // Dark groove shadow between slats
    ctx.fillStyle = "rgba(6,4,3,0.92)"; ctx.fillRect(x, 0, groove / 2, RES);
    bctx.fillStyle = "rgba(20,20,20,1)"; bctx.fillRect(x, 0, groove, RES);
    // Slat highlight edge in bump
    bctx.fillStyle = "rgba(180,180,180,0.5)"; bctx.fillRect(x + groove, 0, 2, RES);
  }

  _slat = { map: finalize(c, 3), bump: finalize(bc, 3) };
  return _slat;
}

// ── DARK VEINED STONE (columns) — color + bump ───────────────────────────────────
export function stoneTextures() {
  if (_stone) return _stone;
  const rnd = mulberry32(83);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  const grad = ctx.createLinearGradient(0, 0, RES, RES);
  grad.addColorStop(0, "#2e251c");
  grad.addColorStop(0.5, "#352a20");
  grad.addColorStop(1, "#281f17");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#888"; bctx.fillRect(0, 0, RES, RES);

  // Warm gold + pale veins, sparse and elegant
  const veins = 12;
  for (let v = 0; v < veins; v++) {
    let x = rnd() * RES, y = rnd() * RES;
    const kind = rnd();
    ctx.strokeStyle = kind > 0.6 ? `rgba(201,169,110,${0.06 + rnd() * 0.10})`
                    : kind > 0.3 ? `rgba(150,134,112,${0.05 + rnd() * 0.08})`
                                 : `rgba(14,10,7,${0.14 + rnd() * 0.16})`;
    ctx.lineWidth = 0.4 + rnd() * 1.6;
    bctx.strokeStyle = "rgba(120,120,120,0.4)"; bctx.lineWidth = ctx.lineWidth;
    ctx.beginPath(); bctx.beginPath();
    ctx.moveTo(x, y); bctx.moveTo(x, y);
    const steps = 40 + Math.floor(rnd() * 40);
    let ang = rnd() * Math.PI * 2;
    for (let s = 0; s < steps; s++) {
      ang += (rnd() - 0.5) * 0.55;
      x += Math.cos(ang) * 7; y += Math.sin(ang) * 7;
      ctx.lineTo(x, y); bctx.lineTo(x, y);
    }
    ctx.stroke(); bctx.stroke();
  }

  _stone = { map: finalize(c, 1), bump: finalize(bc, 1) };
  return _stone;
}

// ── EXTERIOR STONE-PAVER GROUND (color + bump), high repeat ──────────────────────
export function groundTextures(repeat = 80) {
  if (_ground) return _ground;
  const rnd = mulberry32(97);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  ctx.fillStyle = "#403830"; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#888"; bctx.fillRect(0, 0, RES, RES);

  // Mottled concrete base
  for (let i = 0; i < 60; i++) {
    const x = rnd() * RES, y = rnd() * RES, r = RES * (0.04 + rnd() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rnd() > 0.5 ? "rgba(96,84,70,0.14)" : "rgba(18,13,10,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // Fine speckle
  const img = ctx.getImageData(0, 0, RES, RES);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 12;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // Paver grid — 2×2 large slabs per tile with dark grout
  const cells = 2;
  const cs = RES / cells;
  const grout = Math.max(2, RES * 0.012);
  ctx.fillStyle = "rgba(2,2,2,0.9)";
  bctx.fillStyle = "rgba(20,20,20,1)";
  for (let i = 0; i <= cells; i++) {
    const p = i * cs;
    ctx.fillRect(p - grout / 2, 0, grout, RES);
    ctx.fillRect(0, p - grout / 2, RES, grout);
    bctx.fillRect(p - grout / 2, 0, grout, RES);
    bctx.fillRect(0, p - grout / 2, RES, grout);
  }
  // Slab edge highlight in bump
  bctx.fillStyle = "rgba(170,170,170,0.5)";
  for (let i = 0; i <= cells; i++) {
    const p = i * cs;
    bctx.fillRect(p + grout / 2, 0, 1.5, RES);
    bctx.fillRect(0, p + grout / 2, RES, 1.5);
  }

  _ground = { map: finalize(c, repeat), bump: finalize(bc, repeat) };
  return _ground;
}

// ── ASPHALT ROAD (color + bump, tileable) ────────────────────────────────────────
// Plain aggregate asphalt — lane markings are added as separate crisp geometry in the
// scene, so this stays orientation-agnostic and can tile freely on any road quad.
let _asphalt: { map: THREE.Texture; bump: THREE.Texture } | null = null;
export function asphaltTextures() {
  if (_asphalt) return _asphalt;
  const rnd = mulberry32(131);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  ctx.fillStyle = "#1b1b1f"; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#808080"; bctx.fillRect(0, 0, RES, RES);

  // Aggregate speckle (mirrored faintly into bump for tooth).
  const img = ctx.getImageData(0, 0, RES, RES);
  const bimg = bctx.getImageData(0, 0, RES, RES);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 26;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    const bn = 128 + (rnd() - 0.5) * 30;
    bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = bn;
  }
  ctx.putImageData(img, 0, 0);
  bctx.putImageData(bimg, 0, 0);

  // A few tar cracks / patches.
  for (let k = 0; k < 12; k++) {
    ctx.strokeStyle = `rgba(8,8,10,${0.2 + rnd() * 0.3})`;
    ctx.lineWidth = 1 + rnd() * 2;
    ctx.beginPath();
    let x = rnd() * RES, y = rnd() * RES;
    ctx.moveTo(x, y);
    for (let s = 0; s < 7; s++) { x += (rnd() - 0.5) * 60; y += (rnd() - 0.5) * 60; ctx.lineTo(x, y); }
    ctx.stroke();
  }

  _asphalt = { map: finalize(c, 1), bump: finalize(bc, 1) };
  return _asphalt;
}

// ── CONCRETE PAVEMENT (color + bump, slab joints) ────────────────────────────────
// Sidewalk / plaza concrete with a slab grid; tileable for any size of quad.
let _pavement: { map: THREE.Texture; bump: THREE.Texture } | null = null;
export function pavementTextures() {
  if (_pavement) return _pavement;
  const rnd = mulberry32(149);
  const [c, ctx] = makeCanvas();
  const [bc, bctx] = makeCanvas();

  ctx.fillStyle = "#56524b"; ctx.fillRect(0, 0, RES, RES);
  bctx.fillStyle = "#808080"; bctx.fillRect(0, 0, RES, RES);

  const img = ctx.getImageData(0, 0, RES, RES);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 16;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // Slab expansion joints (4×4) — dark groove + bump trough.
  const cells = 4, cs = RES / cells, j = Math.max(2, RES * 0.012);
  ctx.fillStyle = "rgba(18,16,14,0.6)";
  bctx.fillStyle = "rgba(30,30,30,1)";
  for (let i = 0; i <= cells; i++) {
    const p = i * cs;
    ctx.fillRect(p - j / 2, 0, j, RES); ctx.fillRect(0, p - j / 2, RES, j);
    bctx.fillRect(p - j / 2, 0, j, RES); bctx.fillRect(0, p - j / 2, RES, j);
  }

  _pavement = { map: finalize(c, 1), bump: finalize(bc, 1) };
  return _pavement;
}

// ── CITY BUILDING FACADE (color + emissive window mask) ──────────────────────────
// A glass-tower facade: concrete/glass body with a cols×rows window grid. The colour
// map carries the daytime look (dark reflective glass, a few panels already lit); the
// emissive map carries only the lit windows so they can glow at night. Keyed/cached by
// (cols,rows,seed) so the handful of building templates share GPU uploads.
const _facades = new Map<string, { map: THREE.Texture; emissive: THREE.Texture }>();

export function cityFacadeTextures(cols: number, rows: number, seed: number) {
  const key = `${cols}x${rows}x${seed}`;
  const cached = _facades.get(key);
  if (cached) return cached;

  const rnd = mulberry32(seed * 131 + 7);
  const [c, ctx] = makeCanvas();      // colour map
  const [ec, ectx] = makeCanvas();    // emissive (lit windows only)

  // Facade body — cool concrete/glass, tone varies per building.
  const tone = 0.7 + rnd() * 0.55;
  ctx.fillStyle = `rgb(${Math.round(40 * tone)},${Math.round(45 * tone)},${Math.round(54 * tone)})`;
  ctx.fillRect(0, 0, RES, RES);
  // Vertical shading — brighter crown, darker base (grounds the tower).
  const vg = ctx.createLinearGradient(0, 0, 0, RES);
  vg.addColorStop(0, "rgba(255,255,255,0.07)");
  vg.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, RES, RES);

  ectx.fillStyle = "#000"; ectx.fillRect(0, 0, RES, RES);

  // Window grid
  const mX = RES * 0.05, mY = RES * 0.04;
  const gW = RES - mX * 2, gH = RES - mY * 2;
  const cellW = gW / cols, cellH = gH / rows;
  const winW = cellW * 0.72, winH = cellH * 0.6;
  const warmBuilding = rnd() > 0.45;   // most windows warm vs cool for this tower

  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const x = mX + cx * cellW + (cellW - winW) / 2;
      const y = mY + cy * cellH + (cellH - winH) / 2;

      // Dark reflective glass base for every pane.
      const gl = ctx.createLinearGradient(x, y, x + winW, y + winH);
      gl.addColorStop(0, "#10141d");
      gl.addColorStop(1, "#1d2533");
      ctx.fillStyle = gl;
      ctx.fillRect(x, y, winW, winH);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, winW - 1, winH - 1);

      // A third of panes are lit.
      if (rnd() < 0.33) {
        const warm = warmBuilding ? rnd() > 0.25 : rnd() > 0.78;
        const mapCol = warm ? "rgba(255,214,150,0.92)" : "rgba(175,205,255,0.85)";
        const emCol = warm
          ? `rgb(255,${190 + Math.round(rnd() * 40)},${110 + Math.round(rnd() * 50)})`
          : `rgb(${140 + Math.round(rnd() * 40)},${185 + Math.round(rnd() * 40)},255)`;
        ctx.fillStyle = mapCol;
        ctx.fillRect(x, y, winW, winH);
        ectx.fillStyle = emCol;
        ectx.fillRect(x, y, winW, winH);
      }
    }
  }

  // Parapet shadow along the crown.
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, RES, mY * 0.7);

  const mk = (canvas: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = IS_MOBILE ? 2 : 6;
    t.needsUpdate = true;
    return t;
  };
  const res = { map: mk(c), emissive: mk(ec) };
  _facades.set(key, res);
  return res;
}
