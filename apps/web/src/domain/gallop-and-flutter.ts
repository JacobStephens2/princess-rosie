export type RunnerMode =
  | "galloping"
  | "jumping"
  | "flapping"
  | "fluttering"
  | "falling";

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
};

export interface RunnerState {
  x: number;
  y: number;
  velocityY: number;
  isGrounded: boolean;
  isFluttering: boolean;
  mode: RunnerMode;
  courseCompleted: boolean;
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
    courseCompleted: false,
    ...overrides,
  };
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
  const nextX = state.x + config.forwardSpeed * deltaSeconds;
  let nextY = state.y;
  let nextVelocityY = state.velocityY;
  let nextGrounded = state.isGrounded;
  let nextIsFluttering = false;
  let nextMode = state.mode;

  if (!state.isGrounded) {
    if (flutterHeld && nextVelocityY >= 0) {
      nextIsFluttering = true;
      nextMode = "fluttering";
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
      if (nextVelocityY > 0) {
        nextMode = "falling";
      }
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
      nextMode = "galloping";
    }
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
    courseCompleted: nextCourseCompleted,
  };
}
