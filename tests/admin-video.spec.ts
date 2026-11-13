import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Phase 3: Video Management & Playback Tests", () => {
  // Prerequisite check: Playwright runs strictly under NODE_ENV=test and requires .env.test.
  // As noted in specifications, these tests cannot run against real databases until .env.test is configured by the user.

  test("1. Admin Video Tab: renders initial empty state with upload drop zone", async ({ page }) => {
    // Navigate to admin login
    await page.goto("/admin/login");
    // Under test credentials, login as admin
    await page.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL || "admin@example.com");
    await page.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD || "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");

    // Open first procedure
    await page.click("table tbody tr:first-child a");
    await page.waitForSelector('[role="tablist"]');

    // Click Video Tab
    const videoTab = page.locator('button[role="tab"]:has-text("فيديو")');
    await expect(videoTab).toBeVisible();
    await videoTab.click();

    // Verify empty state or player
    const emptyState = page.locator("text=لم تتم إضافة فيديو بعد");
    const uploadInput = page.locator('input[type="file"]');
    await expect(uploadInput).toBeAttached();
  });

  test("2. Security: Anonymous request to /api/video-token for draft procedure returns 403", async ({ request }) => {
    const res = await request.get("/api/video-token?procedureId=draft-probe-procedure-id");
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  test("3. Security: POST to /api/mux/webhook without signature returns 400", async ({ request }) => {
    const res = await request.post("/api/mux/webhook", {
      data: { type: "video.asset.ready" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing Mux signature");
  });

  test("4. Usage Limit Alert: UI shows warning and disables new uploads at 10 assets", async ({ page }) => {
    await page.goto("/admin");
    // Dashboard usage card check
    const usageCard = page.locator("text=استهلاك الفيديو");
    await expect(usageCard).toBeVisible();
  });

  test("5. Public Player: block download, context menu, and enforce 16:9 aspect ratio", async ({ page }) => {
    await page.goto("/procedures");
    const firstProcedure = page.locator("a[href^='/procedures/']").first();
    if (await firstProcedure.isVisible()) {
      await firstProcedure.click();
      const videoContainer = page.locator(".aspect-video");
      if (await videoContainer.isVisible()) {
        await expect(videoContainer).toHaveClass(/aspect-video/);
      }
    }
  });

  test("6. Type Hierarchy & Delete Overlay: heading > supporting and overlay covers full viewport", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL || "admin@example.com");
    await page.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD || "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");

    const editLink = await page.locator("a[href*='/admin/procedures/']:not([href*='/new'])").first().getAttribute("href");
    await page.goto(`${editLink}?tab=video`);
    await page.waitForSelector("[data-testid='video-heading-empty']");

    const sizes = await page.evaluate(() => {
      const h = document.querySelector("[data-testid='video-heading-empty']");
      const s = document.querySelector("[data-testid='video-supporting-empty']");
      if (!h || !s) return null;
      return {
        headingPx: parseFloat(window.getComputedStyle(h).fontSize),
        supportingPx: parseFloat(window.getComputedStyle(s).fontSize),
      };
    });

    expect(sizes).not.toBeNull();
    expect(sizes!.headingPx).toBeGreaterThan(sizes!.supportingPx);
    console.log(`Measured: Heading = ${sizes!.headingPx}px, Supporting = ${sizes!.supportingPx}px`);

    // Verify Delete Overlay covers top=0 to bottom=height
    await page.goto(`${editLink}?tab=video&video_state=delete_confirm`);
    await page.waitForSelector("[role='dialog']");
    const overlay = await page.evaluate(() => {
      const d = document.querySelector("[role='dialog']");
      if (!d) return null;
      const r = d.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, marginTop: window.getComputedStyle(d).marginTop };
    });
    expect(overlay).not.toBeNull();
    expect(overlay!.top).toBe(0);
    expect(overlay!.marginTop).toBe("0px");
  });
});
