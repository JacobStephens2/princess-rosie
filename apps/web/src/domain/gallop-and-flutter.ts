import { STAR_STOPS, type FamilyGuest, type StarStop } from "./journey";
export type { FamilyGuest };

export type RunnerMode =
  | "galloping"
  | "jumping"
  | "flapping"
  | "fluttering"
  | "falling"
  | "stumbling";

export type SpriteAnimationState = "gallop" | "leap" | "flutter" | "stumble";

export interface SpriteAnimationConfig {
  key: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
}

export const SPRITE_ANIMATIONS: Record<SpriteAnimationState, SpriteAnimationConfig> = {
  gallop: {
    key: "rosie-stella-gallop",
    startFrame: 0,
    endFrame: 5,
    frameRate: 10,
    repeat: -1,
  },
  leap: {
    key: "rosie-stella-leap",
    startFrame: 6,
    endFrame: 8,
    frameRate: 9,
    repeat: 0,
  },
  flutter: {
    key: "rosie-stella-flutter",
    startFrame: 9,
    endFrame: 12,
    frameRate: 10,
    repeat: -1,
  },
  stumble: {
    key: "rosie-stella-stumble",
    startFrame: 13,
    endFrame: 15,
    frameRate: 8,
    repeat: 0,
  },
};

export type ObstacleType =
  | "rose-bush"
  | "silver-ribbon"
  | "bell-rope"
  | "soft-cloud"
  | "flower-bank"
  | "wave-crest"
  | "castle-bunting";

