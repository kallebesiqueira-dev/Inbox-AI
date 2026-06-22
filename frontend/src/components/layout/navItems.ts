import {
  LayoutDashboard,
  Sparkles,
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
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/assistente", label: "Assistente", icon: Sparkles },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/offerte", label: "Offerte", icon: FileText },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/approvazioni", label: "Approvazioni", icon: CheckSquare },
  { to: "/impostazioni", label: "Impostazioni", icon: Settings },
];
