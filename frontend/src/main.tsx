import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { warmup } from "@/lib/api";
import "./index.css";

// Risveglia subito il backend (hosting con cold start) appena la pagina si apre.
warmup();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Più tolleranza ai tempi del cold start: ritenta con backoff.
      retry: 2,
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
