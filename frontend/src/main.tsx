import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ApiError, warmup } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import "./index.css";

// Risveglia subito il backend (hosting con cold start) appena la pagina si apre.
warmup();

const queryClient = new QueryClient({
  // Rete di sicurezza: nessuna mutation può fallire in silenzio. Se il chiamante
  // non gestisce l'errore, l'utente vede comunque un toast.
  mutationCache: new MutationCache({
    onError: (error, _variabili, _contesto, mutation) => {
      if (mutation.options.onError) return;
      const messaggio =
        error instanceof Error && error.message
          ? error.message
          : "Operazione non riuscita. Riprova.";
      toast(messaggio, "errore");
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Più tolleranza ai tempi del cold start: ritenta con backoff.
      // Gli errori 4xx sono definitivi: ritentarli allunga solo l'attesa.
      retry: (tentativi, errore) =>
        tentativi < 2 && !(errore instanceof ApiError && errore.status < 500),
      retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
