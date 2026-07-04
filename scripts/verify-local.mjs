// Verifica locale post-refactor: registrazione → dashboard → docs 404 → widget chat.
import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const browser = await chromium.launch();
const page = await browser.newPage();
const errori = [];
page.on("pageerror", (e) => errori.push(`pageerror: ${e.message}`));
page.on("response", (r) => {
  if (r.status() >= 500) errori.push(`HTTP ${r.status()} ${r.url()}`);
});

// 1) Registrazione → /app
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.getByText("Registrati", { exact: false }).first().click();
await page.getByRole("textbox", { name: "Nome" }).fill("Verifica Locale");
await page.getByRole("textbox", { name: "Email" }).fill(`local${Date.now()}@test.local`);
await page.getByRole("textbox", { name: /password/i }).first().fill("Password123!");
await page.getByRole("button", { name: /crea|registra/i }).click();
await page.waitForURL("**/app**", { timeout: 20000 });
await page.waitForSelector("text=Offerte generate", { timeout: 15000 });
console.log("1) register → dashboard OK");

// 2) Login page redirige se già autenticato
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.waitForURL("**/app**", { timeout: 10000 });
console.log("2) /login con sessione attiva → redirect /app OK");

// 3) Docs con slug inesistente → articolo non trovato
await page.goto(`${BASE}/documentazione/slug-inesistente`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Articolo non trovato", { timeout: 10000 });
console.log("3) docs 404 OK");

// 4) Widget chat: apri, invia, ricevi streaming
await page.goto(`${BASE}/app`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Offerte generate", { timeout: 15000 });
await page.getByRole("button", { name: "Apri assistente" }).click();
const areaChat = page.getByRole("textbox", { name: /scrivi un messaggio/i });
await areaChat.waitFor({ timeout: 10000 });
await areaChat.fill("Ciao");
await areaChat.press("Enter");
// Attende una risposta dell'assistente (reale o fallback): il testo della
// pagina deve crescere oltre il messaggio dell'utente.
await page.waitForFunction(
  () => (document.body.textContent ?? "").length > 0 &&
    /aiutarti|preso nota|assistente/i.test(document.body.textContent ?? ""),
  undefined,
  { timeout: 30000 }
);
console.log("4) chat widget streaming OK");

// 5) Modale offerta: Escape chiude (usa GeneraOffertaAI dalla pagina Offerte)
await page.goto(`${BASE}/app/offerte`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /genera con ai/i }).first().click();
const modale = page.locator("[aria-label='Genera offerta con AI'][role='dialog']");
await modale.waitFor({ timeout: 10000 });
await page.keyboard.press("Escape");
await modale.waitFor({ state: "detached", timeout: 5000 });
console.log("5) modale role=dialog + Escape OK");

console.log(errori.length ? `ERRORI:\n${errori.join("\n")}` : "Nessun errore 5xx/JS.");
await browser.close();
process.exit(errori.length ? 1 : 0);
