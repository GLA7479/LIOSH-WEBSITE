import { test, expect } from "@playwright/test";

test.describe("mleo-catcher smoke (desktop)", () => {
  test("start, desktop keys, canvas size, pointer pads respond", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/mleo-catcher", { waitUntil: "networkidle" });

    const name = page.getByPlaceholder(/מה השם/);
    await name.fill("בדיקה");
    const start = page.getByRole("button", { name: /התחלה/ });
    await expect(start).toBeEnabled();
    await start.click();

    const canvas = page.locator("#game-wrapper canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    const box = await canvas.boundingBox();
    expect(box, "canvas must have layout size").toBeTruthy();
    expect(box.width, "desktop canvas should not be tiny").toBeGreaterThan(280);
    expect(box.height).toBeGreaterThan(140);

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(80);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("KeyD");
    await page.keyboard.press("KeyA");

    const leftPad = page.getByRole("button", { name: "◀ שמאל" });
    await expect(leftPad).toBeVisible();
    await leftPad.dispatchEvent("pointerdown", { pointerId: 1, button: 0, bubbles: true });
    await leftPad.dispatchEvent("pointerup", { pointerId: 1, button: 0, bubbles: true });

    expect(errors, `page errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("exit navigates to /game", async ({ page }) => {
    await page.goto("/mleo-catcher", { waitUntil: "networkidle" });
    await page.getByPlaceholder(/מה השם/).fill("בדיקה2");
    await page.getByRole("button", { name: /התחלה/ }).click();
    await expect(page.locator("#game-wrapper canvas")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "יציאה" }).click();
    await expect(page).toHaveURL(/\/game/);
  });
});

test.describe("mleo-catcher mobile viewport (Chromium / iPhone emulation)", () => {
  /** iPhone-like layout without switching `defaultBrowserType` (avoids worker split vs Chromium project). */
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  });

  test("התחלה enabled with empty name; tap starts game", async ({ page }) => {
    await page.goto("/mleo-catcher", { waitUntil: "networkidle" });
    const input = page.getByPlaceholder(/מה השם/);
    await expect(input).toHaveValue("");
    const start = page.getByRole("button", { name: /התחלה/ });
    await expect(start).toBeEnabled();
    await start.click({ timeout: 15_000 });
    await expect(page.locator("#game-wrapper canvas")).toBeVisible({ timeout: 15_000 });
  });

  test("typed name, exit still works", async ({ page }) => {
    await page.goto("/mleo-catcher", { waitUntil: "networkidle" });
    await page.getByPlaceholder(/מה השם/).fill("מובייל");
    await page.getByRole("button", { name: /התחלה/ }).click();
    await expect(page.locator("#game-wrapper canvas")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "יציאה" }).click();
    await expect(page).toHaveURL(/\/game/);
  });
});

test.describe("mleo-catcher WebKit smoke", () => {
  test("empty name start (WebKit iPhone)", { tag: "@webkit-only" }, async ({ page }) => {
    await page.goto("/mleo-catcher", { waitUntil: "networkidle" });
    await expect(page.getByPlaceholder(/מה השם/)).toHaveValue("");
    const start = page.getByRole("button", { name: /התחלה/ });
    await expect(start).toBeEnabled();
    await start.click({ timeout: 15_000 });
    await expect(page.locator("#game-wrapper canvas")).toBeVisible({ timeout: 15_000 });
  });
});
