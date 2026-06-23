import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";
import { CommandPaletteProvider } from "@/components/command/CommandPalette";
import { NotificationsProvider } from "@/components/notifications/Notifications";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Toaster } from "@/components/ui/toast";

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <CommandPaletteProvider>
      <NotificationsProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Navigazione desktop/tablet */}
          <Sidebar />

          {/* Navigazione telefono */}
          <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />

          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar onOpenMenu={() => setMenuOpen(true)} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <Outlet />
            </main>
          </div>
        </div>
        <ChatWidget />
        <Toaster />
      </NotificationsProvider>
    </CommandPaletteProvider>
  );
}
