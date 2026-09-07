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
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.());
  }, { timeout: 15_000 }).toBe(true);

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
  await expect(page.locator("#moment")).toBeVisible({ timeout: 10_000 });
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

  // 1. Verify wing puppet is loaded and ready
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.() && window.__ROSIE_RUNNER__?.hasPuppet?.());
  }, { timeout: 15_000 }).toBe(true);

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
  }, { timeout: 6000 }).toBe("rosie-stella-gallop");
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
  }, { timeout: 15_000 }).toBe(true);
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
  }, { timeout: 16000 }).toBe(true);

  // 3. Verify stumble state: no failure, damage, or restart states occurred
  const stumbleState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
  expect(stumbleState?.stumbledObstacles).toContain(firstObstacle.id);
  expect(stumbleState?.courseCompleted).toBe(false);

  // 4. Verify smooth recovery back to normal galloping speed
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    return s?.mode === "galloping" && s?.stumbleRemaining === 0;
  }, { timeout: 16000 }).toBe(true);
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
  }, { intervals: [30], timeout: 16000 }).toBe(true);

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
  }, { timeout: 16000 }).toBe(true);

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

  // 1. Rosalia's Rose Garden concludes at an authored Rainbow Archway with Mom presented as an illustrated cutout
  const gardenArch = await page.evaluate(() => window.__ROSIE_RUNNER__?.getArchway?.("garden"));
  expect(gardenArch).toBeDefined();
  expect(gardenArch?.place).toBe("garden");
  expect(gardenArch?.x).toBeGreaterThan(0);
  const gardenWaving = await page.evaluate(() => window.__ROSIE_RUNNER__?.isGuestWaving?.("garden"));
  expect(gardenWaving).toBe(true);
  const gardenCutout = await page.evaluate(() => window.__ROSIE_RUNNER__?.isGuestCutout?.("garden"));
  expect(gardenCutout).toBe(true);

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

  // Gram is presented as an illustrated cutout at Lacewood archway
  const lacewoodCutout = await page.evaluate(() => window.__ROSIE_RUNNER__?.isGuestCutout?.("lacewood"));
  expect(lacewoodCutout).toBe(true);

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

test("fullscreen touch ergonomics and keyboard Up Arrow mirror primary jump and flutter input", async ({ page }) => {
  await startStorybookFlight(page);

  // 1. Tapping canvas triggers jump
  await page.locator("#game canvas").click({ position: { x: 300, y: 300 } });
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
    return s && !s.isGrounded && (s.mode === "jumping" || s.velocityY < 0);
  }).toBe(true);

  // Holding canvas pointer down triggers flutter-glide
  await page.mouse.move(300, 300);
  await page.mouse.down();
  await expect.poll(async () => {
    return (await page.evaluate(() => window.__ROSIE_RUNNER__?.getState()))?.isFluttering;
  }, { timeout: 3000 }).toBe(true);
  let state = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(state?.mode).toBe("fluttering");
  expect(state?.velocityY).toBeLessThanOrEqual(90);
  await page.mouse.up();

  // Wait to land
  await expect.poll(async () => {
    return (await page.evaluate(() => window.__ROSIE_RUNNER__?.getState()))?.isGrounded;
  }, { timeout: 5000 }).toBe(true);

  // 2. Keyboard Up Arrow mirrors primary jump input
  await page.keyboard.press("ArrowUp");
  await expect.poll(async () => {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
    return s && !s.isGrounded && (s.mode === "jumping" || s.velocityY < 0);
  }).toBe(true);

  // Holding Up Arrow triggers flutter-glide
  await page.keyboard.down("ArrowUp");
  await expect.poll(async () => {
    return (await page.evaluate(() => window.__ROSIE_RUNNER__?.getState()))?.isFluttering;
  }, { timeout: 3000 }).toBe(true);
  state = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(state?.mode).toBe("fluttering");
  await page.keyboard.up("ArrowUp");
});

