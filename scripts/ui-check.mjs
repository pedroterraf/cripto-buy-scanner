import { chromium } from "playwright";

const BASE = process.env.UI_URL || "http://localhost:3000";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, touch: false, mobile: false },
  { name: "ipad", width: 768, height: 1024, touch: true, mobile: false },
  { name: "mobile", width: 390, height: 844, touch: true, mobile: true },
];

function fail(viewport, message) {
  throw new Error(viewport + ": " + message);
}

async function runViewport(browser, viewport) {
  const errors = [];
  const failed = [];
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.touch,
    isMobile: viewport.mobile,
    locale: "es-AR",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const chartOpen = page.getByRole("button", { name: /abrir gráfico semanal/ });
  await chartOpen.first().waitFor({ timeout: 25000 });
  await page.getByRole("button", { name: "Escanear" }).waitFor();
  await page.getByRole("button", { name: "Ordenar espera cerca de compra" }).waitFor();
  await page.getByRole("button", { name: "Ordenar espera cerca de venta" }).click();
  await page.getByRole("button", { name: "Ordenar espera cerca de compra" }).click();

  const info = page.getByRole("button", { name: "AVAX, abrir fundamentos" });
  const infoBox = await info.boundingBox();
  if (!infoBox || infoBox.width < 44 || infoBox.height < 44) {
    fail(viewport.name, "info button smaller than 44px");
  }

  const keyboard = await page.evaluate(() => {
    const scan = document.querySelector(".scan");
    const infoBtn = document.querySelector(".dossier-btn");
    const floor = window.innerHeight - 300;
    const scanBox = scan?.getBoundingClientRect();
    const infoRect = infoBtn?.getBoundingClientRect();
    return {
      scanAbove: scanBox ? scanBox.bottom < floor : true,
      infoAbove: infoRect ? infoRect.bottom < floor : true,
    };
  });
  if (viewport.touch && (!keyboard.scanAbove || !keyboard.infoAbove)) {
    fail(viewport.name, "scan or info buried under simulated keyboard");
  }

  await page.screenshot({
    path: `scripts/shots/${viewport.name}-list.png`,
    scale: "css",
  });

  await info.click();
  await page.getByRole("heading", { name: "AVAX", exact: true }).waitFor({ timeout: 8000 });
  if (await page.getByTestId("chart-host").count()) {
    fail(viewport.name, "info button opened the chart");
  }
  if (await page.getByRole("heading", { name: "Por qué existe esto" }).count()) {
    fail(viewport.name, "token info opened the generic guide");
  }
  await page.getByText(/L1 de subnets/).waitFor();
  await page.getByText(/Veredicto/).waitFor();
  const back = page.getByRole("button", { name: "Volver a zonas" });
  const backBox = await back.boundingBox();
  if (!backBox || backBox.height < 44) {
    fail(viewport.name, "back button too small");
  }
  if (viewport.touch && backBox.bottom > viewport.height - 300) {
    fail(viewport.name, "back button under simulated keyboard");
  }
  await page.screenshot({
    path: `scripts/shots/${viewport.name}-dossier.png`,
    scale: "css",
  });

  await back.click();
  await page.getByRole("heading", { name: "Zonas de compra" }).waitFor({ timeout: 8000 });

  await page.getByRole("button", { name: /ADA, .*abrir gráfico semanal/ }).click();
  await page.getByTestId("chart-host").waitFor({ timeout: 15000 });
  await page.getByText(/Cruce/).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);

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
    fail(
      viewport.name,
      "chart too small host=" + metrics.hostH + " canvas=" + metrics.canvasH,
    );
  }

  await page.getByRole("button", { name: "Daily" }).click();
  await page.getByRole("heading", { name: /USDT · 1D/ }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Weekly" }).click();
  await page.getByRole("heading", { name: /USDT · 1W/ }).waitFor({ timeout: 10000 });

  if (viewport.touch && !metrics.closeAboveKeyboard) {
    fail(viewport.name, "Cerrar queda bajo el teclado simulado");
  }
  if (viewport.touch) {
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
    await page.getByRole("heading", { name: "Zonas de compra" }).waitFor();
  }

  await page.getByRole("button", { name: "Proyectos", exact: true }).click();
  await page.getByRole("heading", { name: "Proyectos" }).waitFor();
  const grid = page.locator(".project-grid");
  await grid.waitFor();
  const pickCount = await page.getByRole("button", { name: /abrir ficha$/ }).count();
  if (pickCount !== 16) {
    fail(viewport.name, "project grid should list 16 tokens, got " + pickCount);
  }
  if (await page.getByRole("heading", { name: "Por qué existe esto" }).count()) {
    fail(viewport.name, "project tab showed the guide instead of the grid");
  }
  const gridBox = await grid.boundingBox();
  if (viewport.name === "desktop" && (!gridBox || gridBox.width < 900)) {
    fail(viewport.name, "project grid not using the desktop width");
  }
  await page.screenshot({
    path: `scripts/shots/${viewport.name}-projects.png`,
    scale: "css",
  });

  await page.getByRole("button", { name: /ASTER, .*abrir ficha/ }).click();
  await page.getByText(/17 sep 2027/).first().waitFor();
  await page.getByRole("button", { name: "Volver a proyectos" }).click();
  await page.getByRole("heading", { name: "Proyectos" }).waitFor();

  await page.getByRole("button", { name: /HBAR, .*abrir ficha/ }).click();
  await page.getByText(/Máximo fijo 50 B/).waitFor();
  await page.getByRole("button", { name: "Volver a proyectos" }).click();
  await page.getByRole("heading", { name: "Proyectos" }).waitFor();

  await page.getByRole("button", { name: /JUP, .*abrir ficha/ }).click();
  await page.getByText(/Net-Zero Emissions/).waitFor();
  await page.getByRole("button", { name: "Volver a proyectos" }).click();
  await page.getByRole("heading", { name: "Proyectos" }).waitFor();

  await page.getByRole("button", { name: /ONDO, .*abrir ficha/ }).click();
  await page.getByText(/18 ene 2027/).first().waitFor();
  await page.getByRole("button", { name: "Volver a proyectos" }).click();
  await page.getByRole("heading", { name: "Proyectos" }).waitFor();

  await page.getByRole("button", { name: /^AR, .*abrir ficha$/ }).click();
  await page.getByText(/Máximo 66 M/).waitFor();
  await page.getByRole("button", { name: "Volver a proyectos" }).click();
  await page.getByRole("heading", { name: "Proyectos" }).waitFor();

  await page.getByRole("button", { name: "Reglas", exact: true }).click();
  await page.getByRole("heading", { name: "Por qué existe esto" }).waitFor();
  await page.getByRole("heading", { name: "Conclusión" }).waitFor();
  await page.screenshot({
    path: `scripts/shots/${viewport.name}-tesis.png`,
    scale: "css",
  });
  await page.getByRole("button", { name: "Volver a proyectos" }).click();
  await page.getByRole("heading", { name: "Proyectos" }).waitFor();

  await page.getByRole("button", { name: "Zonas", exact: true }).click();
  await page.getByRole("heading", { name: "Zonas de compra" }).waitFor();

  const noisy = errors.filter(
    (text) => !/Failed to load resource|net::ERR/i.test(text),
  );
  if (noisy.length) failed.push(...noisy);

  await context.close();
  if (failed.length) fail(viewport.name, failed.join(" | "));
  return { viewport: viewport.name, ...metrics, infoW: Math.round(infoBox.width) };
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
