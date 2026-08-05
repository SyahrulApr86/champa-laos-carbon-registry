import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { artifactDirectory, readManifest, statusRow, writeArtifact } from "./common.mjs";

const requireRunner = process.argv.includes("--require-runner");
const base = process.env.CHAMPA_WEB_BASE?.replace(/\/$/, "");
const manifest = readManifest();
const playwrightPath = resolve("node_modules/playwright");

if (!base || !existsSync(playwrightPath)) {
  const reason = !base
    ? "Set CHAMPA_WEB_BASE to a disposable Champa web instance."
    : "Playwright is not installed; no browser runner is configured in this repository.";
  console.log(`browser evidence: ${writeArtifact("browser-evidence.json", {
    generated_at: new Date().toISOString(),
    ...statusRow(requireRunner ? "blocked" : "not-run", reason),
    feature_ids: manifest.features.map((feature) => feature.id),
    authenticated_srn_visual_verification: false,
  })}`);
  process.exitCode = requireRunner ? 2 : 0;
} else {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const captures = [];
  try {
    for (const feature of manifest.features) {
      for (const route of feature.current_champa?.routes ?? []) {
        for (const [name, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
          const page = await browser.newPage({ viewport });
          const url = `${base}${route}`;
          try {
            const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
            const filename = `${feature.id.toLowerCase()}-${name}-${route.replace(/[^a-z0-9]+/gi, "-") || "home"}.png`;
            await page.screenshot({ path: resolve(artifactDirectory, filename), fullPage: true });
            captures.push({ feature_id: feature.id, route, viewport: name, url, http_status: response?.status() ?? null, file: filename, status: "captured" });
          } catch (error) {
            captures.push({ feature_id: feature.id, route, viewport: name, url, ...statusRow("blocked", error.message) });
          } finally {
            await page.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  const failures = captures.filter((capture) => capture.status !== "captured");
  console.log(`browser evidence: ${writeArtifact("browser-evidence.json", { generated_at: new Date().toISOString(), base, authenticated_srn_visual_verification: false, status: failures.length ? "fail" : "pass", captures })}`);
  process.exitCode = failures.length ? 1 : 0;
}