export interface PlayfulObstacle {
  id: string;
  place: StarStop;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SpringboardType =
  | "giant-rose"
  | "lace-sprout"
  | "abbey-bell"
  | "cloud-updraft"
  | "mountain-blossom"
  | "sea-geyser"
  | "castle-drum";

export interface Springboard {
  id: string;
  place: StarStop;
  type: SpringboardType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StarSparkle {
  id: string;
  place: StarStop;
  x: number;
  y: number;
  radius?: number;
}

export type FamilyGuestName = FamilyGuest;

export interface RunnerConfig {
  groundY: number;
  ceilingY: number;
  forwardSpeed: number;
  jumpVelocity: number;
  flapVelocity: number;
  springboardVelocity: number;
  gravity: number;
  maxFallSpeed: number;
  flutterMaxFallSpeed: number;
  courseLength: number;
  stumbleDuration: number;
  stumbleSpeedMultiplier: number;
  nearMissProximity: number;
  playerCenterOffsetY: number;
  groundContactTolerance: number;
}

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  groundY: 560,
  ceilingY: 80,
  forwardSpeed: 150,
  jumpVelocity: -450,
  flapVelocity: -320,
  springboardVelocity: -680,
  gravity: 900,
  maxFallSpeed: 450,
  flutterMaxFallSpeed: 90,
  courseLength: 4500,
  stumbleDuration: 0.6,
  stumbleSpeedMultiplier: 0.6,
  nearMissProximity: 100,
  playerCenterOffsetY: 36,
  groundContactTolerance: 18,
};

export interface RainbowArchway {
  readonly id: string;
  readonly place: StarStop;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly guest: FamilyGuest;
}

function createRainbowArchway(place: StarStop, guest: FamilyGuest): RainbowArchway {
  return {
    id: `archway-${place}`,
    place,
    x: DEFAULT_RUNNER_CONFIG.courseLength,
    y: DEFAULT_RUNNER_CONFIG.groundY,
    width: 160,
    height: 240,
    guest,
  };
}

export const AUTHORED_RAINBOW_ARCHWAYS: Record<StarStop, RainbowArchway> = {
  garden: createRainbowArchway("garden", "Mom"),
  lacewood: createRainbowArchway("lacewood", "Gram"),
  abbey: createRainbowArchway("abbey", "Pop"),
  clouds: createRainbowArchway("clouds", "Beasley"),
  peak: createRainbowArchway("peak", "Aunt"),
  sea: createRainbowArchway("sea", "Uncle"),
  castle: createRainbowArchway("castle", "Dad"),
};

export const DEFAULT_ROSE_GARDEN_ARCHWAY: RainbowArchway = AUTHORED_RAINBOW_ARCHWAYS.garden;

export function getPlaceRainbowArchway(place: StarStop): RainbowArchway {
  return AUTHORED_RAINBOW_ARCHWAYS[place];
}

export interface FamilyGuestPlacement {
  readonly place: StarStop;
  readonly guest: FamilyGuest;
  readonly x: number;
  readonly y: number;
}

function createFamilyGuestPlacement(place: StarStop, guest: FamilyGuest): FamilyGuestPlacement {
  return {
    place,
    guest,
    x: DEFAULT_RUNNER_CONFIG.courseLength + 95,
    y: DEFAULT_RUNNER_CONFIG.groundY + 15,
  };
}

export const AUTHORED_FAMILY_GUEST_PLACEMENTS: Record<StarStop, FamilyGuestPlacement> = {
  garden: createFamilyGuestPlacement("garden", "Mom"),
  lacewood: createFamilyGuestPlacement("lacewood", "Gram"),
  abbey: createFamilyGuestPlacement("abbey", "Pop"),
  clouds: createFamilyGuestPlacement("clouds", "Beasley"),
  peak: createFamilyGuestPlacement("peak", "Aunt"),
  sea: createFamilyGuestPlacement("sea", "Uncle"),
  castle: createFamilyGuestPlacement("castle", "Dad"),
};

export function getPlaceFamilyGuest(place: StarStop): FamilyGuestPlacement {
  return AUTHORED_FAMILY_GUEST_PLACEMENTS[place];
}

export const FIRST_OBSTACLE_X = 1400;
export const SECOND_OBSTACLE_X = 3400;

function createPlaceObstacles(
  place: StarStop,
  type: ObstacleType,
  width: number,
  height: number
): readonly PlayfulObstacle[] {
  return [
    {
      id: `${place}-obstacle-1`,
      place,
      type,
      x: FIRST_OBSTACLE_X,
      y: DEFAULT_RUNNER_CONFIG.groundY,
      width,
      height,
    },
    {
      id: `${place}-obstacle-2`,
      place,
      type,
      x: SECOND_OBSTACLE_X,
      y: DEFAULT_RUNNER_CONFIG.groundY,
      width,
      height,
    },
  ];
}

export const DEFAULT_ROSE_GARDEN_OBSTACLES: readonly PlayfulObstacle[] = [
  {
    id: "garden-rose-bush-1",
    place: "garden",
    type: "rose-bush",
    x: FIRST_OBSTACLE_X,
    y: DEFAULT_RUNNER_CONFIG.groundY,
    width: 50,
    height: 40,
  },
  {
    id: "garden-rose-bush-2",
    place: "garden",
    type: "rose-bush",
    x: SECOND_OBSTACLE_X,
    y: DEFAULT_RUNNER_CONFIG.groundY,
    width: 50,
    height: 40,
  },
];

export const AUTHORED_OBSTACLES_BY_PLACE: Record<StarStop, readonly PlayfulObstacle[]> = {
  garden: DEFAULT_ROSE_GARDEN_OBSTACLES,
  lacewood: createPlaceObstacles("lacewood", "silver-ribbon", 52, 42),
  abbey: createPlaceObstacles("abbey", "bell-rope", 50, 42),
  clouds: createPlaceObstacles("clouds", "soft-cloud", 54, 40),
  peak: createPlaceObstacles("peak", "flower-bank", 52, 42),
  sea: createPlaceObstacles("sea", "wave-crest", 52, 42),
  castle: createPlaceObstacles("castle", "castle-bunting", 50, 40),
};

export const AUTHORED_OBSTACLES: readonly PlayfulObstacle[] = STAR_STOPS.flatMap(
  (stop) => AUTHORED_OBSTACLES_BY_PLACE[stop]
);

export function getPlaceObstacles(place: StarStop): readonly PlayfulObstacle[] {
  return AUTHORED_OBSTACLES_BY_PLACE[place];
}

export const FIRST_SPRINGBOARD_X = 700;
export const SECOND_SPRINGBOARD_X = 2400;

function createPlaceSpringboards(
  place: StarStop,
  type: SpringboardType,
  width: number,
  height: number
): readonly Springboard[] {
  return [
    {
      id: `${place}-springboard-1`,
      place,
      type,
      x: FIRST_SPRINGBOARD_X,
      y: DEFAULT_RUNNER_CONFIG.groundY,
      width,
      height,
    },
    {
      id: `${place}-springboard-2`,
      place,
      type,
      x: SECOND_SPRINGBOARD_X,
      y: DEFAULT_RUNNER_CONFIG.groundY,
      width,
      height,
    },
  ];
}

export const DEFAULT_ROSE_GARDEN_SPRINGBOARDS: readonly Springboard[] = [
  {
    id: "garden-springboard-1",
    place: "garden",
    type: "giant-rose",
    x: FIRST_SPRINGBOARD_X,
    y: DEFAULT_RUNNER_CONFIG.groundY,
    width: 64,
    height: 48,
  },
  {
    id: "garden-springboard-2",
    place: "garden",
    type: "giant-rose",
    x: SECOND_SPRINGBOARD_X,
    y: DEFAULT_RUNNER_CONFIG.groundY,
    width: 64,
    height: 48,
  },
];

export const AUTHORED_SPRINGBOARDS_BY_PLACE: Record<StarStop, readonly Springboard[]> = {
  garden: DEFAULT_ROSE_GARDEN_SPRINGBOARDS,
  lacewood: createPlaceSpringboards("lacewood", "lace-sprout", 64, 48),
  abbey: createPlaceSpringboards("abbey", "abbey-bell", 64, 48),
  clouds: createPlaceSpringboards("clouds", "cloud-updraft", 68, 50),
  peak: createPlaceSpringboards("peak", "mountain-blossom", 64, 48),
  sea: createPlaceSpringboards("sea", "sea-geyser", 66, 50),
  castle: createPlaceSpringboards("castle", "castle-drum", 64, 48),
};

export const AUTHORED_SPRINGBOARDS: readonly Springboard[] = STAR_STOPS.flatMap(
  (stop) => AUTHORED_SPRINGBOARDS_BY_PLACE[stop]
);

export function getPlaceSpringboards(place: StarStop): readonly Springboard[] {
  return AUTHORED_SPRINGBOARDS_BY_PLACE[place];
}

const SPRINGBOARD_SPARKLE_OFFSETS = [
  { dx: 40, y: 400 },
  { dx: 75, y: 330 },
  { dx: 115, y: 290 },
  { dx: 155, y: 330 },
  { dx: 190, y: 400 },
] as const;

function createPlaceSparkles(place: StarStop): StarSparkle[] {
  return [
    ...SPRINGBOARD_SPARKLE_OFFSETS.map((offset, index) => ({
      id: `${place}-sparkle-${index + 1}`,
      place,
      x: FIRST_SPRINGBOARD_X + offset.dx,
      y: offset.y,
    })),
    ...SPRINGBOARD_SPARKLE_OFFSETS.map((offset, index) => ({
      id: `${place}-sparkle-${index + 6}`,
      place,
      x: SECOND_SPRINGBOARD_X + offset.dx,
      y: offset.y,
    })),
  ];
}

export const AUTHORED_SPARKLES_BY_PLACE: Record<StarStop, readonly StarSparkle[]> = {
  garden: createPlaceSparkles("garden"),
  lacewood: createPlaceSparkles("lacewood"),
  abbey: createPlaceSparkles("abbey"),
  clouds: createPlaceSparkles("clouds"),
  peak: createPlaceSparkles("peak"),
  sea: createPlaceSparkles("sea"),
  castle: createPlaceSparkles("castle"),
};

export const DEFAULT_ROSE_GARDEN_SPARKLES: readonly StarSparkle[] = AUTHORED_SPARKLES_BY_PLACE.garden;

export const AUTHORED_SPARKLES: readonly StarSparkle[] = STAR_STOPS.flatMap(
  (stop) => AUTHORED_SPARKLES_BY_PLACE[stop]
);

export function getPlaceSparkles(place: StarStop): readonly StarSparkle[] {
  return AUTHORED_SPARKLES_BY_PLACE[place];
}

export interface RunnerState {
  x: number;
  y: number;
  velocityY: number;
  isGrounded: boolean;
  isFluttering: boolean;
  mode: RunnerMode;
  stumbleRemaining: number;
  courseCompleted: boolean;
  stumbledObstacles: string[];
  nearMissObstacles: string[];
  bouncedSpringboards: string[];
  collectedSparkles: string[];
  sparkleStreak: number;
  arrivedAtArchway: boolean;
  pausedForReunion: boolean;
}

export function createRunnerState(
  overrides?: Partial<RunnerState>,
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG
): RunnerState {
  return {
    x: 0,
    y: config.groundY,
    velocityY: 0,
    isGrounded: true,
    isFluttering: false,
    mode: "galloping",
    stumbleRemaining: 0,
    courseCompleted: false,
    stumbledObstacles: [],
    nearMissObstacles: [],
    bouncedSpringboards: [],
    collectedSparkles: [],
    sparkleStreak: 0,
    arrivedAtArchway: false,
    pausedForReunion: false,
    ...overrides,
  };
}

export function triggerPlayfulStumble(
  state: RunnerState,
  duration = DEFAULT_RUNNER_CONFIG.stumbleDuration
): RunnerState {
  return {
    ...state,
    mode: "stumbling",
    stumbleRemaining: duration,
  };
}

export interface ObstacleEncounterResult {
  state: RunnerState;
  stumbledObstacle?: PlayfulObstacle;
  nearMissObstacle?: PlayfulObstacle;
}

function hasHorizontalOverlap(
  playerX: number,
  playerRadiusX: number,
  targetX: number,
  targetWidth: number
): boolean {
  const targetLeft = targetX - targetWidth / 2;
  const targetRight = targetX + targetWidth / 2;
  const playerLeft = playerX - playerRadiusX;
  const playerRight = playerX + playerRadiusX;
  return playerRight >= targetLeft && playerLeft <= targetRight;
}

export function checkObstacleEncounters(
  state: RunnerState,
  obstacles: readonly PlayfulObstacle[],
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG
): ObstacleEncounterResult {
  let currentState = state;
  let stumbledObstacle: PlayfulObstacle | undefined;
  let nearMissObstacle: PlayfulObstacle | undefined;

  const playerRadiusX = 16;

  for (const obstacle of obstacles) {
    if (!hasHorizontalOverlap(currentState.x, playerRadiusX, obstacle.x, obstacle.width)) {
      continue;
    }

    const obsTop = obstacle.y - obstacle.height;
    const hasStumbled = currentState.stumbledObstacles.includes(obstacle.id);
    const hasNearMissed = currentState.nearMissObstacles.includes(obstacle.id);

    // Collision check: player is touching or inside the obstacle height
    if (currentState.y > obsTop) {
      if (!hasStumbled && !hasNearMissed) {
        stumbledObstacle = obstacle;
        currentState = {
          ...triggerPlayfulStumble(currentState, config.stumbleDuration),
          stumbledObstacles: [...currentState.stumbledObstacles, obstacle.id],
        };
      }
    } else if (!hasStumbled && !hasNearMissed) {
      // Clean leap over the obstacle
      const proximityWindow = obsTop - config.nearMissProximity;
      if (currentState.y >= proximityWindow) {
        nearMissObstacle = obstacle;
        currentState = {
          ...currentState,
          nearMissObstacles: [...currentState.nearMissObstacles, obstacle.id],
        };
      }
    }
  }

  return {
    state: currentState,
    stumbledObstacle,
    nearMissObstacle,
  };
}

export interface SpringboardEncounterResult {
  state: RunnerState;
  bouncedSpringboard?: Springboard;
}

export function checkSpringboardEncounters(
  state: RunnerState,
  springboards: readonly Springboard[],
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG
): SpringboardEncounterResult {
  let currentState = state;
  let bouncedSpringboard: Springboard | undefined;

  const playerRadiusX = 16;

  for (const springboard of springboards) {
    if (!hasHorizontalOverlap(currentState.x, playerRadiusX, springboard.x, springboard.width)) {
      continue;
    }

    const hasBounced = currentState.bouncedSpringboards.includes(springboard.id);
    const isOnOrNearGround =
      currentState.isGrounded || currentState.y >= config.groundY - config.groundContactTolerance;

    if (!hasBounced && isOnOrNearGround) {
      bouncedSpringboard = springboard;
      currentState = {
        ...currentState,
        isGrounded: false,
        velocityY: config.springboardVelocity,
        mode: "jumping",
        bouncedSpringboards: [...currentState.bouncedSpringboards, springboard.id],
      };
      break;
    }
  }

  return {
    state: currentState,
    bouncedSpringboard,
  };
}

export interface SparkleEncounterResult {
  state: RunnerState;
  collectedSparkle?: StarSparkle;
}

export function checkSparkleEncounters(
  state: RunnerState,
  sparkles: readonly StarSparkle[],
  collectionRadius = 40,
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG
): SparkleEncounterResult {
  let currentState = state;
  let collectedSparkle: StarSparkle | undefined;

  for (const sparkle of sparkles) {
    if (currentState.collectedSparkles.includes(sparkle.id)) {
      continue;
    }

    const radius = sparkle.radius ?? collectionRadius;
    const dx = currentState.x - sparkle.x;
    const playerCenterY = currentState.y - config.playerCenterOffsetY;
    const dy = playerCenterY - sparkle.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq <= radius * radius) {
      collectedSparkle = sparkle;
      currentState = {
        ...currentState,
        collectedSparkles: [...currentState.collectedSparkles, sparkle.id],
        sparkleStreak: currentState.sparkleStreak + 1,
      };
      break;
    }
  }

