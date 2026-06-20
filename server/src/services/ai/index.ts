import type { AIProvider } from "./providers/AIProvider.js";
import { DefaultProvider } from "./providers/DefaultProvider.js";

/**
 * Factory del provider AI. Seleziona l'implementazione in base alla
 * configurazione, senza esporre dettagli al resto dell'applicazione.
 */
function creaProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "default";

  switch (provider) {
    case "default":
    default:
      return new DefaultProvider();
  }
}

export const ai: AIProvider = creaProvider();
export type { AIProvider } from "./providers/AIProvider.js";
