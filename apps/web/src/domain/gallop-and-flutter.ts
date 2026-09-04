import type { StarStop } from "./journey";

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

export type ObstacleType = "rose-bush";

export interface PlayfulObstacle {
  id: string;
  place: StarStop;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RunnerConfig {
  groundY: number;
  ceilingY: number;
  forwardSpeed: number;
  jumpVelocity: number;
  flapVelocity: number;
  gravity: number;
  maxFallSpeed: number;
  flutterMaxFallSpeed: number;
  courseLength: number;
  stumbleDuration: number;
  stumbleSpeedMultiplier: number;
  nearMissProximity: number;
}

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  groundY: 560,
  ceilingY: 80,
  forwardSpeed: 200,
  jumpVelocity: -450,
  flapVelocity: -320,
  gravity: 900,
  maxFallSpeed: 450,
  flutterMaxFallSpeed: 90,
  courseLength: 1450,
  stumbleDuration: 0.6,
  stumbleSpeedMultiplier: 0.6,
  nearMissProximity: 100,
};

export const DEFAULT_ROSE_GARDEN_OBSTACLES: readonly PlayfulObstacle[] = [
  {
    id: "garden-rose-bush-1",
    place: "garden",
    type: "rose-bush",
    x: 840,
    y: DEFAULT_RUNNER_CONFIG.groundY,
    width: 50,
    height: 40,
  },
  {
    id: "garden-rose-bush-2",
    place: "garden",
    type: "rose-bush",
    x: 1200,
    y: DEFAULT_RUNNER_CONFIG.groundY,
    width: 50,
    height: 40,
  },
];

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
    const obsLeft = obstacle.x - obstacle.width / 2;
    const obsRight = obstacle.x + obstacle.width / 2;
    const obsTop = obstacle.y - obstacle.height;
    const playerLeft = currentState.x - playerRadiusX;
    const playerRight = currentState.x + playerRadiusX;

    const horizontalOverlap = playerRight >= obsLeft && playerLeft <= obsRight;

    if (!horizontalOverlap) {
      continue;
    }

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
  };
}
