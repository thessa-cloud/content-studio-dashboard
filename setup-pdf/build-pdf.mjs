/**
 * Build the Setup Guide PDF AND verify zero page overflow.
 *
 * Why this exists: the print engine splits any .page taller than 297mm
 * across two physical sheets, dropping overflow content into the top
 * margin of the next sheet. Thessa saw this on p.14 (2026-06-10) and
 * called it out, hard. The only safe gate is: measure every .page,
 * fail loudly if any exceeds 297mm.
 *
 * Output:
 *   - setup-pdf/Setup-Guide.pdf
 *   - exits with code 1 if any .page overflows (PDF still written for
 *     debugging, but ./Setup Guide.pdf in project root is NOT updated)
 *   - exits with code 0 + copies to ./Setup Guide.pdf on clean run
 */
import { chromium } from "/root/avelina-ai/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(HERE, "setup-guide.html");
const OUT_PDF = path.join(HERE, "Setup-Guide.pdf");
const ROOT_PDF = path.resolve(HERE, "..", "Setup Guide.pdf");

if (!fs.existsSync(HTML)) {
  console.error(`Missing ${HTML}`);
  process.exit(1);
}

const PAGE_HEIGHT_MM = 297; // A4
const MM_TO_PX = 96 / 25.4; // CSS px per mm at 96dpi
const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX; // 1122.52 px

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 794, height: 1123 }, // A4 at 96dpi
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

await page.goto("file://" + HTML, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Measure every .page (or .page.cover) and flag any that overflow A4.
const measurements = await page.evaluate((pageHeightPx) => {
  const pages = Array.from(document.querySelectorAll("section.page"));
  return pages.map((el, idx) => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    // Find the footer-page-number text for human-readable identification
    const footer = el.querySelector(".pagefoot span:last-child");
    const label = footer ? footer.textContent.trim() : `(no footer) idx ${idx}`;
    return {
      idx,
      label,
      heightPx: Math.round(rect.height),
      heightMm: +(rect.height / (96 / 25.4)).toFixed(2),
      overflowsBy: Math.max(0, +((rect.height - pageHeightPx) / (96 / 25.4)).toFixed(2)),
      isCover: el.classList.contains("cover"),
    };
  });
}, PAGE_HEIGHT_PX);

console.log("\nPage height audit:");
console.log("─".repeat(72));
let anyOverflow = false;
for (const m of measurements) {
  const status = m.overflowsBy > 0 ? "❌ OVERFLOW" : "✅";
  const tail = m.overflowsBy > 0 ? `  +${m.overflowsBy}mm over A4` : "";
  console.log(
    `${status}  idx ${String(m.idx).padStart(2, " ")}  ${m.heightMm.toFixed(2).padStart(7, " ")}mm  ${m.label}${tail}`,
  );
  if (m.overflowsBy > 0) anyOverflow = true;
}
console.log("─".repeat(72));

// Always write the inspection PDF so we can look at it even on failure.
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
  preferCSSPageSize: true,
});

console.log(`\nPDF written: ${OUT_PDF}`);

if (anyOverflow) {
  console.error("\n❌ One or more pages overflow A4. Root PDF NOT updated.");
  console.error("   Fix the HTML for the flagged pages and rebuild.");
  await browser.close();
  process.exit(1);
}

// Clean run, mirror to project root.
fs.copyFileSync(OUT_PDF, ROOT_PDF);
console.log(`PDF copied to: ${ROOT_PDF}`);
console.log("✅ Zero overflow. Safe to ship.");

await browser.close();
