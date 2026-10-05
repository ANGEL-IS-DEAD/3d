import * as THREE from "three";

// 5-act journey: ARRIVE → ENTER → EXPLORE → DISCOVER → SETTLE
export const CAMERA_POINTS = [
  new THREE.Vector3( 0,   3.5,  38),  // 0%   far outside — building in distance
  new THREE.Vector3( 0,   3,    14),  // 9%   fast approach
  new THREE.Vector3( 0,   2.5,   3),  // 17%  threshold crossing
  new THREE.Vector3( 0,   3.5,  -4),  // 25%  just inside — full depth visible
  new THREE.Vector3(-5,   5,    -9),  // 33%  sweep LEFT — lounge revealed
  new THREE.Vector3( 0,   8,   -12),  // 41%  rise high — ceiling + floor both visible
  new THREE.Vector3( 5,   4,   -15),  // 50%  sweep RIGHT — coffee bar, city windows
  new THREE.Vector3( 0,   3.5, -20),  // 58%  look BACK toward entrance (reversal)
  new THREE.Vector3( 2,   4.5, -21),  // 66%  turn toward feature wall, slight right
  new THREE.Vector3( 0,   4,   -22),  // 75%  facing feature wall
  new THREE.Vector3(-2,   4.5, -21),  // 84%  subtle left sweep
  new THREE.Vector3( 0,   4,   -22),  // 100% fully settled for join form
];

export const CAMERA_TARGET_POINTS = [
  new THREE.Vector3( 0,  2,     0),   // looking at doorway from far
  new THREE.Vector3( 0,  2,    -6),
  new THREE.Vector3( 0,  3,   -12),
  new THREE.Vector3( 0,  4,   -18),   // look deep into room
  new THREE.Vector3(-4,  3,   -13),   // look at lounge / fireplace
  new THREE.Vector3( 0,  2,   -22),   // look down-forward: floor + feature wall
  new THREE.Vector3( 4,  3,   -20),   // look deep into workspace from right sweep
  new THREE.Vector3( 0,  4,    -4),   // look BACK at entrance
  new THREE.Vector3( 0,  5,   -26),   // look at feature wall
  new THREE.Vector3( 0,  5,   -27),
  new THREE.Vector3( 0,  5,   -26),
  new THREE.Vector3( 0,  5,   -27),
];

export const cameraPath = new THREE.CatmullRomCurve3(CAMERA_POINTS, false, "catmullrom", 0.5);
export const cameraTargetPath = new THREE.CatmullRomCurve3(CAMERA_TARGET_POINTS, false, "catmullrom", 0.5);

const _pos = new THREE.Vector3();
const _tgt = new THREE.Vector3();

export function getCameraState(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  cameraPath.getPoint(t, _pos);
  cameraTargetPath.getPoint(t, _tgt);
  return { position: _pos.clone(), target: _tgt.clone() };
}
