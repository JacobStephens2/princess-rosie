export type PuppetPiece = "backWing" | "body" | "frontWing";

export const PUPPET_PIECE_ORDER: readonly PuppetPiece[] = [
  "backWing",
  "body",
  "frontWing",
] as const;

export const PUPPET_BASE_SCALE = 0.92;

export const PUPPET_DIMENSIONS = {
  width: 384,
  height: 256,
} as const;

/**
 * Normalized body origin (pivot).
 * - X: 0.48 centers the body/saddle around the runner coordinate.
 * - Y: 910 / 1024 (~0.8887) aligns Stella's hooves precisely with the ground plane.
 */
export const BODY_ORIGIN = {
  x: 0.48,
  y: 910 / 1024,
} as const;

/**
 * Normalized attachment joint coordinates in texture space [0..1].
 * - Front wing joint: shoulder / upper chest (844 / 1536, 520 / 1024)
 * - Back wing joint: withers behind dress (540 / 1536, 395 / 1024)
 */
export const FRONT_WING_PIVOT = {
  x: 844 / 1536,
  y: 520 / 1024,
} as const;

export const BACK_WING_PIVOT = {
  x: 540 / 1536,
  y: 395 / 1024,
} as const;

/**
 * Compute the local container position offset for a wing so that rotating around
 * its pivot coincides with the anatomical attachment joint on the body.
 */
export function getWingAttachmentOffset(piece: "frontWing" | "backWing"): { x: number; y: number } {
  const pivot = piece === "frontWing" ? FRONT_WING_PIVOT : BACK_WING_PIVOT;
  return {
    x: (pivot.x - BODY_ORIGIN.x) * PUPPET_DIMENSIONS.width,
    y: (pivot.y - BODY_ORIGIN.y) * PUPPET_DIMENSIONS.height,
  };
}

import { getSpriteAnimationState, type RunnerState } from "./gallop-and-flutter";

/**
 * Wing stroke rate during flutter-glide: one full stroke per second.
 */
const FLUTTER_STROKES_PER_SECOND = 1;
const FLUTTER_ANGULAR_VELOCITY = FLUTTER_STROKES_PER_SECOND * 2 * Math.PI;

export type PuppetAnimationName =
  | "rosie-stella-gallop"
  | "rosie-stella-leap"
  | "rosie-stella-flutter"
  | "rosie-stella-stumble";

/**
 * Derives the puppet presentation state name from current runner state.
 */
export function getPuppetAnimationName(state: RunnerState): PuppetAnimationName {
  const animState = getSpriteAnimationState(state);
  return `rosie-stella-${animState}` as PuppetAnimationName;
}

export interface PuppetKinematicState {
  readonly animationName: PuppetAnimationName;
  readonly containerRotation: number;
  readonly bobOffsetY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly frontWingRotation: number;
  readonly backWingRotation: number;
  readonly wasGrounded: boolean;
  readonly gallopPhase: number;
  readonly flutterPhase: number;
  readonly stumbleTimer: number;
  readonly squashTimer: number;
}

export function createPuppetKinematicState(
  overrides: Partial<PuppetKinematicState> = {}
): PuppetKinematicState {
  return {
    animationName: "rosie-stella-gallop",
    containerRotation: 0,
    bobOffsetY: 0,
    scaleX: PUPPET_BASE_SCALE,
    scaleY: PUPPET_BASE_SCALE,
    frontWingRotation: 0.24,
    backWingRotation: 0.18,
    wasGrounded: true,
    gallopPhase: 0,
    flutterPhase: 0,
    stumbleTimer: 0,
    squashTimer: 0,
    ...overrides,
  };
}

function lerp(start: number, target: number, t: number): number {
  return start + (target - start) * Math.min(1, Math.max(0, t));
}

const SQUASH_DURATION = 0.24;

export function updatePuppetKinematics(
  state: PuppetKinematicState,
  runner: RunnerState,
  deltaSeconds: number
): PuppetKinematicState {
  const animationName = getPuppetAnimationName(runner);
  const justLanded = !state.wasGrounded && runner.isGrounded;

  let squashTimer = justLanded
    ? Math.max(0, SQUASH_DURATION - deltaSeconds)
    : Math.max(0, state.squashTimer - deltaSeconds);
  let scaleX = PUPPET_BASE_SCALE;
  let scaleY = PUPPET_BASE_SCALE;

  if (squashTimer > 0) {
    const p = 1 - squashTimer / SQUASH_DURATION;
    const s = Math.sin(p * Math.PI) * Math.exp(-p * 2.8);
    scaleY = PUPPET_BASE_SCALE * (1 - 0.14 * s);
    scaleX = PUPPET_BASE_SCALE * (1 + 0.10 * s);
  }

  let gallopPhase = state.gallopPhase;
  let flutterPhase = state.flutterPhase;
  let stumbleTimer = state.stumbleTimer;
  let bobOffsetY = 0;
  let targetContainerRot = 0;
  let targetFrontWing = 0.24;
  let targetBackWing = 0.18;

  if (animationName === "rosie-stella-stumble") {
    stumbleTimer += deltaSeconds;
    targetContainerRot = Math.sin(stumbleTimer * 24) * 0.16;
    if (runner.isGrounded) {
      targetFrontWing = 0.24;
      targetBackWing = 0.18;
    } else {
      targetFrontWing = -0.05;
      targetBackWing = -0.08;
    }
  } else if (animationName === "rosie-stella-flutter") {
    flutterPhase += deltaSeconds * FLUTTER_ANGULAR_VELOCITY;
    targetFrontWing = Math.sin(flutterPhase) * 0.38;
    targetBackWing = -Math.sin(flutterPhase) * 0.35;
    bobOffsetY = -Math.sin(flutterPhase) * 1.5;
    stumbleTimer = 0;
  } else if (animationName === "rosie-stella-leap") {
    // Airborne (leap / fall)
    targetContainerRot = Math.min(Math.max(runner.velocityY * 0.00045, -0.15), 0.18);
    targetFrontWing = -0.05;
    targetBackWing = -0.08;
    stumbleTimer = 0;
  } else {
    // Grounded (gallop)
    gallopPhase += deltaSeconds * 14;
    bobOffsetY = Math.sin(gallopPhase) * 3.5;
    targetContainerRot = Math.sin(gallopPhase) * 0.02;
    targetFrontWing = 0.24;
    targetBackWing = 0.18;
    stumbleTimer = 0;
  }

  const isFluttering = animationName === "rosie-stella-flutter";
  const isStumbling = animationName === "rosie-stella-stumble";

  const containerRotation = isStumbling
    ? targetContainerRot
    : lerp(state.containerRotation, targetContainerRot, Math.min(1, deltaSeconds * 14));

  const frontWingRotation = isFluttering
    ? targetFrontWing
    : lerp(state.frontWingRotation, targetFrontWing, Math.min(1, deltaSeconds * 14));

  const backWingRotation = isFluttering
    ? targetBackWing
    : lerp(state.backWingRotation, targetBackWing, Math.min(1, deltaSeconds * 14));

  return {
    animationName,
    containerRotation,
    bobOffsetY,
    scaleX,
    scaleY,
    frontWingRotation,
    backWingRotation,
    wasGrounded: runner.isGrounded,
    gallopPhase,
    flutterPhase,
    stumbleTimer,
    squashTimer,
  };
}
