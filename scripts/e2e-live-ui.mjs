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

  // Test the exact narrow desktop/tablet range where users reported clipped selectors.
  await page.setViewportSize({ width: 936, height: 900 });
  await page.waitForTimeout(200);
  const compactDesktopWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  await assert(compactDesktopWidth.document <= compactDesktopWidth.viewport + 1,
    "Compact desktop layout overflows horizontally: document width " + compactDesktopWidth.document +
    "px exceeds viewport " + compactDesktopWidth.viewport + "px.");
  const compactDesktopSelectBounds = await page.locator(".anchor-row select").first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: window.innerWidth };
  });
  await assert(compactDesktopSelectBounds.right <= compactDesktopSelectBounds.viewport + 1,
    "A taste-anchor category selector is clipped at 936px: " + JSON.stringify(compactDesktopSelectBounds));

  // Narrow-tablet / browser-zoom layouts are important: category selectors
  // must not be pushed outside the visible card when the layout collapses.
  await page.setViewportSize({ width: 749, height: 900 });
  await page.waitForTimeout(250);
  const tabletWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  await assert(tabletWidth.document <= tabletWidth.viewport + 1,
    "Narrow tablet layout overflows horizontally: document width " + tabletWidth.document +
    "px exceeds viewport " + tabletWidth.viewport + "px.");
  const tabletSelectBounds = await page.locator(".anchor-row select").first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: window.innerWidth };
  });
  await assert(tabletSelectBounds.right <= tabletSelectBounds.viewport + 1,
    "A taste-anchor category selector is clipped at a narrow tablet width: " + JSON.stringify(tabletSelectBounds));

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
  await page.getByRole("textbox", { name: "Taste anchor 1" }).fill("Tyler, the Creator");
  await page.getByRole("textbox", { name: "Taste anchor 2" }).fill("Aesop");
  await page.getByRole("textbox", { name: "Taste anchor 3" }).fill("Spirited Away");
  await page.locator("#location").fill("New York City");
  await page.locator("#task").fill("Check an agent's place recommendations for New York City.");
  await page.getByRole("textbox", { name: "Recommendation candidate 1" }).fill("One Times Square");
  await page.getByRole("textbox", { name: "Recommendation candidate 2" }).fill("Brooklyn Bridge");
  await page.getByRole("textbox", { name: "Recommendation candidate 3" }).fill("Mood Fabrics");

  // Exercise the user-facing disambiguation path: search Qloo and explicitly
  // select the canonical entity ID instead of relying only on exact-name lookup.
  await page.getByRole("button", { name: "Find Qloo matches for taste anchor 1" }).click();
  const exactAnchorMatch = page.locator(".entity-match-option").filter({ hasText: "Tyler, the Creator" }).first();
  await exactAnchorMatch.waitFor({ state: "visible", timeout: 30000 });
  await exactAnchorMatch.click();
  await page.locator(".selected-entity-note").first().waitFor({ state: "visible", timeout: 5000 });

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
  await page.getByRole("textbox", { name: "Taste anchor 3" }).fill("Frank Ocean");
  await page.getByLabel("Category for taste anchor 3").selectOption("artist");
  await page.getByRole("button", { name: /Rerun taste test/ }).click();
  await page.locator(".comparison-section").waitFor({ state: "visible", timeout: 90000 });
  const controlledSwap = page.locator(".anchor-change-report.controlled");
  await controlledSwap.waitFor({ state: "visible", timeout: 10000 });
  const swapText = await controlledSwap.innerText();
  await assert(swapText.includes("One taste variable changed"),
    "The UI did not recognize the one-anchor controlled experiment.");
  await assert(await page.locator(".comparison-row").count() === 3,
    "The Anchor Swap comparison did not include all submitted candidates.");

  // Recheck the compact desktop layout with the live receipt and comparison visible.
  await page.setViewportSize({ width: 936, height: 900 });
  const compactDesktopResultsWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  await assert(compactDesktopResultsWidth.document <= compactDesktopResultsWidth.viewport + 1,
    "Compact desktop results overflow horizontally: document width " + compactDesktopResultsWidth.document +
    "px exceeds viewport " + compactDesktopResultsWidth.viewport + "px.");
  const compactDesktopResultsSelectBounds = await page.locator(".anchor-row select").first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: window.innerWidth };
  });
  await assert(compactDesktopResultsSelectBounds.right <= compactDesktopResultsSelectBounds.viewport + 1,
    "A taste-anchor category selector is clipped at 936px with results visible: " + JSON.stringify(compactDesktopResultsSelectBounds));

  // Recheck a narrow tablet/browser-zoom layout with the real results and
  // controlled comparison present, including anchor category selector bounds.
  await page.setViewportSize({ width: 749, height: 900 });
  const tabletResultsWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  await assert(tabletResultsWidth.document <= tabletResultsWidth.viewport + 1,
    "Narrow tablet results view overflows horizontally: document width " + tabletResultsWidth.document +
    "px exceeds viewport " + tabletResultsWidth.viewport + "px.");
  const tabletResultsSelectBounds = await page.locator(".anchor-row select").first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: window.innerWidth };
  });
  await assert(tabletResultsSelectBounds.right <= tabletResultsSelectBounds.viewport + 1,
    "A taste-anchor category selector is clipped in the populated narrow tablet view: " + JSON.stringify(tabletResultsSelectBounds));

  // Recheck responsive layout with the evidence receipt and comparison present.
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileResultsWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  await assert(mobileResultsWidth.document <= mobileResultsWidth.viewport + 1,
    "The mobile results view overflows horizontally: document width " + mobileResultsWidth.document +
    "px exceeds viewport " + mobileResultsWidth.viewport + "px.");
  await page.setViewportSize({ width: 1440, height: 1000 });

  await assert(pageErrors.length === 0,
    "Browser runtime errors occurred: " + pageErrors.join(" | "));

  console.log("TASTEPROOF_BROWSER_E2E=" + JSON.stringify({
    verified: true,
    browser: "Chromium",
    qlooKeyConfigured: true,
    firstReceipt,
    baselineSummary: firstBaseline,
    explicitQlooEntitySelection: true,
    candidateRows: firstRows,
    anchorSwapControlled: true,
    comparisonRows: await page.locator(".comparison-row").count(),
    compactDesktopViewport: compactDesktopWidth,
    compactDesktopSelectBounds,
    compactDesktopResultsViewport: compactDesktopResultsWidth,
    compactDesktopResultsSelectBounds,
    tabletViewport: tabletWidth,
    tabletSelectBounds,
    tabletResultsViewport: tabletResultsWidth,
    tabletResultsSelectBounds,
    mobileViewport: mobileWidth,
    mobileResultsViewport: mobileResultsWidth,
    pageErrors: pageErrors.length
  }));
} finally {
  await browser.close();
}
