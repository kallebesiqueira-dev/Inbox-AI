import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../docs/screenshots");

const BASE = "http://localhost:5173";

const pagine = [
  { path: "/", file: "dashboard.png", attesa: "Dashboard" },
  { path: "/inbox", file: "inbox.png", attesa: "Inbox" },
  { path: "/offerte", file: "offerte.png", attesa: "Offerte" },
  { path: "/crm", file: "crm.png", attesa: "CRM" },
  { path: "/approvazioni", file: "approvazioni.png", attesa: "Approvazioni" },
  { path: "/impostazioni", file: "impostazioni.png", attesa: "Impostazioni" },
];

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // --- Login page screenshot (registrazione) ---
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "login.png") });

  // Passa alla registrazione e crea un utente demo (modalità in memoria).
  await page.getByRole("button", { name: "Registrati" }).click();
  await page.fill("#nome", "Giulia Rossi");
  await page.fill("#email", `demo${Date.now()}@inboxai.it`);
  await page.fill("#password", "DemoInbox2026");
  await page.getByRole("button", { name: "Registrati" }).click();

  // Attendi l'ingresso nell'area autenticata.
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  for (const p of pagine) {
    await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, p.file) });
    console.log(`✓ ${p.file}`);
  }

  await browser.close();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
