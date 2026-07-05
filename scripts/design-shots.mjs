// Screenshot di tutte le pagine dell'app a 3 viewport, con dati realistici.
// Uso: node scripts/design-shots.mjs [prefisso]   (default "base")
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:5173";
const PREFISSO = process.argv[2] ?? "base";
const DIR = "scripts/shots";
fs.mkdirSync(DIR, { recursive: true });

const VIEWPORTS = [
  { nome: "mobile", width: 390, height: 844 },
  { nome: "tablet", width: 768, height: 1024 },
  { nome: "desktop", width: 1366, height: 850 },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORTS[2] });
const page = await ctx.newPage();

// Registrazione + semina dati via API (modalità demo, in memoria).
const email = `design${Date.now()}@test.local`;
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
const reg = await page.evaluate(async (mail) => {
  const r = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "Design Review", email: mail, password: "Password123!" }),
  });
  return r.json();
}, email);
const csrf = reg.csrfToken;

const post = (path, body) =>
  page.evaluate(
    async ({ path, body, csrf }) => {
      const r = await fetch(`/api${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify(body),
      });
      return r.status;
    },
    { path, body, csrf }
  );

// CRM: include il caso reale del nome lunghissimo in maiuscolo.
await post("/crm", { cliente: "VITORIA MAX CLUBE DE BENEFICIOS", valore: 0 });
await post("/crm", { cliente: "Gallo Sports", valore: 1500, fase: "Offerta Inviata" });
await post("/crm", { cliente: "Rossi S.p.A.", valore: 12400, fase: "In Analisi" });
await post("/crm", { cliente: "Bianchi Costruzioni Generali SRL", valore: 8750, fase: "Negoziazione" });
await post("/crm", { cliente: "Studio Ferrari", valore: 5600, fase: "Chiuso" });
// Offerte (creano anche approvazioni)
await post("/offerte", { cliente: "Gallo Sports", importo: 1500, stato: "Inviata", corpo: "Gentile cliente, in riferimento alla vostra richiesta vi proponiamo la seguente offerta.", voci: [{ descrizione: "Servizio base", importo: 1000 }, { descrizione: "Personalizzazione", importo: 500 }] });
await post("/offerte", { cliente: "VITORIA MAX CLUBE DE BENEFICIOS", importo: 25400, stato: "Bozza" });
await post("/offerte", { cliente: "Rossi S.p.A.", importo: 12400, stato: "Approvata" });
// Cestino: una eliminata
const opps = await page.evaluate(async () => (await fetch("/api/crm", { credentials: "include" })).json());
await page.evaluate(
  async ({ id, csrf }) =>
    fetch(`/api/crm/${id}`, { method: "DELETE", credentials: "include", headers: { "X-CSRF-Token": csrf } }),
  { id: opps[opps.length - 1].id, csrf }
);

const PAGINE = [
  ["dashboard", "/app"],
  ["inbox", "/app/inbox"],
  ["offerte", "/app/offerte"],
  ["crm", "/app/crm"],
  ["approvazioni", "/app/approvazioni"],
  ["cestino", "/app/cestino"],
  ["impostazioni", "/app/impostazioni"],
  ["landing", "/"],
];

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  for (const [nome, rotta] of PAGINE) {
    await page.goto(`${BASE}${rotta}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `${DIR}/${PREFISSO}-${nome}-${vp.nome}.png`,
      fullPage: true,
    });
  }
}
console.log(`Fatte ${VIEWPORTS.length * PAGINE.length} screenshot in ${DIR}/ (prefisso ${PREFISSO})`);
await browser.close();
