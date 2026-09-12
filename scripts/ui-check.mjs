import { chromium } from "playwright";

const BASE = process.env.UI_URL || "http://localhost:3000";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, touch: false, mobile: false },
  { name: "ipad", width: 768, height: 1024, touch: true, mobile: false },
  { name: "mobile", width: 390, height: 844, touch: true, mobile: true },
];

async function runViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.touch,
    isMobile: viewport.mobile,
    locale: "es-AR",
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /ADA, abrir gráfico semanal/ }).waitFor({
    timeout: 20000,
  });
  await page.screenshot({
    path: `scripts/shots/${viewport.name}-list.png`,
    scale: "css",
  });

  await page.getByRole("button", { name: /ADA, abrir gráfico semanal/ }).click();
  await page.getByTestId("chart-host").waitFor({ timeout: 15000 });
  await page.getByText(/Cruce/).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);

  const metrics = await page.evaluate(() => {
    const host = document.querySelector("[data-testid='chart-host']");
    const canvas = host?.querySelector("canvas");
    const close = document.querySelector(".close");
    const inner = window.innerHeight;
    const keyboardFloor = inner - 300;
    const closeBox = close?.getBoundingClientRect();
    return {
      hostH: host?.clientHeight ?? 0,
      canvasH: canvas?.clientHeight ?? 0,
      closeBottom: closeBox?.bottom ?? null,
      inner,
      keyboardFloor,
      closeAboveKeyboard: closeBox ? closeBox.bottom < keyboardFloor : true,
    };
  });

  await page.screenshot({
    path: `scripts/shots/${viewport.name}-chart.png`,
    scale: "css",
  });

  if (metrics.hostH < 200 || metrics.canvasH < 160) {
    throw new Error(
      `${viewport.name}: chart too small host=${metrics.hostH} canvas=${metrics.canvasH}`,
    );
  }

  await page.getByRole("button", { name: "Daily" }).click();
  await page.getByRole("heading", { name: /USDT · 1D/ }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(600);
  const dailyTitle = await page.getByRole("heading", { name: /USDT · 1D/ }).textContent();
  await page.screenshot({
    path: `scripts/shots/${viewport.name}-chart-daily.png`,
    scale: "css",
  });
  if (!dailyTitle?.includes("1D")) {
    throw new Error(`${viewport.name}: daily title missing`);
  }

  await page.getByRole("button", { name: "Weekly" }).click();
  await page.getByRole("heading", { name: /USDT · 1W/ }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);

  if (viewport.touch && !metrics.closeAboveKeyboard) {
    throw new Error(`${viewport.name}: Cerrar queda bajo el teclado simulado`);
  }

  if (viewport.touch) {
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  }

  await page.getByRole("button", { name: "Tesis" }).click();
  await page.getByRole("heading", { name: "Qué trata este proyecto" }).waitFor();
  await page.screenshot({
    path: `scripts/shots/${viewport.name}-tesis.png`,
    scale: "css",
  });
  await page.getByRole("button", { name: "Zonas" }).click();

  await context.close();
  return { viewport: viewport.name, ...metrics };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of VIEWPORTS) {
      results.push(await runViewport(browser, viewport));
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
