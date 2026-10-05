// Home page — composes the single-page experience: the fixed 3D canvas (WorldLoader),
// the cinematic Overlay, the Navigation, the scroll-driven text panels (ScrollContent),
// and the tall invisible spacer whose height drives the entire scroll journey.
import WorldLoader from "@/components/WorldLoader";
import Navigation from "@/components/Navigation";
import ScrollContent from "@/components/ScrollContent";
import Overlay from "@/components/Overlay";
import { journey } from "@/site.config";
// DEBUG (dormant): on-screen WebGL diagnostic. Re-enable the import + <WebGLDiagnostic />
// below to surface WebGL capability / hydration status on a device.
// import WebGLDiagnostic from "@/components/WebGLDiagnostic";

export default function HomePage() {
  return (
    <>
      {/* DEBUG (dormant): <WebGLDiagnostic /> */}

      {/* Fixed 3D canvas behind everything */}
      <WorldLoader />

      {/* Cinematic vignette + gradients */}
      <Overlay />

      {/* Navigation */}
      <Navigation />

      {/* Scroll content — fixed panels that fade in/out */}
      <ScrollContent />

      {/* The scrollable spacer that drives the journey — length set by journey.pages. */}
      <div style={{ height: `${journey.pages * 100}vh`, position: "relative", zIndex: 1, pointerEvents: "none" }} />
    </>
  );
}
