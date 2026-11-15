import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { MapPage } from "./pages/MapPage";

// The map is the landing screen, so it ships in the main bundle. The heavier
// chart bundle and the secondary screens load on demand.
const ComparePage = lazy(() =>
  import("./pages/ComparePage").then((m) => ({ default: m.ComparePage })),
);
const HotspotsPage = lazy(() =>
  import("./pages/HotspotsPage").then((m) => ({ default: m.HotspotsPage })),
);
const StatsPage = lazy(() =>
  import("./pages/StatsPage").then((m) => ({ default: m.StatsPage })),
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<MapPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/hotspots" element={<HotspotsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
