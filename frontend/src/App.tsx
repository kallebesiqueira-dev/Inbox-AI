import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/marketing/PublicLayout";
import { Landing } from "@/pages/marketing/Landing";
import { Funzionalita } from "@/pages/marketing/Funzionalita";
import { Documentazione } from "@/pages/marketing/Documentazione";
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
      {/* Sito pubblico di presentazione */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/funzionalita" element={<Funzionalita />} />
        <Route path="/documentazione" element={<Documentazione />} />
        <Route path="/documentazione/:slug" element={<Documentazione />} />
      </Route>

      <Route path="/login" element={<Login />} />

      {/* Applicazione autenticata */}
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="assistente" element={<Chat />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="offerte" element={<Offerte />} />
          <Route path="crm" element={<Crm />} />
          <Route path="approvazioni" element={<Approvazioni />} />
          <Route path="impostazioni" element={<Impostazioni />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
