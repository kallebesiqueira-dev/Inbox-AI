import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/marketing/PublicLayout";

// Caricamento lazy delle pagine: ognuna diventa un chunk separato, scaricato
// solo quando serve. Riduce nettamente il bundle iniziale.
const Landing = lazy(() =>
  import("@/pages/marketing/Landing").then((m) => ({ default: m.Landing }))
);
const Funzionalita = lazy(() =>
  import("@/pages/marketing/Funzionalita").then((m) => ({ default: m.Funzionalita }))
);
const Documentazione = lazy(() =>
  import("@/pages/marketing/Documentazione").then((m) => ({ default: m.Documentazione }))
);
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const InboxPage = lazy(() =>
  import("@/pages/Inbox").then((m) => ({ default: m.InboxPage }))
);
const Offerte = lazy(() =>
  import("@/pages/Offerte").then((m) => ({ default: m.Offerte }))
);
const Crm = lazy(() => import("@/pages/Crm").then((m) => ({ default: m.Crm })));
const Approvazioni = lazy(() =>
  import("@/pages/Approvazioni").then((m) => ({ default: m.Approvazioni }))
);
const Impostazioni = lazy(() =>
  import("@/pages/Impostazioni").then((m) => ({ default: m.Impostazioni }))
);
const Cestino = lazy(() =>
  import("@/pages/Cestino").then((m) => ({ default: m.Cestino }))
);
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const ResetPassword = lazy(() =>
  import("@/pages/ResetPassword").then((m) => ({ default: m.ResetPassword }))
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFound }))
);

function Caricamento() {
  return (
    <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Caricamento />}>
      <Routes>
        {/* Sito pubblico di presentazione */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/funzionalita" element={<Funzionalita />} />
          <Route path="/documentazione" element={<Documentazione />} />
          <Route path="/documentazione/:slug" element={<Documentazione />} />
        </Route>

        <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

        {/* Applicazione autenticata */}
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="offerte" element={<Offerte />} />
            <Route path="crm" element={<Crm />} />
            <Route path="approvazioni" element={<Approvazioni />} />
            <Route path="cestino" element={<Cestino />} />
            <Route path="impostazioni" element={<Impostazioni />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
