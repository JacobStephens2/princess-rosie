export const FAMILY_GUESTS = [
  "Mom",
  "Dad",
  "Pop",
  "Gram",
  "Aunt",
  "Uncle",
  "Beasley",
] as const;

export type FamilyGuest = (typeof FAMILY_GUESTS)[number];

export const SCATTERED_STAR_STOPS = [
  "garden",
  "lacewood",
  "abbey",
  "clouds",
  "peak",
  "sea",
] as const;

export type ScatteredStarStop = (typeof SCATTERED_STAR_STOPS)[number];

export const STAR_STOPS = [
  ...SCATTERED_STAR_STOPS,
  "castle",
] as const;

export type StarStop = (typeof STAR_STOPS)[number];
export type JourneyPhase = "flying" | "cloud-rest" | "celebrating";

export interface Journey {
  phase: JourneyPhase;
  collectedStars: ScatteredStarStop[];
  openRainbowPaths: ScatteredStarStop[];
  acquiredStamps: StarStop[];
  bumpStreak: number;
  helpLevel: number;
}

export function createJourney(): Journey {
  return {
    phase: "flying",
    collectedStars: [],
    openRainbowPaths: [],
    acquiredStamps: [],
    bumpStreak: 0,
    helpLevel: 0,
  };
}

export function acquireStorybookStamp(journey: Journey, stop: StarStop): Journey {
  if (journey.acquiredStamps.includes(stop)) return journey;
  const acquiredStamps = [...journey.acquiredStamps, stop];
  const phase: JourneyPhase =
    stop === "castle" && journey.collectedStars.length === SCATTERED_STAR_STOPS.length
      ? "celebrating"
      : journey.phase;
  return {
    ...journey,
    acquiredStamps,
    phase,
  };
}

export function collectBirthdayStar(journey: Journey, stop: StarStop): Journey {
  if (stop === "castle") return journey;
  if (journey.collectedStars.includes(stop)) return journey;

  const collectedStars = [...journey.collectedStars, stop];

  return {
    ...journey,
    collectedStars,
    openRainbowPaths: [...journey.openRainbowPaths, stop],
    bumpStreak: 0,
  };
}

export function recordBump(journey: Journey): Journey {
  if (journey.phase !== "flying") return journey;

  const bumpStreak = Math.min(3, journey.bumpStreak + 1);
  return {
    ...journey,
    bumpStreak,
    phase: bumpStreak === 3 ? "cloud-rest" : "flying",
  };
}

export function resumeJourney(journey: Journey): Journey {
  if (journey.phase !== "cloud-rest") return journey;

  return {
    ...journey,
    phase: "flying",
    bumpStreak: 0,
    helpLevel: Math.min(2, journey.helpLevel + 1),
  };
}

export function resetJourney(_journey?: Journey): Journey {
  return createJourney();
}