test("Storybook Stage maintains a sharp, letterboxed 16:9 aspect ratio across iPad, mobile, and desktop viewports", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();
  await expect(page.locator("#game canvas")).toBeVisible();

  // Desktop 1280x720 (native 16:9)
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(300);
  let canvasBox = await page.locator("#game canvas").boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox) {
    const ratio = canvasBox.width / canvasBox.height;
    expect(ratio).toBeCloseTo(16 / 9, 1);
  }

  // iPad 1024x768 (4:3 aspect ratio)
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(300);
  canvasBox = await page.locator("#game canvas").boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox) {
    const ratio = canvasBox.width / canvasBox.height;
    expect(ratio).toBeCloseTo(16 / 9, 1);
    expect(canvasBox.height).toBeLessThanOrEqual(578);
    expect(canvasBox.height).toBeGreaterThanOrEqual(574);
  }

  // Mobile 390x844 (tall phone)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  canvasBox = await page.locator("#game canvas").boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox) {
    const ratio = canvasBox.width / canvasBox.height;
    expect(ratio).toBeCloseTo(16 / 9, 1);
    expect(canvasBox.height).toBeLessThanOrEqual(222);
    expect(canvasBox.height).toBeGreaterThanOrEqual(217);
  }
});

test("Grown-up Corner requires 2-second hold to reveal controls and pause play while ignoring brief accidental taps", async ({ page }) => {
  await startStorybookFlight(page);

  const grownUpButton = page.locator("#grown-up-corner-button");
  await expect(grownUpButton).toBeVisible();

  // Accidental brief tap (< 2s) does not open dialog or pause play
  await grownUpButton.click();
  await expect(page.locator("#grown-up-dialog")).toBeHidden();
  expect(await page.evaluate(() => window.__ROSIE_RUNNER__?.isPaused?.())).toBe(false);

  // Sustained 2-second press on Grown-up Corner
  const buttonBox = await grownUpButton.boundingBox();
  expect(buttonBox).not.toBeNull();
  if (buttonBox) {
    await page.mouse.move(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(2100);
    await page.mouse.up();
  }

  // Reveals dialog, pauses flight, and reveals sound toggle and restart controls
  await expect(page.locator("#grown-up-dialog")).toBeVisible();
  expect(await page.evaluate(() => window.__ROSIE_RUNNER__?.isPaused?.())).toBe(true);
  await expect(page.locator("#grown-up-sound-toggle")).toBeVisible();
  await expect(page.locator("#grown-up-restart-button")).toBeVisible();
  await expect(page.locator("#grown-up-resume-button")).toBeVisible();

  // Toggling sound works
  const initialPressed = await page.locator("#grown-up-sound-toggle").getAttribute("aria-pressed");
  await page.locator("#grown-up-sound-toggle").click();
  const nextPressed = await page.locator("#grown-up-sound-toggle").getAttribute("aria-pressed");
  expect(nextPressed).not.toBe(initialPressed);

  // Resuming flight unpauses game and hides dialog
  await page.locator("#grown-up-resume-button").click();
  await expect(page.locator("#grown-up-dialog")).toBeHidden();
  expect(await page.evaluate(() => window.__ROSIE_RUNNER__?.isPaused?.())).toBe(false);

  // Secondary two-finger tap immediately reveals controls
  await page.evaluate(() => {
    const btn = document.getElementById("grown-up-corner-button");
    if (!btn) throw new Error("Missing grown-up-corner-button");
    const t1 = new Touch({ identifier: 0, target: btn, clientX: 10, clientY: 10 });
    const t2 = new Touch({ identifier: 1, target: btn, clientX: 20, clientY: 20 });
    const event = new TouchEvent("touchstart", {
      touches: [t1, t2],
      targetTouches: [t1, t2],
      changedTouches: [t1, t2],
      bubbles: true,
      cancelable: true,
    });
    btn.dispatchEvent(event);
  });
  await expect(page.locator("#grown-up-dialog")).toBeVisible();
  expect(await page.evaluate(() => window.__ROSIE_RUNNER__?.isPaused?.())).toBe(true);

  // Restart control restarts the journey
  await page.locator("#grown-up-restart-button").click();
  await expect(page.locator("#storybook")).toBeVisible();
  await expect(page.locator("#game-shell")).toBeHidden();
});

test("complete 6-place journey across Birthday Castle Approach into grand celebration, constellation, album, and Fly Again reset", async ({ page }) => {
  test.setTimeout(90_000);
  await startStorybookFlight(page);

  // 1. Verify all 6 places + castle approach illustrations are loaded
  const stops = [
    { id: "garden", place: "Rosalia’s Rose Garden", guest: "Mom", stampTitle: "Mom’s Rose Stamp", icon: "🌹" },
    { id: "lacewood", place: "Zélie’s Lacewood", guest: "Gram", stampTitle: "Gram’s Lace Ribbon Stamp", icon: "🎀" },
    { id: "abbey", place: "Golden Bell Abbey", guest: "Pop", stampTitle: "Pop’s Golden Bell Stamp", icon: "🔔" },
    { id: "clouds", place: "Cloister of Clouds", guest: "Beasley", stampTitle: "Beasley’s Cloud Paws Stamp", icon: "🐈" },
    { id: "peak", place: "Pellegrino Peak", guest: "Aunt", stampTitle: "Aunt’s Mountain Flower Stamp", icon: "🌸" },
    { id: "sea", place: "Sapphire Sea", guest: "Uncle", stampTitle: "Uncle’s Sea Wave Stamp", icon: "🌊" },
    { id: "castle", place: "Birthday Castle gates", guest: "Dad", stampTitle: "Dad’s Castle Gate Stamp", icon: "🏰" },
  ] as const;

  for (const stop of stops) {
    const hasIllustration = await page.evaluate((id) => window.__ROSIE_RUNNER__?.hasPlaceIllustration?.(id), stop.id);
    expect(hasIllustration).toBe(true);
  }

  // 2. Verify place-themed obstacles and springboards span all stops
  const obstacles = await page.evaluate(() => window.__ROSIE_RUNNER__?.getObstacles?.());
  expect(obstacles).toBeDefined();
  const obstacleTypes = new Set(obstacles?.map((o) => o.type));
  expect(obstacleTypes).toContain("rose-bush");
  expect(obstacleTypes).toContain("silver-ribbon");
  expect(obstacleTypes).toContain("bell-rope");
  expect(obstacleTypes).toContain("soft-cloud");
  expect(obstacleTypes).toContain("flower-bank");
  expect(obstacleTypes).toContain("wave-crest");
  expect(obstacleTypes).toContain("castle-bunting");

  const springboards = await page.evaluate(() => window.__ROSIE_RUNNER__?.getSpringboards?.());
  expect(springboards).toBeDefined();
  const springboardTypes = new Set(springboards?.map((s) => s.type));
  expect(springboardTypes).toContain("giant-rose");
  expect(springboardTypes).toContain("lace-sprout");
  expect(springboardTypes).toContain("abbey-bell");
  expect(springboardTypes).toContain("cloud-updraft");
  expect(springboardTypes).toContain("mountain-blossom");
  expect(springboardTypes).toContain("sea-geyser");
  expect(springboardTypes).toContain("castle-drum");

  // 3. Play through all six places in sequence, culminating at Birthday Castle gates
  for (const [i, stop] of stops.entries()) {
    const isFinal = i === stops.length - 1;

    // Check archway and guest waving
    const arch = await page.evaluate((s) => window.__ROSIE_RUNNER__?.getArchway?.(s), stop.id);
    expect(arch).toBeDefined();
    const waving = await page.evaluate((s) => window.__ROSIE_RUNNER__?.isGuestWaving?.(s), stop.id);
    expect(waving).toBe(true);
    const isCutout = await page.evaluate((s) => window.__ROSIE_RUNNER__?.isGuestCutout?.(s), stop.id);
    expect(isCutout).toBe(true);

    // Gallop to archway
    await page.evaluate(() => {
      window.__ROSIE_RUNNER__?.seekToEnd();
    });

    // Wait for Moment card to reveal reunion and stamp
    await expect(page.locator("#moment")).toBeVisible();
    await expect(page.locator("#moment-place")).toHaveText(stop.place);
    await expect(page.locator("#moment-stamp-title")).toHaveText(stop.stampTitle);
    await expect(page.locator("#moment-stamp-guest")).toContainText(stop.guest);
    await expect(page.locator("#moment-stamp-icon")).toHaveText(stop.icon);

    // Verify Star Tracker counter
    await expect(page.locator("#star-tracker")).toHaveAttribute("aria-label", `${i + 1} of 7 Birthday Stars`);

    // Verify domain state
    const journey = await page.evaluate(() => window.__ROSIE_RUNNER__?.getJourney());
    expect(journey?.collectedStars).toContain(stop.id);
    expect(journey?.acquiredStamps).toContain(stop.id);

    if (!isFinal) {
      await expect(page.locator("#moment-next")).toContainText("Keep flying");
      await page.locator("#moment-next").click();
      await expect(page.locator("#moment")).toBeHidden();
    } else {
      await expect(page.locator("#moment-next")).toContainText("To the celebration");
      await page.locator("#moment-next").click();
      await expect(page.locator("#moment")).toBeHidden();
    }
  }

  // 4. Smooth transition introduces the Grand Celebration
  await expect(page.locator("#game-shell")).toBeHidden();
  await expect(page.locator("#ending")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Happy Birthday/i })).toBeVisible();

  // 5. Constellation: all 6 recovered stars join Dad's Castle Star above Princess Zélie
  const constellation = page.locator("#celebration-constellation");
  await expect(constellation).toBeVisible();
  const litStars = constellation.locator(".constellation-star.is-lit");
  await expect(litStars).toHaveCount(7);
  const castleStar = constellation.locator('[data-star="castle"]');
  await expect(castleStar).toBeVisible();
  await expect(castleStar).toHaveClass(/constellation-star--castle/);
  await expect(castleStar).toHaveClass(/is-lit/);

  // 6. Celebration Album: displays all 7 earned stamps with interactive preview switching
  const albumGrid = page.locator("#celebration-album-grid");
  await expect(albumGrid).toBeVisible();
  const stampButtons = albumGrid.locator(".album-stamp-item");
  await expect(stampButtons).toHaveCount(7);

  // Initially shows Mom's Rose Stamp
  await expect(page.locator("#album-preview-title")).toHaveText("Mom’s Rose Stamp");
  await expect(page.locator("#album-preview-guest")).toContainText("Mom");

  // Clicking Dad's Castle Gate Stamp tab updates preview
  const dadTab = albumGrid.locator('[data-stamp-id="castle"]');
  await expect(dadTab).toBeVisible();
  await dadTab.scrollIntoViewIfNeeded();
  await dadTab.click();
  await expect(dadTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#album-preview-title")).toHaveText("Dad’s Castle Gate Stamp");
  await expect(page.locator("#album-preview-guest")).toContainText("Dad");
  await expect(page.locator("#album-preview-desc")).toHaveText("Kept the Castle Star safe at the Birthday Castle gates");

  // Clicking Beasley's Cloud Paws Stamp tab updates preview
  const beasleyTab = albumGrid.locator('[data-stamp-id="clouds"]');
  await beasleyTab.scrollIntoViewIfNeeded();
  await beasleyTab.click();
  await expect(beasleyTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#album-preview-title")).toHaveText("Beasley’s Cloud Paws Stamp");
  await expect(page.locator("#album-preview-guest")).toContainText("Beasley");

  // 7. Fly Again cleanly resets journey state and begins adventure from Rosalia's Rose Garden
  const flyAgainBtn = page.locator("#fly-again-button");
  await expect(flyAgainBtn).toBeVisible();
  await flyAgainBtn.scrollIntoViewIfNeeded();
  await flyAgainBtn.click();

  // Game shell is shown, ending screen hidden
  await expect(page.locator("#ending")).toBeHidden();
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(page.locator("#game canvas")).toBeVisible();

  // Star tracker reset to 0 of 7
  await expect(page.locator("#star-tracker")).toHaveAttribute("aria-label", "0 of 7 Birthday Stars");

  // Wait for runner scene to be ready and grounded
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.() && window.__ROSIE_RUNNER__?.getState()?.isGrounded);
  }, { timeout: 5000 }).toBe(true);

  // Domain journey reset cleanly
  const resetState = await page.evaluate(() => ({
    journey: window.__ROSIE_RUNNER__?.getJourney(),
    state: window.__ROSIE_RUNNER__?.getState(),
    stopIndex: window.__ROSIE_RUNNER__?.getCurrentStopIndex?.(),
  }));

  expect(resetState.journey?.collectedStars).toEqual([]);
  expect(resetState.journey?.acquiredStamps).toEqual([]);
  expect(resetState.journey?.phase).toBe("flying");
  expect(resetState.stopIndex).toBe(0);
  expect(resetState.state?.x).toBeLessThanOrEqual(300);
});

