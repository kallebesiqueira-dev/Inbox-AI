import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMe } from "@/hooks/useAuth";

export function RequireAuth() {
  const { data: utente, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!utente) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
