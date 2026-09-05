import { expect, test, type Page } from "@playwright/test";

const openingArtworkSequence = [
  "/assets/storybook-celebration-preparations.webp",
  "/assets/storybook-scattered-stars.webp",
  "/assets/storybook-rosie-stella-departure.webp",
] as const;

async function expectOpeningArtworkSequence(page: Page): Promise<void> {
  const visibleArtwork = page.locator(".storybook__art.is-visible");
  await expect(visibleArtwork).toHaveAttribute("src", "/assets/storybook-key-art.png");

  for (const [index, artwork] of openingArtworkSequence.entries()) {
    const buttonName = index === 0 ? "Begin the story" : "Turn the page";
    await page.getByRole("button", { name: buttonName }).click();
    await expect(visibleArtwork).toHaveAttribute("src", artwork);
  }
}

test("each Opening Storybook Moment shows its own illustration", async ({ page }) => {
  await page.goto("/");

  await expectOpeningArtworkSequence(page);
});

test("the current illustration remains visible while the next one loads", async ({ page }) => {
  let releaseArtwork = (): void => {};
  const artworkCanLoad = new Promise<void>((resolve) => { releaseArtwork = resolve; });
  await page.route("**/storybook-celebration-preparations.webp", async (route) => {
    await artworkCanLoad;
    await route.continue();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Begin the story" }).click();
  await expect(page.getByText("Far across the sparkling Sapphire Sea")).toBeVisible();
  await expect(page.locator(".storybook__art.is-visible")).toHaveAttribute("src", "/assets/storybook-key-art.png");

  releaseArtwork();
  await expect(page.locator(".storybook__art.is-visible")).toHaveAttribute("src", openingArtworkSequence[0]);
});

test("a grown-up can read the story and Rosie can begin flying", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Princess Rosie and the Seven Birthday Stars" })).toBeVisible();
  await page.getByRole("button", { name: "Begin the story" }).click();
  await expect(page.getByText("Far across the sparkling Sapphire Sea")).toBeVisible();
  await expect(page.locator("#story-copy")).toContainText("very first birthday");
  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(page.getByText("a playful wind scattered seven Birthday Stars", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await expect(page.getByText("Princess Rosie climbed onto Stella", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();

  await expect(page.locator("#game canvas")).toBeVisible();
  await expect(page.getByLabel("0 of 7 Birthday Stars")).toBeVisible();
  await expect(page.getByText("Tap to jump · Hold to flutter")).toBeVisible();
  await page.keyboard.down("Space");
  await page.waitForTimeout(250);
  await page.keyboard.up("Space");
});

test("Princess Rosie and Stella gallop forward automatically along Storybook Ground in Rosalia's Rose Garden", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();

  await expect(page.locator("#game canvas")).toBeVisible();
  await expect(page.locator("#flight-hint")).toContainText("Tap to jump · Hold to flutter");

  // Initial state on Storybook Ground
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.() && window.__ROSIE_RUNNER__?.getState()?.isGrounded);
  }).toBe(true);

  const initial = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(initial?.mode).toBe("galloping");

  // Advances automatically
  await page.waitForTimeout(300);
  const advanced = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(advanced?.x).toBeGreaterThan(initial?.x ?? 0);
  expect(advanced?.isGrounded).toBe(true);
  expect(advanced?.mode).toBe("galloping");
});

test("Gallop and Flutter input: jump on tap, flutter-glide on hold, mid-air flap impulse, and landing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();

  await expect(page.locator("#game canvas")).toBeVisible();

  // Wait for runner scene to be active and grounded
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.() && window.__ROSIE_RUNNER__?.getState()?.isGrounded);
  }).toBe(true);

  // 1. Tapping Spacebar triggers an immediate jump
  await page.keyboard.press("Space");
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
    return s && !s.isGrounded && (s.mode === "jumping" || s.velocityY < 0);
  }).toBe(true);

  // 2. Sustaining Spacebar while airborne slows downward descent into a gentle flutter-glide
  await page.keyboard.down("Space");
  await expect.poll(async () => {
    return (await page.evaluate(() => window.__ROSIE_RUNNER__?.getState()))?.isFluttering;
  }, { timeout: 3000 }).toBe(true);
  const flutterState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(flutterState?.mode).toBe("fluttering");
  expect(flutterState?.velocityY).toBeLessThanOrEqual(90);
  await page.keyboard.up("Space");

  // 3. Tapping again while airborne provides an upward wing-flap impulse capped below ceiling
  await page.keyboard.press("Space");
  const flapState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(flapState?.mode).toBe("flapping");
  expect(flapState?.velocityY).toBeLessThan(0);
  expect(flapState?.y).toBeGreaterThanOrEqual(80);

  // 4. Landing on Storybook Ground immediately returns to galloping
  await expect.poll(async () => {
    return (await page.evaluate(() => window.__ROSIE_RUNNER__?.getState()))?.mode;
  }, { timeout: 5000 }).toBe("galloping");

  const landedState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(landedState?.isGrounded).toBe(true);
  expect(landedState?.velocityY).toBe(0);
});