test("each Place Illustration renders at its painted 16:9 aspect ratio without vertical squash, and the scene holds only one place's objects at a time across places", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the story" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: "Fly with Rosie" }).click();

  await expect(page.locator("#game canvas")).toBeVisible();
  await expect.poll(async () => {
    return await page.evaluate(() => window.__ROSIE_RUNNER__?.isReady?.());
  }).toBe(true);

  // 1. Initial Place (Rosalia's Rose Garden)
  // Far layer panorama covers stage and course offset without vertical squash
  const gardenDisplaySize = await page.evaluate(() => window.__ROSIE_RUNNER__?.getPlaceIllustrationDisplaySize?.());
  expect(gardenDisplaySize).toBeDefined();
  expect(gardenDisplaySize?.width).toBeGreaterThanOrEqual(2160);
  expect(gardenDisplaySize?.height).toBe(720);

  // Scene holds only one place's objects at a time
  const gardenPlaceObjects = await page.evaluate(() => window.__ROSIE_RUNNER__?.getScenePlaceObjects?.());
  expect(gardenPlaceObjects).toBeDefined();
  expect(gardenPlaceObjects?.place).toBe("garden");
  expect(gardenPlaceObjects?.guest).toBe("Mom");
  expect(gardenPlaceObjects?.obstacles).toHaveLength(2);
  expect(gardenPlaceObjects?.obstacles.every((o) => o.place === "garden")).toBe(true);
  expect(gardenPlaceObjects?.springboards).toHaveLength(2);
  expect(gardenPlaceObjects?.springboards.every((s) => s.place === "garden")).toBe(true);
  expect(gardenPlaceObjects?.sparkles).toHaveLength(10);
  expect(gardenPlaceObjects?.sparkles.every((sp) => sp.place === "garden")).toBe(true);
  expect(gardenPlaceObjects?.archway?.place).toBe("garden");
  expect(gardenPlaceObjects?.archway?.x).toBe(4500);

  // 2. Advance to the end of Rosalia's Rose Garden
  await page.evaluate(() => {
    window.__ROSIE_RUNNER__?.seekToEnd();
  });

  await expect(page.locator("#moment")).toBeVisible();
  await expect(page.locator("#moment-place")).toHaveText("Rosalia’s Rose Garden");

  // Continuing from Birthday Star Moment rebuilds next place with no flash or empty stage
  await page.locator("#moment-next").click();
  await expect(page.locator("#moment")).toBeHidden();
  await expect(page.locator("#game canvas")).toBeVisible();

  // 3. Second Place (Lacewood)
  await expect.poll(async () => {
    const objs = await page.evaluate(() => window.__ROSIE_RUNNER__?.getScenePlaceObjects?.());
    return objs?.place;
  }).toBe("lacewood");

  const lacewoodDisplaySize = await page.evaluate(() => window.__ROSIE_RUNNER__?.getPlaceIllustrationDisplaySize?.());
  expect(lacewoodDisplaySize).toBeDefined();
  expect(lacewoodDisplaySize?.width).toBeGreaterThanOrEqual(2160);
  expect(lacewoodDisplaySize?.height).toBe(720);

  const lacewoodPlaceObjects = await page.evaluate(() => window.__ROSIE_RUNNER__?.getScenePlaceObjects?.());
  expect(lacewoodPlaceObjects?.place).toBe("lacewood");
  expect(lacewoodPlaceObjects?.guest).toBe("Gram");
  expect(lacewoodPlaceObjects?.obstacles).toHaveLength(2);
  expect(lacewoodPlaceObjects?.obstacles.every((o) => o.place === "lacewood")).toBe(true);
  expect(lacewoodPlaceObjects?.springboards).toHaveLength(2);
  expect(lacewoodPlaceObjects?.springboards.every((s) => s.place === "lacewood")).toBe(true);
  expect(lacewoodPlaceObjects?.sparkles).toHaveLength(10);
  expect(lacewoodPlaceObjects?.sparkles.every((sp) => sp.place === "lacewood")).toBe(true);
  expect(lacewoodPlaceObjects?.archway?.place).toBe("lacewood");
  expect(lacewoodPlaceObjects?.archway?.x).toBe(4500);

  // Player position reset to place start
  const lacewoodPlayerState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState());
  expect(lacewoodPlayerState?.x).toBeLessThanOrEqual(300);

  // 4. Advance through Lacewood to Abbey to confirm another clean transition
  await page.evaluate(() => {
    window.__ROSIE_RUNNER__?.seekToEnd();
  });
  await expect(page.locator("#moment")).toBeVisible();
  await expect(page.locator("#moment-place")).toHaveText("Zélie’s Lacewood");
  await page.locator("#moment-next").click();
  await expect(page.locator("#moment")).toBeHidden();
  await expect(page.locator("#game canvas")).toBeVisible();

  await expect.poll(async () => {
    const objs = await page.evaluate(() => window.__ROSIE_RUNNER__?.getScenePlaceObjects?.());
    return objs?.place;
  }).toBe("abbey");

  const abbeyDisplaySize = await page.evaluate(() => window.__ROSIE_RUNNER__?.getPlaceIllustrationDisplaySize?.());
  expect(abbeyDisplaySize?.width).toBe(1280);
  expect(abbeyDisplaySize?.height).toBe(720);

  const abbeyPlaceObjects = await page.evaluate(() => window.__ROSIE_RUNNER__?.getScenePlaceObjects?.());
  expect(abbeyPlaceObjects?.place).toBe("abbey");
  expect(abbeyPlaceObjects?.obstacles).toHaveLength(2);
  expect(abbeyPlaceObjects?.obstacles.every((o) => o.place === "abbey")).toBe(true);
  expect(abbeyPlaceObjects?.springboards).toHaveLength(2);
  expect(abbeyPlaceObjects?.springboards.every((s) => s.place === "abbey")).toBe(true);
  expect(abbeyPlaceObjects?.sparkles).toHaveLength(10);
  expect(abbeyPlaceObjects?.sparkles.every((sp) => sp.place === "abbey")).toBe(true);
  expect(abbeyPlaceObjects?.archway?.x).toBe(4500);
});

