import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MapPage } from "./pages/MapPage";

// Skeleton routing. feat/app-shell adds the layout (header, side panel, bottom
// tabs, error boundary) around these routes.
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
      <Route path="/" element={<MapPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/hotspots" element={<HotspotsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