test("navigating through the garden course to the end triggers place completion in domain state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();

  await expect(page.locator("#game canvas")).toBeVisible();

  // Verify real runtime forward progression along Storybook Ground
  const startX = (await page.evaluate(() => window.__ROSIE_RUNNER__?.getState()))?.x ?? 0;
  await page.waitForTimeout(300);
  const nextX = (await page.evaluate(() => window.__ROSIE_RUNNER__?.getState()))?.x ?? 0;
  expect(nextX).toBeGreaterThan(startX);

  // Reaching the course end triggers place completion
  await page.evaluate(() => {
    window.__ROSIE_RUNNER__?.seekToEnd();
  });

  // Reaching the end triggers place completion in domain state and displays Moment
  await expect(page.locator("#moment")).toBeVisible();
  await expect(page.locator("#moment-place")).toHaveText("Rosalia’s Rose Garden");
  await expect(page.locator("#moment-copy")).toContainText("Mom");

  const journey = await page.evaluate(() => window.__ROSIE_RUNNER__?.getJourney());
  expect(journey?.collectedStars).toContain("garden");
  expect(journey?.openRainbowPaths).toContain("garden");
  expect(journey?.acquiredStamps).toContain("garden");
});

test("multi-state Rosie and Stella sprite sheet animates gallop, leap, flutter, and stumble with seamless transitions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();

  await expect(page.locator("#game canvas")).toBeVisible();

  // 1. Verify multi-state sprite sheet is loaded and animations are registered
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.() && window.__ROSIE_RUNNER__?.hasSpriteSheet?.());
  }, { timeout: 4000 }).toBe(true);

  // 2. On Storybook Ground, gallop animation is active
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.getCurrentAnimation?.());
  }).toBe("rosie-stella-gallop");

  // 3. Tapping Spacebar transitions to leap animation
  await page.keyboard.press("Space");
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.getCurrentAnimation?.());
  }, { timeout: 3000 }).toBe("rosie-stella-leap");

  // 4. Holding Spacebar while airborne transitions to flutter animation
  await page.keyboard.down("Space");
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.getCurrentAnimation?.());
  }, { timeout: 3000 }).toBe("rosie-stella-flutter");
  await page.keyboard.up("Space");

  // 5. Landing returns to gallop animation
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.getCurrentAnimation?.());
  }, { timeout: 3500 }).toBe("rosie-stella-gallop");

  // 6. Playful Stumble triggers stumble wobble animation and recovers to gallop
  await page.evaluate(() => {
    window.__ROSIE_RUNNER__?.triggerStumble?.();
  });
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.getCurrentAnimation?.());
  }).toBe("rosie-stella-stumble");

  // Stumble recovers back to gallop
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.getCurrentAnimation?.());
  }, { timeout: 3000 }).toBe("rosie-stella-gallop");
});

test("the installable shell declares its name and icons", async ({ request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("Princess Rosie and the Seven Birthday Stars");
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

  await expect(page.getByRole("heading", { name: "Princess Rosie and the Seven Birthday Stars" })).toBeVisible();

  await expectOpeningArtworkSequence(page);
});

async function startStorybookFlight(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();
  await expect(page.locator("#game canvas")).toBeVisible();
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.());
  }, { timeout: 5000 }).toBe(true);
}