test("an e2e check flies one place without stumbling and confirms Rainbow Archway arrival between 27 and 35 seconds", async ({ page }) => {
  test.setTimeout(60_000);
  await startStorybookFlight(page);

  const startTime = Date.now();
  let jumpedForFirst = false;
  let jumpedForSecond = false;

  // Fly through Rosalia's Rose Garden at 150 px/s without stumbling:
  // Obstacle 1 is at 1400; jump approaching at 1260
  // Obstacle 2 is at 3400; jump approaching at 3260
  while (Date.now() - startTime < 45_000) {
    const s = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
    if (s?.arrivedAtArchway) break;

    if (!jumpedForFirst && s && s.x >= 1260 && s.x < 1400) {
      jumpedForFirst = true;
      await page.keyboard.press("Space");
    }

    if (!jumpedForSecond && s && s.x >= 3260 && s.x < 3400) {
      jumpedForSecond = true;
      await page.keyboard.press("Space");
    }

    await page.waitForTimeout(40);
  }

  // Confirm Rainbow Archway arrival
  await expect(page.locator("#moment")).toBeVisible({ timeout: 10_000 });
  const arrivalTime = Date.now();
  const elapsedSeconds = (arrivalTime - startTime) / 1000;

  // Confirm Rainbow Archway arrival between 27 and 35 seconds
  expect(elapsedSeconds).toBeGreaterThanOrEqual(27);
  expect(elapsedSeconds).toBeLessThanOrEqual(35);

  // Confirm zero stumbles occurred
  const finalState = await page.evaluate(() => window.__ROSIE_RUNNER__?.getState?.());
  expect(finalState?.stumbledObstacles).toHaveLength(0);
  expect(finalState?.arrivedAtArchway).toBe(true);
});

