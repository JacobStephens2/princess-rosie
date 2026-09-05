import { describe, expect, test } from "vitest";

import {
  STAR_STOPS,
  acquireStorybookStamp,
  collectBirthdayStar,
  createJourney,
  recordBump,
  resetJourney,
  resumeJourney,
} from "./journey";

describe("Birthday Star journey", () => {
  test("collecting a Birthday Star opens its Rainbow Path and preserves earlier Stars", () => {
    const garden = collectBirthdayStar(createJourney(), "garden");
    const lacewood = collectBirthdayStar(garden, "lacewood");

    expect(lacewood).toMatchObject({
      phase: "flying",
      collectedStars: ["garden", "lacewood"],
      openRainbowPaths: ["garden", "lacewood"],
    });
  });

  test("three nearby bumps offer Cloud Rest without taking away Birthday Stars", () => {
    const withStar = collectBirthdayStar(createJourney(), "garden");
    const resting = recordBump(recordBump(recordBump(withStar)));

    expect(resting).toMatchObject({
      phase: "cloud-rest",
      collectedStars: ["garden"],
      openRainbowPaths: ["garden"],
      bumpStreak: 3,
    });

    expect(resumeJourney(resting)).toMatchObject({
      phase: "flying",
      collectedStars: ["garden"],
      bumpStreak: 0,
      helpLevel: 1,
    });
  });

  test("the seventh Birthday Star completes the journey", () => {
    const finished = STAR_STOPS.reduce(collectBirthdayStar, createJourney());

    expect(finished).toMatchObject({
      phase: "celebrating",
      collectedStars: ["garden", "lacewood", "abbey", "clouds", "peak", "sea", "castle"],
    });
  });

  test("adaptive help becomes gentler without increasing forever", () => {
    let journey = createJourney();
    for (let rest = 0; rest < 4; rest += 1) {
      journey = resumeJourney(recordBump(recordBump(recordBump(journey))));
    }

    expect(journey).toMatchObject({ phase: "flying", helpLevel: 2 });
  });

  test("journey domain state records both the gathered Birthday Star and the acquired Storybook Stamp", () => {
    const initial = createJourney();
    expect(initial.collectedStars).toEqual([]);
    expect(initial.acquiredStamps).toEqual([]);

    const withGardenStar = collectBirthdayStar(initial, "garden");
    expect(withGardenStar.collectedStars).toContain("garden");
    expect(withGardenStar.acquiredStamps).toEqual([]);

    const withGardenStamp = acquireStorybookStamp(withGardenStar, "garden");
    expect(withGardenStamp.collectedStars).toContain("garden");
    expect(withGardenStamp.acquiredStamps).toContain("garden");

    const withLacewoodStamp = acquireStorybookStamp(withGardenStamp, "lacewood");
    expect(withLacewoodStamp.acquiredStamps).toEqual(["garden", "lacewood"]);
    // Duplicate award is a no-op
    const duplicateStamp = acquireStorybookStamp(withLacewoodStamp, "lacewood");
    expect(duplicateStamp.acquiredStamps).toEqual(["garden", "lacewood"]);
  });

  test("full 6-place journey across Fairytale Sicily collects all 7 stars, all 7 stamps, and Fly Again cleanly resets state", () => {
    let journey = createJourney();
    const stops: typeof STAR_STOPS = ["garden", "lacewood", "abbey", "clouds", "peak", "sea", "castle"];

    for (const stop of stops) {
      journey = collectBirthdayStar(journey, stop);
      journey = acquireStorybookStamp(journey, stop);
    }

    expect(journey.phase).toBe("celebrating");
    expect(journey.collectedStars).toEqual(stops);
    expect(journey.acquiredStamps).toEqual(stops);
    expect(journey.openRainbowPaths).toEqual(stops);

    // Fly Again cleanly resets journey state
    const reset = resetJourney(journey);
    expect(reset).toEqual(createJourney());
    expect(reset.phase).toBe("flying");
    expect(reset.collectedStars).toEqual([]);
    expect(reset.acquiredStamps).toEqual([]);
    expect(reset.openRainbowPaths).toEqual([]);
    expect(reset.bumpStreak).toBe(0);
    expect(reset.helpLevel).toBe(0);
  });
});