  return {
    state: currentState,
    collectedSparkle,
  };
}

export interface ArchwayEncounterResult {
  state: RunnerState;
  archwayArrival?: RainbowArchway;
}

export function checkArchwayArrival(
  state: RunnerState,
  archway: RainbowArchway
): ArchwayEncounterResult {
  if (!state.arrivedAtArchway && state.x >= archway.x) {
    return {
      state: {
        ...state,
        arrivedAtArchway: true,
        pausedForReunion: true,
        courseCompleted: true,
      },
      archwayArrival: archway,
    };
  }
  return { state };
}

export function getSpriteAnimationState(state: RunnerState): SpriteAnimationState {
  if (state.mode === "stumbling" || state.stumbleRemaining > 0) {
    return "stumble";
  }
  if (state.isGrounded) {
    return "gallop";
  }
  if (state.mode === "fluttering" || state.isFluttering) {
    return "flutter";
  }
  return "leap";
}

export function handleJumpInput(
  state: RunnerState,
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG
): RunnerState {
  if (state.isGrounded) {
    return {
      ...state,
      isGrounded: false,
      velocityY: config.jumpVelocity,
      mode: "jumping",
    };
  }

  // Airborne flap impulse
  return {
    ...state,
    isGrounded: false,
    velocityY: config.flapVelocity,
    mode: "flapping",
  };
}

