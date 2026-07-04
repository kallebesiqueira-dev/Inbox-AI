import { useCallback, useEffect, useRef, useState } from "react";
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
  const abortRef = useRef<AbortController | null>(null);

  // Allo smontaggio si interrompe lo stream in corso: niente setState su
  // componente smontato né lettura che continua a vuoto.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const invia = useCallback(async (testo: string) => {
    const t = testo.trim();
    if (!t || occupato.current) return;
    occupato.current = true;
    setErrore(null);
    const controller = new AbortController();
    abortRef.current = controller;

    const storico: MessaggioChat[] = [
      ...messaggiRef.current,
      { ruolo: "utente", contenuto: t },
    ];
    // Mostra subito il messaggio utente + un segnaposto per l'assistente.
    setMessaggi([...storico, { ruolo: "assistente", contenuto: "" }]);
    setInCorso(true);

    try {
      const res = await apiStream("/ai/chat", { messaggi: storico }, controller.signal);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Eventi SSE separati da una riga vuota.
        const eventi = buffer.split("\n\n");
        buffer = eventi.pop() ?? "";
        for (const evt of eventi) {
          const riga = evt.split("\n").find((l) => l.startsWith("data:"));
          if (!riga) continue;
          const dato = riga.slice(5).trim();
          if (dato === "" || dato === "[DONE]") continue;
          try {
            acc += JSON.parse(dato) as string;
          } catch {
            /* evento parziale o non valido: ignora */
          }
        }
        setMessaggi([...storico, { ruolo: "assistente", contenuto: acc }]);
      }
      if (!acc) {
        setMessaggi(storico);
        setErrore("Nessuna risposta dall'assistente. Riprova.");
      }
    } catch (e) {
      // Interruzione volontaria (smontaggio/navigazione): nessun errore da mostrare.
      if (controller.signal.aborted) return;
      setMessaggi(storico);
      setErrore(e instanceof Error ? e.message : "Errore di comunicazione.");
    } finally {
      if (!controller.signal.aborted) {
        setInCorso(false);
        occupato.current = false;
      }
    }
  }, []);

  const reset = useCallback(() => {
    if (occupato.current) return;
    setMessaggi([]);
    setErrore(null);
  }, []);

  return { messaggi, inCorso, errore, invia, reset };
}
