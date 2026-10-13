import { chromium } from "playwright";

const baseUrl = process.env.TASTEPROOF_E2E_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await assert(response?.ok(), "The TasteProof home page did not load successfully.");

  const healthResponse = await page.request.get(baseUrl + "/api/health");
  const health = await healthResponse.json();
  await assert(healthResponse.ok() && health.qlooKeyConfigured === true,
    "The running production server does not report the Qloo key as configured.");

  // Capture a real mobile render before entering test data, and fail on
  // horizontal overflow that would make the product awkward on phones.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "public/tasteproof-mobile-preview.png", fullPage: true });
  const mobileWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  await assert(mobileWidth.document <= mobileWidth.viewport + 1,
    "Mobile layout overflows horizontally: document width " + mobileWidth.document +
    "px exceeds viewport " + mobileWidth.viewport + "px.");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("Taste anchor 1").fill("Tyler, the Creator");
  await page.getByLabel("Taste anchor 2").fill("Aesop");
  await page.getByLabel("Taste anchor 3").fill("Spirited Away");
  await page.locator("#location").fill("New York City");
  await page.locator("#task").fill("Check an agent's place recommendations for New York City.");
  await page.getByLabel("Recommendation candidate 1").fill("One Times Square");
  await page.getByLabel("Recommendation candidate 2").fill("Brooklyn Bridge");
  await page.getByLabel("Recommendation candidate 3").fill("Mood Fabrics");

  await page.getByRole("button", { name: /Run taste test/ }).click();
  await page.locator(".receipt-title h3").waitFor({ state: "visible", timeout: 90000 });
  const firstReceipt = await page.locator(".receipt-title h3").innerText();
  const firstBaseline = await page.locator(".baseline-disclosure summary").innerText();
  const firstRows = await page.locator(".result-row").count();
  await assert(firstRows === 3, "The live evaluation did not render all three submitted candidates.");
  await assert(firstBaseline.includes("20 entities") || firstBaseline.includes("entities"),
    "The evidence receipt did not expose the actual Qloo baseline.");
  const rankedCount = Number.parseInt(firstReceipt.match(/^(\d+)/)?.[1] ?? "0", 10);
  await assert(rankedCount >= 1,
    "The first live evaluation produced no ranked candidates: " + firstReceipt);

  // Change exactly one anchor and submit through the real browser UI again.
  await page.getByLabel("Taste anchor 3").fill("Frank Ocean");
  await page.getByRole("button", { name: /Rerun taste test/ }).click();
  await page.locator(".comparison-section").waitFor({ state: "visible", timeout: 90000 });
  const controlledSwap = page.locator(".anchor-change-report.controlled");
  await controlledSwap.waitFor({ state: "visible", timeout: 10000 });
  const swapText = await controlledSwap.innerText();
  await assert(swapText.includes("One taste variable changed"),
    "The UI did not recognize the one-anchor controlled experiment.");
  await assert(await page.locator(".comparison-row").count() === 3,
    "The Anchor Swap comparison did not include all submitted candidates.");
  await assert(pageErrors.length === 0,
    "Browser runtime errors occurred: " + pageErrors.join(" | "));

  console.log("TASTEPROOF_BROWSER_E2E=" + JSON.stringify({
    verified: true,
    browser: "Chromium",
    qlooKeyConfigured: true,
    firstReceipt,
    baselineSummary: firstBaseline,
    candidateRows: firstRows,
    anchorSwapControlled: true,
    comparisonRows: await page.locator(".comparison-row").count(),
    mobileViewport: mobileWidth,
    pageErrors: pageErrors.length
  }));
} finally {
  await browser.close();
}
