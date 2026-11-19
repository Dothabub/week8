import {
  Briefcase, Building2, CalendarRange, ChartColumn, GraduationCap, House, LayoutDashboard, ListChecks, Receipt,
  Settings, ShoppingBasket, Wallet, type LucideIcon,
} from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; mobilePrimary?: boolean }

/** Main navigation, in the order defined by the brief (§4). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobilePrimary: true },
  { href: "/tasks", label: "My Tasks", icon: ListChecks, mobilePrimary: true },
  { href: "/planner", label: "Weekly Planner", icon: CalendarRange, mobilePrimary: true },
  { href: "/work", label: "Work Schedule", icon: Briefcase },
  { href: "/university", label: "University", icon: GraduationCap },
  { href: "/placement", label: "Placement", icon: Building2 },
  { href: "/household", label: "Household", icon: House, mobilePrimary: true },
  { href: "/grocery", label: "Grocery & Stock", icon: ShoppingBasket },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/reports", label: "Reports", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
