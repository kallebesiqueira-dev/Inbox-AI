import type { AIProvider } from "./providers/AIProvider.js";
import { DefaultProvider } from "./providers/DefaultProvider.js";
import { GroqProvider } from "./providers/GroqProvider.js";
import { env } from "../../config/env.js";

/**
 * Factory del provider AI. Seleziona l'implementazione in base alla
 * configurazione, senza esporre dettagli al resto dell'applicazione.
 */
function creaProvider(): AIProvider {
  switch (env.AI_PROVIDER) {
    case "groq":
      if (!env.AI_API_KEY) {
        console.warn(
          "[AI] AI_PROVIDER=groq ma AI_API_KEY mancante: uso il provider di default."
        );
        return new DefaultProvider();
      }
      return new GroqProvider();
    case "default":
    default:
      return new DefaultProvider();
  }
}

export const ai: AIProvider = creaProvider();
export type { AIProvider } from "./providers/AIProvider.js";