test("playful obstacles on Storybook Ground cause Playful Stumble with speed reduction, wobble, and smooth recovery without failure", async ({ page }) => {
  await startStorybookFlight(page);

  // 1. Verify place-appropriate playful obstacles are present
  const obstacles = await page.evaluate(() => window.__ROSIE_RUNNER__?.getObstacles?.());
  expect(obstacles).toBeDefined();
  expect(obstacles?.length).toBeGreaterThanOrEqual(2);
  expect(obstacles?.[0]?.type).toBe("rose-bush");

  const firstObstacle = obstacles?.[0];
  if (!firstObstacle) throw new Error("Missing first obstacle");

  // 2. Allow Stella to gallop automatically into the first obstacle on Storybook Ground without jumping
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return s?.stumbledObstacles?.includes(firstObstacle.id);
  }, { timeout: 12000 }).toBe(true);

  // 3. Verify stumble state: no failure, damage, or restart states occurred
  const stumbleState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
  expect(stumbleState?.stumbledObstacles).toContain(firstObstacle.id);
  expect(stumbleState?.courseCompleted).toBe(false);

  // 4. Verify smooth recovery back to normal galloping speed
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return s?.mode === "galloping" && s?.stumbleRemaining === 0;
  }, { timeout: 12000 }).toBe(true);
});

test("leaping cleanly over an obstacle within proximity triggers Near Miss", async ({ page }) => {
  await startStorybookFlight(page);

  const obstacles = await page.evaluate(() => window.__ROSIE_RUNNER__?.getObstacles?.());
  const firstObstacle = obstacles?.[0];
  if (!firstObstacle) throw new Error("Missing first obstacle");

  // Wait until Stella approaches the leap approach zone
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return (s?.x ?? 0) >= firstObstacle.x - 140;
  }, { intervals: [30], timeout: 12000 }).toBe(true);

  // Leap cleanly over the obstacle
  await page.keyboard.press("Space");
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return s && !s.isGrounded;
  }, { timeout: 1000 }).toBe(true);

  // Verify Near Miss triggered cleanly
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return s?.nearMissObstacles?.includes(firstObstacle.id);
  }, { timeout: 12000 }).toBe(true);

  const afterState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
  expect(afterState?.nearMissObstacles).toContain(firstObstacle.id);
  expect(afterState?.stumbledObstacles).not.toContain(firstObstacle.id);
});

test("themed springboards appear on Storybook Ground and catapult Stella into the upper 60% of the Stage", async ({ page }) => {
  await startStorybookFlight(page);

  // 1. Verify themed springboard elements on Storybook Ground
  const springboards = await page.evaluate(() => window.__ROSIE_RUNNER__?.getSpringboards?.());
  expect(springboards).toBeDefined();
  expect(springboards?.length).toBeGreaterThanOrEqual(2);

  const firstSpringboard = springboards?.[0];
  if (!firstSpringboard) throw new Error("Missing first springboard");

  expect(firstSpringboard.place).toBe("garden");
  expect(firstSpringboard.type).toBe("giant-rose");
  expect(firstSpringboard.y).toBe(560);

  // 2. Allow Stella to gallop into the springboard
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return s?.bouncedSpringboards?.includes(firstSpringboard.id);
  }, { timeout: 10000 }).toBe(true);

  // 3. Verify catapult launch into upper 60% of stage (720 * 0.6 = 432)
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return (s?.y ?? 720) <= 432;
  }, { timeout: 4000 }).toBe(true);
});

test("collecting sequential Star Sparkles in an arc advances pentatonic melody streak and fills corner constellation meter with warm light", async ({ page }) => {
  await startStorybookFlight(page);

  // 1. Verify Star Sparkles are configured across the sky corridor
  const sparkles = await page.evaluate(() => window.__ROSIE_RUNNER__?.getSparkles?.());
  expect(sparkles).toBeDefined();
  expect(sparkles?.length).toBeGreaterThanOrEqual(5);

  const meter = page.locator("#constellation-meter");
  await expect(meter).toBeVisible();
  await expect(meter).toHaveAttribute("data-sparkles", "0");
  await expect(meter).not.toHaveClass(/has-light/);

  // 2. Stella launches from springboard into celestial Star Sparkles arc
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.getCollectedSparklesCount?.() ?? 0);
  }, { timeout: 12000 }).toBeGreaterThanOrEqual(2);

  // 3. Verify melodic sequential streak was achieved during celestial flight
  const streak = await page.evaluate(() => {
    const runner = window.__ROSIE_RUNNER__;
    return Math.max(runner?.getSparkleStreak?.() ?? 0, runner?.getMaxSparkleStreak?.() ?? 0);
  });
  expect(streak).toBeGreaterThanOrEqual(1);

  // 4. Verify constellation meter fills with warm light
  await expect(meter).toHaveClass(/has-light/);
  const sparklesCount = Number(await meter.getAttribute("data-sparkles"));
  expect(sparklesCount).toBeGreaterThanOrEqual(2);

  // Check that constellation stars light up with warm starlight
  const litStarsCount = await meter.locator(".constellation-node.is-lit").count();
  expect(litStarsCount).toBeGreaterThanOrEqual(2);
});

