import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.UI_URL || "http://localhost:3000";
const TICKERS = [
  "ADA",
  "RAY",
  "ARB",
  "TAO",
  "HBAR",
  "ASTER",
  "AAVE",
  "ONDO",
  "UNI",
  "ENA",
  "JUP",
  "AVAX",
  "LINK",
  "RON",
  "LINEA",
];

function inspectChart() {
  const panel = document.querySelector("[data-testid='chart-panel']");
  const host = document.querySelector("[data-testid='chart-host']");
  const canvases = [...(host?.querySelectorAll("canvas") ?? [])];
  const loading = document.querySelector(".chart-loading");
  const error = document.querySelector(".chart-error");
  const title = document.getElementById("sheetTitle")?.textContent ?? "";
  const weeklyChip = [...document.querySelectorAll(".ta-chip")].at(-1)?.textContent ?? "";
  const dailyChip = document.querySelector(".ta-chip")?.textContent ?? "";
  const weeklyPressed = document.querySelector('.tf-switch button[aria-pressed="true"]')?.textContent ?? "";
  const card = document.querySelector(".card.open .spot");
  const cardSpot = card?.textContent?.replace(/\./g, "").replace(",", ".") ?? "";
  return {
    title,
    weeklyPressed: weeklyPressed.trim(),
    hostTicker: host?.getAttribute("data-ticker") ?? "",
    hostClose: Number(host?.getAttribute("data-close") ?? ""),
    cardSpot: Number(cardSpot),
    hostW: host?.clientWidth ?? 0,
    hostH: host?.clientHeight ?? 0,
    canvasCount: canvases.length,
    canvasW: canvases[0]?.clientWidth ?? 0,
    canvasH: canvases[0]?.clientHeight ?? 0,
    loading: Boolean(loading),
    error: error?.textContent ?? null,
    weeklyChip: weeklyChip.replace(/\s+/g, " ").trim(),
    dailyChip: dailyChip.replace(/\s+/g, " ").trim(),
    panel: Boolean(panel),
  };
}

async function waitChart(page, ticker) {
  await page.getByTestId("chart-host").waitFor({ timeout: 20000 });
  await page.waitForFunction(
    (expected) => {
      const host = document.querySelector("[data-testid='chart-host']");
      const canvas = host?.querySelector("canvas");
      const loading = document.querySelector(".chart-loading");
      return (
        host?.getAttribute("data-ticker") === expected &&
        Boolean(canvas) &&
        (canvas?.clientHeight ?? 0) > 80 &&
        !loading
      );
    },
    ticker,
    { timeout: 25000 },
  );
  await page.waitForTimeout(500);
}

async function main() {
  mkdirSync("scripts/shots/charts", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-AR",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /ADA, abrir gráfico/ }).waitFor({ timeout: 25000 });

  const findings = [];

  for (const ticker of TICKERS) {
    await page.getByRole("button", { name: new RegExp(`^${ticker}, abrir gráfico`) }).click();
    for (const tf of ["Weekly", "Daily"]) {
      await page.getByRole("button", { name: tf, exact: true }).click();
      const expected = tf === "Weekly" ? "1W" : "1D";
      try {
        await page.getByRole("heading", { name: new RegExp(`${ticker} USDT · ${expected}`) }).waitFor({
          timeout: 12000,
        });
        await waitChart(page, ticker);
      } catch (error) {
        findings.push({
          ticker,
          tf,
          ok: false,
          issue: String(error).slice(0, 240),
        });
        continue;
      }

      const metrics = await page.evaluate(inspectChart);
      const shot = `scripts/shots/charts/${ticker}-${tf.toLowerCase()}.png`;
      await page.locator("[data-testid='chart-host']").screenshot({ path: shot });

      const issues = [];
      if (!metrics.title.includes(`${ticker} USDT · ${expected}`)) {
        issues.push(`title=${metrics.title}`);
      }
      if (metrics.hostTicker !== ticker) issues.push(`hostTicker=${metrics.hostTicker}`);
      if (metrics.cardSpot > 0 && metrics.hostClose > 0) {
        const ratio = metrics.hostClose / metrics.cardSpot;
        if (ratio < 0.5 || ratio > 2) {
          issues.push(`close mismatch ${metrics.hostClose} vs card ${metrics.cardSpot}`);
        }
      }
      if (metrics.canvasW < 200 || metrics.canvasH < 160) {
        issues.push(`small canvas ${metrics.canvasW}x${metrics.canvasH}`);
      }
      if (metrics.loading) issues.push("loading stuck");
      if (metrics.error) issues.push(`error=${metrics.error}`);
      if (metrics.weeklyChip.includes("…") || metrics.dailyChip.includes("…")) {
        issues.push("chip still loading");
      }
      if (tf === "Weekly" && metrics.weeklyPressed !== "Weekly") {
        issues.push(`pressed=${metrics.weeklyPressed}`);
      }
      if (tf === "Daily" && metrics.weeklyPressed !== "Daily") {
        issues.push(`pressed=${metrics.weeklyPressed}`);
      }

      findings.push({ ticker, tf, ok: issues.length === 0, issues, metrics, shot });
    }
  }

  const leftoverConsole = consoleErrors.filter(
    (text) => !/Download the React DevTools/i.test(text),
  );

  await browser.close();
  console.log(
    JSON.stringify(
      {
        pageErrors,
        leftoverConsole: leftoverConsole.slice(0, 40),
        bad: findings.filter((row) => row.ok === false || (row.issues && row.issues.length)),
        all: findings,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
