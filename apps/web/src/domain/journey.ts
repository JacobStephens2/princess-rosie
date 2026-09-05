export type FamilyGuest = "Mom" | "Dad" | "Pop" | "Gram" | "Aunt" | "Uncle" | "Beasley";

export const STAR_STOPS = [
  "garden",
  "lacewood",
  "abbey",
  "clouds",
  "peak",
  "sea",
  "castle",
] as const;

export type StarStop = (typeof STAR_STOPS)[number];
export type JourneyPhase = "flying" | "cloud-rest" | "celebrating";

export interface Journey {
  phase: JourneyPhase;
  collectedStars: StarStop[];
  openRainbowPaths: StarStop[];
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
  return {
    ...journey,
    acquiredStamps: [...journey.acquiredStamps, stop],
  };
}

export function collectBirthdayStar(journey: Journey, stop: StarStop): Journey {
  if (journey.collectedStars.includes(stop)) return journey;

  const collectedStars = [...journey.collectedStars, stop];

  return {
    ...journey,
    phase: collectedStars.length === STAR_STOPS.length ? "celebrating" : "flying",
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
