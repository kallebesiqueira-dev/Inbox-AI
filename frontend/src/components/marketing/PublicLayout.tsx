import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const link = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors hover:text-foreground",
    isActive ? "text-foreground" : "text-muted-foreground"
  );

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center" aria-label="Inbox AI">
            <img src="/logo.jpeg" alt="Inbox AI" className="h-9 w-auto rounded" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/funzionalita" className={link}>
              Funzionalità
            </NavLink>
            <NavLink to="/documentazione" className={link}>
              Documentazione
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Accedi
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              Inizia ora
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/icon.jpeg" alt="" className="h-6 w-auto rounded" />
            <span>© {new Date().getFullYear()} Inbox AI — Tutti i diritti riservati.</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/funzionalita" className="hover:text-foreground">
              Funzionalità
            </Link>
            <Link to="/documentazione" className="hover:text-foreground">
              Documentazione
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Accedi
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
