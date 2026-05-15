import { test, expect } from "@playwright/test";

test.describe("mleo-catcher smoke (browser)", () => {
  test("start, desktop keys, canvas size, pointer pads respond", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/mleo-catcher", { waitUntil: "networkidle" });

    const name = page.getByPlaceholder("מה השם שלכם?");
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
    await page.getByPlaceholder("מה השם שלכם?").fill("בדיקה2");
    await page.getByRole("button", { name: /התחלה/ }).click();
    await expect(page.locator("#game-wrapper canvas")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "יציאה" }).click();
    await expect(page).toHaveURL(/\/game/);
  });
});
