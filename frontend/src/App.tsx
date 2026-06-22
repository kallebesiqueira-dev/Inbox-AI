import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Chat } from "@/pages/Chat";
import { InboxPage } from "@/pages/Inbox";
import { Offerte } from "@/pages/Offerte";
import { Crm } from "@/pages/Crm";
import { Approvazioni } from "@/pages/Approvazioni";
import { Impostazioni } from "@/pages/Impostazioni";
import { Login } from "@/pages/Login";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assistente" element={<Chat />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/offerte" element={<Offerte />} />
          <Route path="/crm" element={<Crm />} />
          <Route path="/approvazioni" element={<Approvazioni />} />
          <Route path="/impostazioni" element={<Impostazioni />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
