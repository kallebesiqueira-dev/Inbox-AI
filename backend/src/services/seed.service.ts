import { offerteCrud } from "./offerte.service.js";
import { opportunitaCrud } from "./opportunita.service.js";
import { approvazioneCrud } from "./approvazione.service.js";

/** Popola i dati iniziali di esempio (offerte, CRM, approvazioni) per un nuovo utente. */
export async function seedUtente(userId: string): Promise<void> {
  try {
    await Promise.all([
      offerteCrud.seedPerUtente(userId),
      opportunitaCrud.seedPerUtente(userId),
      approvazioneCrud.seedPerUtente(userId),
    ]);
  } catch (err) {
    // Il seed è un comfort iniziale: un errore non deve impedire la registrazione.
    console.error("[Seed] popolamento iniziale fallito:", err);
  }
}
