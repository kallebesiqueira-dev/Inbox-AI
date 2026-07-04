// Verifica e2e del prod: registrazione → dashboard con KPI → nessun errore.
// Uso: node scripts/verify-prod-e2e.mjs
import { chromium } from "playwright";

const BASE = "https://inbox-ai-client-gamma.vercel.app";
const email = `verify_${Math.random().toString(36).slice(2, 8)}@test.local`;

const browser = await chromium.launch();
const page = await browser.newPage();
const errori = [];
page.on("pageerror", (e) => errori.push(`pageerror: ${e.message}`));
page.on("response", (r) => {
  if (r.status() >= 500) errori.push(`HTTP ${r.status()} ${r.url()}`);
});

const t0 = Date.now();
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.getByText("Registrati", { exact: false }).first().click();
await page.getByRole("textbox", { name: "Nome" }).fill("Verifica Prod");
await page.getByRole("textbox", { name: "Email" }).fill(email);
await page.getByRole("textbox", { name: /password/i }).first().fill("Password123!");
await page.getByRole("button", { name: /crea|registra/i }).click();
await page.waitForURL("**/app**", { timeout: 60000 });
const tLogin = ((Date.now() - t0) / 1000).toFixed(1);

// KPI della dashboard visibili (attende la risposta di /dashboard/kpi)
await page.waitForSelector("text=Offerte generate", { timeout: 30000 });
const tTot = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`OK registrazione+redirect /app in ${tLogin}s, KPI visibili in ${tTot}s`);
console.log(`Utente di test: ${email} (Atlas, da pulire se serve)`);
console.log(errori.length ? `ERRORI:\n${errori.join("\n")}` : "Nessun errore 5xx/JS.");
await browser.close();
process.exit(errori.length ? 1 : 0);
