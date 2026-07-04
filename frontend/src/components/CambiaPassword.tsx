import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCambiaPassword } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";

export function CambiaPassword() {
  const cambia = useCambiaPassword();
  const [attuale, setAttuale] = useState("");
  const [nuova, setNuova] = useState("");
  const errore = cambia.error instanceof Error ? cambia.error.message : null;

  function invia(e: React.FormEvent) {
    e.preventDefault();
    cambia.mutate(
      { passwordAttuale: attuale, nuovaPassword: nuova },
      {
        onSuccess: () => {
          toast("Password aggiornata.");
          setAttuale("");
          setNuova("");
        },
      }
    );
  }

  return (
    <form className="space-y-4" onSubmit={invia}>
      <div className="grid gap-2">
        <label htmlFor="pw-attuale" className="text-sm font-medium">
          Password attuale
        </label>
        <input
          id="pw-attuale"
          type="password"
          value={attuale}
          onChange={(e) => setAttuale(e.target.value)}
          required
          autoComplete="current-password"
          className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="pw-nuova" className="text-sm font-medium">
          Nuova password
        </label>
        <input
          id="pw-nuova"
          type="password"
          value={nuova}
          onChange={(e) => setNuova(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {errore && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errore}
        </p>
      )}
      <Button type="submit" disabled={cambia.isPending}>
        {cambia.isPending && <Loader2 className="size-4 animate-spin" />}
        Aggiorna password
      </Button>
    </form>
  );
}