export function updateRunner(
  state: RunnerState,
  deltaSeconds: number,
  flutterHeld = false,
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG
): RunnerState {
  if (state.pausedForReunion) {
    return state;
  }

  let nextStumbleRemaining = state.stumbleRemaining;
  let speedMultiplier = 1;

  if (state.stumbleRemaining > 0) {
    const recoveryWindow = config.stumbleDuration * (2 / 3);
    if (state.stumbleRemaining >= recoveryWindow) {
      speedMultiplier = config.stumbleSpeedMultiplier;
    } else {
      const recoveryProgress = 1 - state.stumbleRemaining / recoveryWindow;
      speedMultiplier = config.stumbleSpeedMultiplier + (1 - config.stumbleSpeedMultiplier) * recoveryProgress;
    }
    nextStumbleRemaining = Math.max(0, state.stumbleRemaining - deltaSeconds);
  }

  const nextX = state.x + config.forwardSpeed * speedMultiplier * deltaSeconds;
  let nextY = state.y;
  let nextVelocityY = state.velocityY;
  let nextGrounded = state.isGrounded;
  let nextIsFluttering = false;
  const isStumbling = nextStumbleRemaining > 0;

  if (!state.isGrounded) {
    if (flutterHeld && nextVelocityY >= 0 && !isStumbling) {
      nextIsFluttering = true;
      nextVelocityY = Math.min(
        nextVelocityY + config.gravity * 0.25 * deltaSeconds,
        config.flutterMaxFallSpeed
      );
    } else {
      nextIsFluttering = false;
      nextVelocityY = Math.min(
        nextVelocityY + config.gravity * deltaSeconds,
        config.maxFallSpeed
      );
    }

    nextY += nextVelocityY * deltaSeconds;

    if (nextY <= config.ceilingY) {
      nextY = config.ceilingY;
      nextVelocityY = Math.max(0, nextVelocityY);
    } else if (nextY >= config.groundY) {
      nextY = config.groundY;
      nextVelocityY = 0;
      nextGrounded = true;
      nextIsFluttering = false;
    }
  }

  let nextMode: RunnerMode;
  if (isStumbling) {
    nextMode = "stumbling";
  } else if (nextGrounded) {
    nextMode = "galloping";
  } else if (nextIsFluttering) {
    nextMode = "fluttering";
  } else if (nextVelocityY > 0) {
    nextMode = "falling";
  } else {
    nextMode = state.mode === "flapping" ? "flapping" : "jumping";
  }

  const nextCourseCompleted = state.courseCompleted || nextX >= config.courseLength;
  const nextSparkleStreak = nextGrounded ? 0 : state.sparkleStreak;

  return {
    ...state,
    x: nextX,
    y: nextY,
    velocityY: nextVelocityY,
    isGrounded: nextGrounded,
    isFluttering: nextIsFluttering,
    mode: nextMode,
    stumbleRemaining: nextStumbleRemaining,
    courseCompleted: nextCourseCompleted,
    sparkleStreak: nextSparkleStreak,
  };
}
