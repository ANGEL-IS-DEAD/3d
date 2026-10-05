"use client";

// Drives the camera every frame — eases toward the scroll-mapped position/look-at from
// cameraPath, plus subtle idle "breathing" and a scroll-velocity look wobble.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getCameraState } from "@/lib/cameraPath";
import { scrollState } from "@/lib/scrollStore";

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

export default function CameraRig() {
  const smoothProgress = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    // Clamped delta → exponential smoothing keeps the camera feel identical at 60Hz and
    // 120Hz (a fixed per-frame factor would chase the scroll twice as fast at 120Hz).
    const dt = Math.min(delta, 0.1);
    const target = scrollState.progress;
    const diff = target - smoothProgress.current;

    // Adaptive catch-up rate (per second); equivalent to the old 0.18/0.09/0.045
    // per-frame factors at 60fps, but now refresh-rate independent.
    const rate =
      Math.abs(diff) > 0.12 ? 11
      : Math.abs(diff) > 0.04 ? 5.4
      : 2.7;

    smoothProgress.current += diff * (1 - Math.exp(-rate * dt));

    const { position, target: lookAt } = getCameraState(smoothProgress.current);

    const t = clock.getElapsedTime();
    // Subtle camera breathing — slow, organic
    const breatheX = Math.sin(t * 0.28) * 0.055;
    const breatheY = Math.sin(t * 0.21 + 1.1) * 0.038;
    const breatheZ = Math.sin(t * 0.17 + 0.6) * 0.025;

    const wobble = scrollState.velocity * 0.0002;

    _targetPos.copy(camera.position).lerp(position, 1 - Math.exp(-3.6 * dt));
    camera.position.set(
      _targetPos.x + breatheX,
      _targetPos.y + breatheY,
      _targetPos.z + breatheZ,
    );

    _targetLook.set(lookAt.x, lookAt.y + wobble + breatheY * 0.3, lookAt.z);
    camera.lookAt(_targetLook);
  });

  return null;
}