test("authored places declare three Scenery Layers with distinct factors and far layer moves slower than near during flight", async ({ page }) => {
  await startStorybookFlight(page);

  const places = ["garden", "lacewood", "abbey", "clouds", "peak", "sea", "castle"] as const;
  const expectedPaintings: Record<(typeof places)[number], string> = {
    garden: "garden.far-layer",
    lacewood: "lacewood.far-layer",
    abbey: "abbey.background",
    clouds: "cloister.background",
    peak: "pellegrino-peak.background",
    sea: "sapphire-sea.far-layer",
    castle: "celebration.castle-approach",
  };

  // 1. Verify getPlaceLayers hook with no arguments lists each place's layers with their factors
  const allPlacesLayers = (await page.evaluate(() =>
    window.__ROSIE_RUNNER__?.getPlaceLayers?.()
  )) as Record<(typeof places)[number], Array<{ depth: string; depthFactor: number; paintingAssetId?: string; setPieces: any[] }>>;
  expect(allPlacesLayers).toBeDefined();

  // Verify Rose Garden has distinct factors 0.2, 0.5, 1.0
  const gardenLayers = allPlacesLayers.garden;
  expect(gardenLayers).toBeDefined();
  expect(gardenLayers).toHaveLength(3);
  expect(gardenLayers[0]?.depth).toBe("far");
  expect(gardenLayers[0]?.depthFactor).toBe(0.2);
  expect(gardenLayers[0]?.paintingAssetId).toBe("garden.far-layer");
  expect(gardenLayers[1]?.depth).toBe("middle");
  expect(gardenLayers[1]?.depthFactor).toBe(0.5);
  expect(gardenLayers[1]?.setPieces.length).toBeGreaterThanOrEqual(5);
  expect(gardenLayers[2]?.depth).toBe("near");
  expect(gardenLayers[2]?.depthFactor).toBe(1.0);
  expect(gardenLayers[2]?.setPieces.length).toBeGreaterThanOrEqual(3);

  // Verify Zélie's Lacewood has distinct factors 0.2, 0.5, 1.0
  const lacewoodLayers = allPlacesLayers.lacewood;
  expect(lacewoodLayers).toBeDefined();
  expect(lacewoodLayers).toHaveLength(3);
  expect(lacewoodLayers[0]?.depth).toBe("far");
  expect(lacewoodLayers[0]?.depthFactor).toBe(0.2);
  expect(lacewoodLayers[0]?.paintingAssetId).toBe("lacewood.far-layer");
  expect(lacewoodLayers[1]?.depth).toBe("middle");
  expect(lacewoodLayers[1]?.depthFactor).toBe(0.5);
  expect(lacewoodLayers[1]?.setPieces.length).toBeGreaterThanOrEqual(6);
  expect(lacewoodLayers[2]?.depth).toBe("near");
  expect(lacewoodLayers[2]?.depthFactor).toBe(1.0);
  expect(lacewoodLayers[2]?.setPieces.length).toBeGreaterThanOrEqual(3);

  // Verify Sapphire Sea has distinct factors 0.2, 0.5, 1.0
  const seaLayers = allPlacesLayers.sea;
  expect(seaLayers).toBeDefined();
  expect(seaLayers).toHaveLength(3);
  expect(seaLayers[0]?.depth).toBe("far");
  expect(seaLayers[0]?.depthFactor).toBe(0.2);
  expect(seaLayers[0]?.paintingAssetId).toBe("sapphire-sea.far-layer");
  expect(seaLayers[1]?.depth).toBe("middle");
  expect(seaLayers[1]?.depthFactor).toBe(0.5);
  expect(seaLayers[1]?.setPieces.length).toBeGreaterThanOrEqual(6);
  expect(seaLayers[2]?.depth).toBe("near");
  expect(seaLayers[2]?.depthFactor).toBe(1.0);
  expect(seaLayers[2]?.setPieces.length).toBeGreaterThanOrEqual(3);

  // Other 4 places retain initial 0 factor
  for (const place of ["abbey", "clouds", "peak", "castle"] as const) {
    const placeFromAll = allPlacesLayers[place];
    expect(placeFromAll).toBeDefined();
    expect(placeFromAll).toHaveLength(3);

    const [farFromAll, middleFromAll, nearFromAll] = placeFromAll;
    expect(farFromAll?.depth).toBe("far");
    expect(farFromAll?.depthFactor).toBe(0);
    expect(farFromAll?.paintingAssetId).toBe(expectedPaintings[place]);
    expect(farFromAll?.setPieces).toEqual([]);

    expect(middleFromAll?.depth).toBe("middle");
    expect(middleFromAll?.depthFactor).toBe(0.5);
    expect(middleFromAll?.setPieces).toEqual([]);

    expect(nearFromAll?.depth).toBe("near");
    expect(nearFromAll?.depthFactor).toBe(1.0);
    expect(nearFromAll?.setPieces).toEqual([]);

    // 2. Verify getPlaceLayers(place) returns the same layers for that specific place
    const layers = (await page.evaluate(
      (p) => window.__ROSIE_RUNNER__?.getPlaceLayers?.(p as any),
      place
    )) as Array<{ depth: string; depthFactor: number; paintingAssetId?: string; setPieces: any[] }>;
    expect(layers).toBeDefined();
    expect(layers).toHaveLength(3);
    expect(layers).toEqual(placeFromAll);
  }

  // 3. Verify getScenePlaceObjects includes declared layers and activeLayers
  const sceneObjects = await page.evaluate(() => window.__ROSIE_RUNNER__?.getScenePlaceObjects?.());
  expect(sceneObjects?.layers).toBeDefined();
  expect(sceneObjects?.layers).toHaveLength(3);
  expect(sceneObjects?.activeLayers).toBeDefined();
  expect(sceneObjects?.activeLayers).toHaveLength(3);

  // 4. Verify wide far layer display size covers the panorama
  const displaySize = await page.evaluate(() => window.__ROSIE_RUNNER__?.getPlaceIllustrationDisplaySize?.());
  expect(displaySize?.width).toBeGreaterThanOrEqual(2160);
  expect(displaySize?.height).toBe(720);

  // 5. Advance runner and verify far layer moves slower than near layer during flight
  await page.waitForTimeout(600);
  const snapshot = await page.evaluate(() => ({
    runnerState: window.__ROSIE_RUNNER__?.getState?.(),
    activeLayers: window.__ROSIE_RUNNER__?.getActiveSceneryLayers?.(),
  }));

  expect(snapshot.runnerState?.x).toBeGreaterThan(200);
  expect(snapshot.activeLayers).toBeDefined();
  expect(snapshot.activeLayers).toHaveLength(3);

  const farLayer = snapshot.activeLayers?.find((l) => l.depth === "far");
  const middleLayer = snapshot.activeLayers?.find((l) => l.depth === "middle");
  const nearLayer = snapshot.activeLayers?.find((l) => l.depth === "near");

  expect(farLayer).toBeDefined();
  expect(middleLayer).toBeDefined();
  expect(nearLayer).toBeDefined();

  // Far layer (depthFactor 0.2) moves slower than near layer (depthFactor 1.0)
  expect(Math.abs(farLayer!.x)).toBeLessThan(Math.abs(nearLayer!.x));
  expect(Math.abs(farLayer!.x)).toBeLessThan(Math.abs(middleLayer!.x));
  expect(Math.abs(middleLayer!.x)).toBeLessThan(Math.abs(nearLayer!.x));

  // Verify proportional offsets match runner position
  expect(Math.abs(farLayer!.x)).toBeCloseTo(snapshot.runnerState!.x * 0.2, 0);
  expect(Math.abs(middleLayer!.x)).toBeCloseTo(snapshot.runnerState!.x * 0.5, 0);
  expect(Math.abs(nearLayer!.x)).toBeCloseTo(snapshot.runnerState!.x * 1.0, 0);
});


