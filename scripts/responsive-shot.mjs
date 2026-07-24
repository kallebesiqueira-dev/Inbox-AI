// Genera docs/screenshots/responsive.png: dashboard desktop + mobile in cornici
// di dispositivo, per la sezione responsive del README.
// Uso: node scripts/responsive-shot.mjs
import { chromium } from "playwright";
import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const BASE = "http://localhost:5173";
const OUT = "docs/screenshots/responsive.png";
const EMAIL = `responsive${Date.now()}@test.local`;
const PASSWORD = "Password123!";

// ---------- Utente + dati reali (fuori scena) ----------
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
  const OPP = [
    ["Rossi S.p.A.", 12400, "In Analisi"],
    ["Bianchi Costruzioni", 8750, "Negoziazione"],
    ["Studio Ferrari", 5600, "Chiuso"],
    ["Gallo Sports", 15000, "Offerta Inviata"],
    ["Tecno Impianti SRL", 9800, "Nuovo"],
    ["Verdi Logistica", 6200, "In Analisi"],
    ["Delta Arredamenti", 4300, "Nuovo"],
    ["Omega Consulting", 11200, "Negoziazione"],
    ["Marchetti & Figli", 7400, "Offerta Inviata"],
    ["Aurora Impianti", 5100, "Chiuso"],
  ];
  for (const [cliente, valore, fase] of OPP) await post("/crm", { cliente, valore, fase });
  const OFF = [
    ["Gallo Sports", 15000, "Inviata"],
    ["Rossi S.p.A.", 12400, "Approvata"],
    ["Bianchi Costruzioni", 8750, "In revisione"],
    ["Tecno Impianti SRL", 9800, "Bozza"],
    ["Verdi Logistica", 6200, "Inviata"],
    ["Omega Consulting", 11200, "Approvata"],
  ];
  for (const [cliente, importo, stato] of OFF) await post("/offerte", { cliente, importo, stato });
  await b.close();

  // Retrodata i documenti su più mesi: grafici pieni come in record-demo.mjs.
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const utente = await db.collection("users").findOne({ email: EMAIL });
  const uid = utente._id.toString();
  const anno = new Date().getFullYear();
  const dataMese = (a, mese, giorno = 12) => new Date(Date.UTC(a, mese, giorno, 10));
  for (const col of ["opportunitas", "offertas", "approvaziones"]) {
    const docs = await db.collection(col).find({ userId: uid }).sort({ createdAt: 1 }).toArray();
    for (let i = 0; i < docs.length; i++) {
      const quando = dataMese(anno, (i * 5) % 7, 3 + i * 2);
      const set = { createdAt: quando, updatedAt: quando };
      if (col === "offertas") set.data = quando;
      await db.collection(col).updateOne({ _id: docs[i]._id }, { $set: set });
    }
  }
  await mongoose.disconnect();
  console.log("dati pronti per", EMAIL);
}

// ---------- Screenshot desktop e mobile ----------
const browser = await chromium.launch();
const cattura = async ({ width, height }) => {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("input[type='email']", EMAIL);
  await page.fill("input[type='password']", PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL("**/app");
  await page.waitForSelector("text=Valore pipeline", { timeout: 20000 });
  await page.waitForTimeout(1200);
  // L'email tecnica di test non deve comparire nella foto.
  await page.evaluate((mail) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      if (w.currentNode.nodeValue.includes(mail)) {
        w.currentNode.nodeValue = "marco.bianchi@rossigroup.it";
      }
    }
  }, EMAIL);
  const buf = await page.screenshot();
  await ctx.close();
  return buf.toString("base64");
};
const desktop = await cattura({ width: 1366, height: 830 });
const mobile = await cattura({ width: 390, height: 844 });

// ---------- Collage con cornici di dispositivo ----------
const ctx = await browser.newContext({
  viewport: { width: 1560, height: 1020 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.setContent(`<!DOCTYPE html><html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, sans-serif; }
  .scena {
    width: 1560px; height: 1020px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #F7F8F7 0%, #E6ECEA 55%, #d9e3e0 100%);
    display: flex; align-items: center; justify-content: flex-start;
  }
  .laptop {
    position: absolute; left: 48px; top: 70px; width: 1130px;
    border-radius: 14px; overflow: hidden; background: #fff;
    box-shadow: 0 30px 70px rgba(16, 42, 50, .28);
  }
  .barra {
    height: 38px; background: #0F4C5C; display: flex; align-items: center;
    gap: 7px; padding: 0 16px;
  }
  .puntino { width: 11px; height: 11px; border-radius: 50%; }
  .url {
    margin-left: 14px; background: rgba(255,255,255,.14); color: #E6ECEA;
    font-size: 13px; border-radius: 7px; padding: 4px 14px;
  }
  .laptop img { display: block; width: 100%; }
  .telefono {
    position: absolute; right: 56px; bottom: 52px; width: 302px;
    border-radius: 40px; background: #102A32; padding: 12px;
    box-shadow: 0 30px 60px rgba(16, 42, 50, .38);
  }
  .telefono .schermo { border-radius: 30px; overflow: hidden; display: block; }
  .telefono img { display: block; width: 100%; }
  .tacca {
    position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
    width: 96px; height: 22px; background: #102A32; border-radius: 12px; z-index: 2;
  }
</style></head><body>
  <div class="scena">
    <div class="laptop">
      <div class="barra">
        <span class="puntino" style="background:#D4A373"></span>
        <span class="puntino" style="background:#2F6B73"></span>
        <span class="puntino" style="background:#E6ECEA"></span>
        <span class="url">inbox-ai.app/app</span>
      </div>
      <img src="data:image/png;base64,${desktop}" />
    </div>
    <div class="telefono">
      <div class="tacca"></div>
      <span class="schermo"><img src="data:image/png;base64,${mobile}" /></span>
    </div>
  </div>
</body></html>`);
await page.waitForTimeout(600);
await page.locator(".scena").screenshot({ path: OUT });
await browser.close();
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`creato ${OUT} (${kb} KB) — utente di test: ${EMAIL}`);
