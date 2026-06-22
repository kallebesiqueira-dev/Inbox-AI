import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  errore: boolean;
}

/** Cattura gli errori di rendering e mostra un fallback invece di una pagina bianca. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { errore: false };

  static getDerivedStateFromError(): State {
    return { errore: true };
  }

  componentDidCatch(errore: unknown) {
    console.error("[UI] Errore non gestito:", errore);
  }

  render() {
    if (!this.state.errore) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">Si è verificato un errore</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Qualcosa è andato storto. Ricarica la pagina per riprovare.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          Ricarica
        </button>
      </div>
    );
  }
}
