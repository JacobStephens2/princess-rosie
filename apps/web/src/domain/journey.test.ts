import { describe, expect, test } from "vitest";

import {
  SCATTERED_STAR_STOPS,
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

  test("six scattered Birthday Stars are collected in flight while the Castle Star is not gathered", () => {
    const sixStars = STAR_STOPS.reduce(collectBirthdayStar, createJourney());

    expect(sixStars.phase).toBe("flying");
    expect(sixStars.collectedStars).toEqual(SCATTERED_STAR_STOPS);
    expect(sixStars.openRainbowPaths).toEqual(SCATTERED_STAR_STOPS);

    // Collecting at castle is a no-op — Castle Star is kept safe at the Castle, not gathered in flight
    const attemptedCastleCollect = collectBirthdayStar(sixStars, "castle");
    expect(attemptedCastleCollect.collectedStars).toEqual(sixStars.collectedStars);
    expect(attemptedCastleCollect.openRainbowPaths).toEqual(sixStars.openRainbowPaths);
  });

  test("acquiring Dad's Storybook Stamp at the Birthday Castle after recovering all six Stars completes the journey", () => {
    let journey = createJourney();

    for (const stop of SCATTERED_STAR_STOPS) {
      journey = collectBirthdayStar(journey, stop);
      journey = acquireStorybookStamp(journey, stop);
    }

    expect(journey.phase).toBe("flying");
    expect(journey.collectedStars).toHaveLength(SCATTERED_STAR_STOPS.length);

    // Arriving at the castle gates awards Dad's stamp and triggers celebration
    const atCastle = acquireStorybookStamp(journey, "castle");
    expect(atCastle.phase).toBe("celebrating");
    expect(atCastle.acquiredStamps).toContain("castle");
    expect(atCastle.collectedStars).toEqual(SCATTERED_STAR_STOPS);
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

  test("full 6-place journey across Fairytale Sicily collects 6 scattered stars, opens 6 rainbow paths, acquires all 7 stamps, and Fly Again cleanly resets state", () => {
    let journey = createJourney();

    for (const stop of SCATTERED_STAR_STOPS) {
      journey = collectBirthdayStar(journey, stop);
      journey = acquireStorybookStamp(journey, stop);
    }

    // Castle stop awards Dad's stamp without collecting a star or opening a 7th rainbow path
    journey = collectBirthdayStar(journey, "castle");
    journey = acquireStorybookStamp(journey, "castle");

    expect(journey.phase).toBe("celebrating");
    expect(journey.collectedStars).toEqual(SCATTERED_STAR_STOPS);
    expect(journey.openRainbowPaths).toEqual(SCATTERED_STAR_STOPS);
    expect(journey.acquiredStamps).toEqual([...SCATTERED_STAR_STOPS, "castle"]);

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
