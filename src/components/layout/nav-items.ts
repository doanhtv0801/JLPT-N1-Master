import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, GraduationCap, BookOpen, RefreshCcw, BarChart3, Settings } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Learn", href: "/learn", icon: GraduationCap },
  { label: "Vocabulary", href: "/vocabulary", icon: BookOpen },
  { label: "Review", href: "/review", icon: RefreshCcw },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Learn", href: "/learn", icon: GraduationCap },
  { label: "Review", href: "/review", icon: RefreshCcw },
  { label: "Vocab", href: "/vocabulary", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];
