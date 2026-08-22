import { expect, test } from "@playwright/test";

test("each Opening Storybook Moment shows its own illustration", async ({ page }) => {
  await page.goto("/");

  const visibleArtwork = page.locator(".storybook__art.is-visible");
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-key-art.png");

  await page.getByRole("button", { name: "Begin the story" }).click();
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-celebration-preparations.webp");

  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-scattered-stars.webp");

  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-rosi-stella-departure.webp");
});

test("a grown-up can read the story and Rosi can begin flying", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Princess Rosi and the Seven Birthday Stars" })).toBeVisible();
  await page.getByRole("button", { name: "Begin the story" }).click();
  await expect(page.getByText("Far across the sparkling Sapphire Sea")).toBeVisible();
  await expect(page.locator("#story-copy")).toContainText("very first birthday");
  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(page.getByText("a playful wind scattered seven Birthday Stars", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(page.getByText("Princess Rosi climbed onto Stella", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Fly with Rosi" }).click();

  await expect(page.locator("#game canvas")).toBeVisible();
  await expect(page.getByLabel("0 of 7 Birthday Stars")).toBeVisible();
  await expect(page.getByText("Hold to rise · let go to glide")).toBeVisible();
  await page.keyboard.down("Space");
  await page.waitForTimeout(250);
  await page.keyboard.up("Space");
});

test("the installable shell declares its name and icons", async ({ request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("Princess Rosi and the Seven Birthday Stars");
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: "192x192" }),
    expect.objectContaining({ sizes: "512x512" }),
  ]));
});

test("the storybook reopens offline after its first visit", async ({ context, page }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole("heading", { name: "Princess Rosi and the Seven Birthday Stars" })).toBeVisible();

  const visibleArtwork = page.locator(".storybook__art.is-visible");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-celebration-preparations.webp");
  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-scattered-stars.webp");
  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-rosi-stella-departure.webp");
});
