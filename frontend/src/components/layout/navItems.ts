import {
  LayoutDashboard,
  Inbox,
  FileText,
  Users,
  CheckSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/offerte", label: "Offerte", icon: FileText },
  { to: "/app/crm", label: "CRM", icon: Users },
  { to: "/app/approvazioni", label: "Approvazioni", icon: CheckSquare },
  { to: "/app/impostazioni", label: "Impostazioni", icon: Settings },
];
