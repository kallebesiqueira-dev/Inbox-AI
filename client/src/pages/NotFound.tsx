import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <p className="text-lg text-muted-foreground">Pagina non trovata</p>
      <Link to="/">
        <Button>Torna alla Dashboard</Button>
      </Link>
    </div>
  );
}
