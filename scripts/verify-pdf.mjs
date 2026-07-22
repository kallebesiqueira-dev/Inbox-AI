// Verifica e2e del PDF offerta: registra utente → crea offerta realistica
// (corpo lungo + voci, come quelle generate dall'AI) → apre dettaglio →
// "Scarica PDF" → ispeziona il PDF scaricato (byte + numero pagine).
// Uso: node scripts/verify-pdf.mjs [baseUrl] [lungo]
//   baseUrl  default http://localhost:5173 (accetta anche l'URL di prod)
//   lungo    triplica il corpo per verificare l'impaginazione multi-pagina
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const BASE = process.argv[2] ?? "http://localhost:5173";
const browser = await chromium.launch();
const page = await browser.newPage();
const errori = [];
page.on("pageerror", (e) => errori.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errori.push(`console.error: ${m.text()}`);
});

await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.getByText("Registrati", { exact: false }).first().click();
await page.getByRole("textbox", { name: "Nome" }).fill("Repro PDF");
await page.getByRole("textbox", { name: "Email" }).fill(`repro${Date.now()}@test.local`);
await page.getByRole("textbox", { name: /password/i }).first().fill("Password123!");
await page.getByRole("button", { name: /crea|registra/i }).click();
await page.waitForURL("**/app**", { timeout: 60000 });
console.log("1) registrato");

// Crea via API un'offerta con corpo lungo (stile AI) + voci
const corpo = [
  "Gentile Cliente,",
  "",
  "a seguito della nostra analisi delle vostre esigenze operative, siamo lieti di presentarvi la nostra proposta commerciale per l'adozione della piattaforma Inbox AI, la soluzione di automazione intelligente per la gestione della posta commerciale.",
  "",
  "La piattaforma include i seguenti moduli:",
  "1. Classificazione automatica delle email in ingresso tramite modelli AI addestrati sul vostro dominio, con smistamento per priorita e reparto.",
  "2. Generazione automatica di offerte commerciali a partire dalle richieste dei clienti, con flusso di approvazione integrato.",
  "3. CRM leggero con pipeline delle opportunita, aggiornato automaticamente dagli scambi email.",
  "4. Dashboard direzionale con KPI in tempo reale su volumi, conversioni e tempi di risposta.",
  "5. Integrazione nativa con Google Workspace (Gmail) tramite OAuth 2.0, senza salvataggio delle credenziali.",
  "",
  "Il progetto prevede una fase di onboarding di due settimane, durante la quale il nostro team configurera i modelli di classificazione, i template delle offerte e i flussi di approvazione secondo i vostri processi interni.",
  "",
  "Tutti i dati sono trattati in conformita al GDPR e ospitati su infrastruttura europea. Il servizio include aggiornamenti continui, supporto prioritario via email e un referente dedicato.",
  "",
  "La presente offerta ha validita di 30 giorni dalla data di emissione. I prezzi indicati sono da intendersi IVA esclusa.",
  "",
  "Restiamo a disposizione per qualsiasi chiarimento e per una demo personalizzata.",
  "",
  "Cordiali saluti,",
  "Il team Inbox AI",
].join("\n");
// Variante lunga per verificare l'impaginazione multi-pagina
const corpoLungo = process.argv[3] === "lungo" ? `${corpo}\n\n${corpo}\n\n${corpo}` : corpo;

const creato = await page.evaluate(async (corpo) => {
  // Il token CSRF vive in memoria nell'app: lo recuperiamo da /auth/me
  const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
  const res = await fetch("/api/offerte", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "X-CSRF-Token": me.csrfToken ?? "" },
    body: JSON.stringify({
      cliente: "ACME S.p.A.",
      importo: 15800,
      corpo,
      voci: [
        { descrizione: "Licenza piattaforma Inbox AI (12 mesi)", importo: 9600 },
        { descrizione: "Onboarding e configurazione modelli", importo: 3200 },
        { descrizione: "Integrazione Google Workspace", importo: 1800 },
        { descrizione: "Formazione team (2 sessioni)", importo: 1200 },
      ],
    }),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}, corpoLungo);
console.log("2) offerta creata via API:", creato.status);
if (creato.status >= 400) {
  console.log(JSON.stringify(creato.body));
  process.exit(1);
}

await page.goto(`${BASE}/app/offerte`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /dettaglio offerta/i }).locator("visible=true").first().click();
await page.locator("[role='dialog'][aria-label^='Offerta']").waitFor({ timeout: 10000 });
console.log("3) dettaglio aperto");

const attesa = page.waitForEvent("download", { timeout: 30000 }).catch((e) => e);
await page.getByRole("button", { name: /scarica pdf/i }).click();
const esito = await attesa;
if (esito instanceof Error) {
  console.log("4) DOWNLOAD FALLITO:", esito.message);
} else {
  const dest = path.join(os.tmpdir(), esito.suggestedFilename());
  await esito.saveAs(dest);
  const buf = await readFile(dest);
  const testo = buf.toString("latin1");
  const pagine = (testo.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`4) download OK: ${esito.suggestedFilename()} (${buf.length} byte, ${pagine} pagine) → ${dest}`);
}

const toastErr = await page.getByText(/impossibile generare il pdf/i).count();
if (toastErr) console.log("   toast errore visibile!");
console.log(errori.length ? `ERRORI:\n${errori.join("\n")}` : "Nessun errore console/JS.");
await browser.close();
process.exit(0);
