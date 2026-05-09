import { test, expect, type Page } from "@playwright/test";

/** Same gate pattern as other learning e2e — Math route requires a student session. */
async function mockStudentSession(page: Page) {
  await page.route("**/api/student/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        student: {
          id: "00000000-0000-0000-0000-0000000000e2",
          full_name: "e2e-math-visibility",
          grade_level: 3,
          is_active: true,
          coin_balance: 0,
        },
      }),
    });
  });
}

/**
 * Math UI smoke — operation dropdown must match closure policy (no blocked topics per grade).
 */
test.describe("Math topic visibility", () => {
  test.beforeEach(async ({ page }) => {
    await mockStudentSession(page);
  });

  test("grade 2 never lists divisibility", async ({ page }) => {
    await page.goto("/learning/math-master");
    await page.getByTestId("math-grade-select").selectOption("2");
    const values = await page.getByTestId("math-operation-select").locator("option").evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value)
    );
    expect(values).not.toContain("divisibility");
  });

  test("grade 1 never lists decimals or equations", async ({ page }) => {
    await page.goto("/learning/math-master");
    await page.getByTestId("math-grade-select").selectOption("1");
    const values = await page.getByTestId("math-operation-select").locator("option").evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value)
    );
    expect(values).not.toContain("decimals");
    expect(values).not.toContain("equations");
  });

  test("grade 3 never lists equations as standalone topic", async ({ page }) => {
    await page.goto("/learning/math-master");
    await page.getByTestId("math-grade-select").selectOption("3");
    const values = await page.getByTestId("math-operation-select").locator("option").evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value)
    );
    expect(values).not.toContain("equations");
  });
});
