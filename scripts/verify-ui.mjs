import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../docs/screenshots");
const BASE = "http://localhost:5173";

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // Login (solo logo, icona grande)
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "_check-login.png") });

  // Registrazione → dashboard
  await page.getByRole("button", { name: "Registrati" }).click();
  await page.fill("#nome", "Giulia Rossi");
  await page.fill("#email", `ui${Date.now()}@inboxai.it`);
  await page.fill("#password", "DemoInbox2026");
  await page.getByRole("button", { name: "Registrati" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Rail recolhido (default)
  await page.screenshot({ path: path.join(outDir, "_check-dash-collapsed.png") });

  // Hover sulla sidebar → espansa
  await page.mouse.move(32, 400);
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(outDir, "_check-dash-expanded.png") });

  await browser.close();
  console.log("ok");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
