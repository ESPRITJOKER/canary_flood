import { BarChart3, Columns2, Flame, Info, Map as MapIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "../i18n/en";

export interface NavItem {
  path: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", labelKey: "nav.map", icon: MapIcon },
  { path: "/compare", labelKey: "nav.compare", icon: Columns2 },
  { path: "/hotspots", labelKey: "nav.hotspots", icon: Flame },
  { path: "/stats", labelKey: "nav.stats", icon: BarChart3 },
  { path: "/about", labelKey: "nav.about", icon: Info },
];
