/**
 * Take screenshots of the live Content Studio dashboard for the setup PDF.
 *
 * Uses Playwright (already on the box for the bot). Hits the production URL,
 * waits for hydration, takes a viewport-sized PNG per tab.
 *
 * The dashboard fetches data from /api/data; on a fresh install every tab is
 * the "empty state" — which is exactly what a new customer sees on day one.
 * That's the right thing to screenshot for a setup guide.
 */
import { chromium } from "/root/avelina-ai/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const OUT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.DASH_URL || "https://revenu-content-studio.vercel.app";

const TABS = [
  { label: "Drafts", file: "01-drafts.png" },
  { label: "Strategy", file: "02-strategy.png" },
  { label: "Performance", file: "03-performance.png" },
  { label: "Competitor Intel", file: "04-intel.png" },
  { label: "Vault", file: "05-vault.png" },
  { label: "Settings", file: "06-settings.png" },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2, // retina-ish for crisp PDF
});
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

for (const tab of TABS) {
  try {
    // Sidebar buttons are <button> elements with text content matching the tab label.
    await page.getByRole("button", { name: tab.label, exact: true }).first().click();
  } catch (e) {
    // First tab is already active on landing — skip click.
    console.warn(`skip click for ${tab.label}: ${e.message}`);
  }
  await page.waitForTimeout(900);
  const outPath = path.join(OUT_DIR, tab.file);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`wrote ${outPath}`);
}

await browser.close();
console.log("done");