test("Family Guest Rainbow Archway arrival sequence pauses forward galloping, gathers Birthday Star, awards Storybook Stamp, and updates journey domain state", async ({ page }) => {
  await startStorybookFlight(page);

  // 1. Each place concludes at an authored Rainbow Archway with that place's Family Guest waving
  for (const stop of ["garden", "lacewood", "abbey", "clouds", "peak", "sea", "castle"] as const) {
    const arch = await page.evaluate((s) => window.__ROSIE_RUNNER__?.getArchway?.(s), stop);
    expect(arch).toBeDefined();
    expect(arch?.place).toBe(stop);
    expect(arch?.x).toBeGreaterThan(0);
    const waving = await page.evaluate((s) => window.__ROSIE_RUNNER__?.isGuestWaving?.(s), stop);
    expect(waving).toBe(true);
  }

  // 2. Stella arrives at the Rainbow Archway in Rosalia's Rose Garden
  await page.evaluate(() => {
    window.__ROSIE_RUNNER__?.seekToEnd();
  });

  // 3. Passing through the archway pauses forward galloping for the reunion moment
  const runnerState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(runnerState?.arrivedAtArchway).toBe(true);
  expect(runnerState?.pausedForReunion).toBe(true);
  expect(runnerState?.courseCompleted).toBe(true);

  // 4. The recovered Birthday Star is gathered and Family Guest awards their unique Storybook Stamp with celebratory visual presentation
  await expect(page.locator("#moment")).toBeVisible();
  await expect(page.locator("#moment-stamp")).toBeVisible();
  await expect(page.locator("#moment-stamp-title")).toHaveText("Mom’s Rose Stamp");
  await expect(page.locator("#moment-stamp-guest")).toContainText("Mom");
  await expect(page.locator("#moment-stamp-icon")).toHaveText("🌹");

  // 5. Journey domain state records both the gathered Birthday Star and the acquired Storybook Stamp
  let journey = await page.evaluate(() => window.__ROSIE_RUNNER__?.getJourney());
  expect(journey?.collectedStars).toContain("garden");
  expect(journey?.acquiredStamps).toContain("garden");

  let acquiredStamps = await page.evaluate(() => window.__ROSIE_RUNNER__?.getAcquiredStamps?.());
  expect(acquiredStamps).toContain("garden");

  // 6. Continue to the next place (Zélie's Lacewood) and verify Gram's Rainbow Archway and Storybook Stamp
  await page.locator("#moment-next").click();
  await expect(page.locator("#moment")).toBeHidden();

  await page.evaluate(() => {
    window.__ROSIE_RUNNER__?.seekToEnd();
  });

  await expect(page.locator("#moment")).toBeVisible();
  await expect(page.locator("#moment-stamp")).toBeVisible();
  await expect(page.locator("#moment-stamp-title")).toHaveText("Gram’s Lace Ribbon Stamp");
  await expect(page.locator("#moment-stamp-guest")).toContainText("Gram");
  await expect(page.locator("#moment-stamp-icon")).toHaveText("🎀");

  journey = await page.evaluate(() => window.__ROSIE_RUNNER__?.getJourney());
  expect(journey?.collectedStars).toEqual(["garden", "lacewood"]);
  expect(journey?.acquiredStamps).toEqual(["garden", "lacewood"]);

  acquiredStamps = await page.evaluate(() => window.__ROSIE_RUNNER__?.getAcquiredStamps?.());
  expect(acquiredStamps).toEqual(["garden", "lacewood"]);
});
