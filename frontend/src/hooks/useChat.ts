import { useCallback, useRef, useState } from "react";
import { apiStream } from "@/lib/api";

export interface MessaggioChat {
  ruolo: "utente" | "assistente";
  contenuto: string;
}

/** Gestisce lo stato della conversazione e lo streaming della risposta AI. */
export function useChat() {
  const [messaggi, setMessaggi] = useState<MessaggioChat[]>([]);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  // Riferimenti sempre aggiornati per la closure stabile di invia().
  const messaggiRef = useRef(messaggi);
  messaggiRef.current = messaggi;
  const occupato = useRef(false);

  const invia = useCallback(async (testo: string) => {
    const t = testo.trim();
    if (!t || occupato.current) return;
    occupato.current = true;
    setErrore(null);

    const storico: MessaggioChat[] = [
      ...messaggiRef.current,
      { ruolo: "utente", contenuto: t },
    ];
    // Mostra subito il messaggio utente + un segnaposto per l'assistente.
    setMessaggi([...storico, { ruolo: "assistente", contenuto: "" }]);
    setInCorso(true);

    try {
      const res = await apiStream("/ai/chat", { messaggi: storico });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessaggi([...storico, { ruolo: "assistente", contenuto: acc }]);
      }
      if (!acc) {
        setMessaggi(storico);
        setErrore("Nessuna risposta dall'assistente. Riprova.");
      }
    } catch (e) {
      setMessaggi(storico);
      setErrore(e instanceof Error ? e.message : "Errore di comunicazione.");
    } finally {
      setInCorso(false);
      occupato.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    if (occupato.current) return;
    setMessaggi([]);
    setErrore(null);
  }, []);

  return { messaggi, inCorso, errore, invia, reset };
}
