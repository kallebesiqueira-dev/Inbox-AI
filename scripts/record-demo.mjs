// Registra il walkthrough per il README (webm), da convertire in GIF con ffmpeg.
// Uso: node scripts/record-demo.mjs
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:5173";
const DIR = "scripts/video";
fs.mkdirSync(DIR, { recursive: true });
// Solo i video precedenti: la cartella può essere bloccata da altri processi.
for (const f of fs.readdirSync(DIR)) {
  if (f.endsWith(".webm")) fs.rmSync(`${DIR}/${f}`, { force: true });
}

const EMAIL = `demoreadme${Date.now()}@test.local`;
const PASSWORD = "Password123!";

// ---------- Preparazione fuori registrazione: utente + dati reali ----------
{
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const reg = await p.evaluate(async ({ mail, pw }) => {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "Marco Bianchi", email: mail, password: pw }),
    });
    return r.json();
  }, { mail: EMAIL, pw: PASSWORD });
  const csrf = reg.csrfToken;
  const post = (path, body) =>
    p.evaluate(
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
  await post("/crm", { cliente: "Rossi S.p.A.", valore: 12400, fase: "In Analisi" });
  await post("/crm", { cliente: "Bianchi Costruzioni", valore: 8750, fase: "Negoziazione" });
  await post("/crm", { cliente: "Studio Ferrari", valore: 5600, fase: "Chiuso" });
  await post("/crm", { cliente: "Gallo Sports", valore: 15000, fase: "Offerta Inviata" });
  await post("/crm", { cliente: "Tecno Impianti SRL", valore: 9800, fase: "Nuovo" });
  await post("/crm", { cliente: "Verdi Logistica", valore: 6200, fase: "In Analisi" });
  await post("/offerte", { cliente: "Gallo Sports", importo: 15000, stato: "Inviata" });
  await post("/offerte", { cliente: "Rossi S.p.A.", importo: 12400, stato: "Approvata" });
  await post("/offerte", { cliente: "Bianchi Costruzioni", importo: 8750, stato: "In revisione" });
  await post("/offerte", { cliente: "Verdi Logistica", importo: 6200, stato: "Inviata" });
  await b.close();
  console.log("dati pronti per", EMAIL);
}

// ---------- Registrazione ----------
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: DIR, size: { width: 1280, height: 800 } },
});

// Cursore finto che segue il mouse: rende visibile l'interazione nel video.
await ctx.addInitScript(() => {
  const attiva = () => {
    if (document.getElementById("cursore-demo")) return;
    const c = document.createElement("div");
    c.id = "cursore-demo";
    Object.assign(c.style, {
      position: "fixed",
      left: "0px",
      top: "0px",
      width: "18px",
      height: "18px",
      border: "2.5px solid rgba(15,76,92,.95)",
      background: "rgba(212,163,115,.45)",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "999999",
      transform: "translate(-50%,-50%)",
      boxShadow: "0 1px 6px rgba(16,42,50,.35)",
      transition: "width .12s, height .12s",
    });
    document.body.appendChild(c);
    window.addEventListener(
      "mousemove",
      (e) => {
        c.style.left = e.clientX + "px";
        c.style.top = e.clientY + "px";
      },
      true
    );
    window.addEventListener(
      "mousedown",
      () => {
        c.style.width = "13px";
        c.style.height = "13px";
      },
      true
    );
    window.addEventListener(
      "mouseup",
      () => {
        c.style.width = "18px";
        c.style.height = "18px";
      },
      true
    );
  };
  if (document.readyState !== "loading") attiva();
  else document.addEventListener("DOMContentLoaded", attiva);
});

const page = await ctx.newPage();
const attesa = (ms) => page.waitForTimeout(ms);
const muovi = async (sel, opts = {}) => {
  const box = await page.locator(sel).first().boundingBox();
  if (!box) return;
  await page.mouse.move(
    box.x + box.width * (opts.fx ?? 0.5),
    box.y + box.height * (opts.fy ?? 0.5),
    { steps: 28 }
  );
};
const clicca = async (sel, opts) => {
  await muovi(sel, opts);
  await attesa(180);
  // Il click vero lo fa Playwright (actionability + coordinate esatte):
  // il movimento sopra serve solo a rendere fluido il cursore nel video.
  await page.locator(sel).first().click();
};

// 1) Landing.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.mouse.move(640, 300, { steps: 20 });
await attesa(1400);
await page.mouse.wheel(0, 500);
await attesa(900);
await page.mouse.wheel(0, 500);
await attesa(900);
await page.mouse.wheel(0, -1000);
await attesa(700);

// 2) Login con digitazione visibile.
await clicca("a[href='/login']");
await page.waitForURL("**/login");
await attesa(1000);
await clicca("input[type='email']");
await page.keyboard.type(EMAIL, { delay: 26 });
await clicca("input[type='password']");
await page.keyboard.type(PASSWORD, { delay: 30 });
await attesa(250);
await clicca("button[type='submit']");
await page.waitForURL("**/app");
await page.waitForSelector("text=Valore pipeline", { timeout: 20000 });
await attesa(1500);

// 3) Dashboard: hover sui KPI e sui grafici.
await muovi("text=Email elaborate");
await attesa(500);
await muovi("text=Valore pipeline", { fy: 0.4 });
await attesa(700);
await muovi("text=Andamento mensile");
await attesa(500);
await muovi("text=Pipeline per fase");
await attesa(800);
await page.mouse.wheel(0, 450);
await attesa(1400);
await muovi("text=Valore pipeline per fase");
await attesa(1000);
await page.mouse.wheel(0, -450);
await attesa(800);

// 4) CRM kanban.
await clicca("a[href='/app/crm']");
await page.waitForURL("**/app/crm");
await page.waitForSelector("text=Rossi S.p.A.");
await attesa(1600);
await page.mouse.wheel(0, 250);
await attesa(900);

// 5) Offerte.
await clicca("a[href='/app/offerte']");
await page.waitForURL("**/app/offerte");
await page.waitForSelector("td:has-text('2026-001')");
await attesa(1600);

// 6) Assistente AI: domanda con risposta reale in streaming.
await clicca("button[aria-label='Apri assistente']");
await attesa(900);
await clicca("textarea[aria-label='Scrivi un messaggio all\\'assistente']");
await page.keyboard.type("Analizza la mia pipeline e dimmi le priorità", {
  delay: 24,
});
await attesa(300);
await page.keyboard.press("Enter");
// Lascia scorrere lo streaming.
await attesa(9000);
await clicca("button[aria-label='Chiudi assistente']");
await attesa(500);

// 7) Chiusura sulla dashboard.
await clicca("a[href='/app']");
await page.waitForSelector("text=Valore pipeline");
await attesa(2200);

await ctx.close();
await browser.close();
const file = fs.readdirSync(DIR).find((f) => f.endsWith(".webm"));
console.log("video:", `${DIR}/${file}`, "utente:", EMAIL);
