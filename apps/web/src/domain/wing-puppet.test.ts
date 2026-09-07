import { describe, expect, test } from "vitest";
import {
  PUPPET_PIECE_ORDER,
  PUPPET_BASE_SCALE,
  PUPPET_DIMENSIONS,
  BODY_ORIGIN,
  FRONT_WING_PIVOT,
  BACK_WING_PIVOT,
  getWingAttachmentOffset,
  getPuppetAnimationName,
} from "./wing-puppet";
import { createRunnerState } from "./gallop-and-flutter";

describe("wing-puppet piece and draw-order configuration", () => {
  test("draw order is strictly back wing, body, front wing", () => {
    expect(PUPPET_PIECE_ORDER).toEqual(["backWing", "body", "frontWing"]);
  });

  test("puppet base scale matches today's visual presence against Storybook Ground", () => {
    expect(PUPPET_BASE_SCALE).toBe(0.92);
  });

  test("puppet dimensions match prepared 384x256 character layer size", () => {
    expect(PUPPET_DIMENSIONS).toEqual({ width: 384, height: 256 });
  });

  test("body origin places hooves on the ground line and centers the character", () => {
    expect(BODY_ORIGIN.x).toBeCloseTo(0.48, 2);
    expect(BODY_ORIGIN.y).toBeCloseTo(910 / 1024, 3);
  });

  test("wing attachment offsets place pivots at the exact anatomy joints relative to body origin", () => {
    const frontOffset = getWingAttachmentOffset("frontWing");
    const backOffset = getWingAttachmentOffset("backWing");

    const expectedFrontX = (FRONT_WING_PIVOT.x - BODY_ORIGIN.x) * PUPPET_DIMENSIONS.width;
    const expectedFrontY = (FRONT_WING_PIVOT.y - BODY_ORIGIN.y) * PUPPET_DIMENSIONS.height;
    expect(frontOffset.x).toBeCloseTo(expectedFrontX, 2);
    expect(frontOffset.y).toBeCloseTo(expectedFrontY, 2);

    const expectedBackX = (BACK_WING_PIVOT.x - BODY_ORIGIN.x) * PUPPET_DIMENSIONS.width;
    const expectedBackY = (BACK_WING_PIVOT.y - BODY_ORIGIN.y) * PUPPET_DIMENSIONS.height;
    expect(backOffset.x).toBeCloseTo(expectedBackX, 2);
    expect(backOffset.y).toBeCloseTo(expectedBackY, 2);
  });
});

describe("wing-puppet animation states and kinematics mapping", () => {
  test("reports the four required presentation animation state names matching runner states", () => {
    const grounded = createRunnerState({ isGrounded: true, mode: "galloping" });
    expect(getPuppetAnimationName(grounded)).toBe("rosie-stella-gallop");

    const airborne = createRunnerState({ isGrounded: false, mode: "jumping" });
    expect(getPuppetAnimationName(airborne)).toBe("rosie-stella-leap");

    const flutter = createRunnerState({ isGrounded: false, mode: "fluttering", isFluttering: true });
    expect(getPuppetAnimationName(flutter)).toBe("rosie-stella-flutter");

    const stumble = createRunnerState({ isGrounded: true, mode: "stumbling", stumbleRemaining: 0.5 });
    expect(getPuppetAnimationName(stumble)).toBe("rosie-stella-stumble");
  });
});

describe("wing-puppet kinematics controller", () => {
  test("gallop produces whole-puppet bob and folds wings down", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState();
    const runner = createRunnerState({ isGrounded: true, mode: "galloping" });

    // Step a few frames to observe gallop bobbing
    const bobs: number[] = [];
    for (let i = 0; i < 10; i++) {
      state = updatePuppetKinematics(state, runner, 0.05);
      bobs.push(state.bobOffsetY);
    }

    // Bobbing offset should not be constant (it oscillates)
    const minBob = Math.min(...bobs);
    const maxBob = Math.max(...bobs);
    expect(maxBob - minBob).toBeGreaterThan(1.0);

    // Wings should be folded when grounded (positive rotation angles folding down/back)
    expect(state.frontWingRotation).toBeGreaterThan(0.1);
    expect(state.backWingRotation).toBeGreaterThan(0.08);
  });

  test("leap and fall tilts puppet according to vertical velocity and spreads wings", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState();

    // Rising (leap upward, velocityY < 0)
    const risingRunner = createRunnerState({ isGrounded: false, mode: "jumping", velocityY: -350 });
    for (let i = 0; i < 5; i++) {
      state = updatePuppetKinematics(state, risingRunner, 0.05);
    }
    // Upward tilt (negative rotation)
    expect(state.containerRotation).toBeLessThan(0);
    // Continue past initial leap propulsion flap (0.5s total) to observe spread wings
    for (let i = 0; i < 6; i++) {
      state = updatePuppetKinematics(state, risingRunner, 0.05);
    }
    // Wings spread/lifted (not folded down)
    expect(state.frontWingRotation).toBeLessThanOrEqual(0.05);

    // Falling (velocityY > 0)
    const fallingRunner = createRunnerState({ isGrounded: false, mode: "falling", velocityY: 350 });
    for (let i = 0; i < 5; i++) {
      state = updatePuppetKinematics(state, fallingRunner, 0.05);
    }
    // Downward tilt (positive rotation)
    expect(state.containerRotation).toBeGreaterThan(0);
  });

  test("landing triggers whole-puppet squash and stretch that rebounds back", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState();

    // In the air
    const airborneRunner = createRunnerState({ isGrounded: false, mode: "falling", velocityY: 200 });
    state = updatePuppetKinematics(state, airborneRunner, 0.1);
    expect(state.scaleY).toBeCloseTo(PUPPET_BASE_SCALE, 3);

    // Touchdown on ground
    const landingRunner = createRunnerState({ isGrounded: true, mode: "galloping", velocityY: 0 });
    state = updatePuppetKinematics(state, landingRunner, 0.04);

    // Immediately after landing: squashed vertically (scaleY decreased) and stretched horizontally (scaleX increased)
    expect(state.scaleY).toBeLessThan(PUPPET_BASE_SCALE);
    expect(state.scaleX).toBeGreaterThan(PUPPET_BASE_SCALE);

    // After recovery time (~0.3s), scales recover back to PUPPET_BASE_SCALE
    for (let i = 0; i < 10; i++) {
      state = updatePuppetKinematics(state, landingRunner, 0.05);
    }
    expect(state.scaleY).toBeCloseTo(PUPPET_BASE_SCALE, 2);
    expect(state.scaleX).toBeCloseTo(PUPPET_BASE_SCALE, 2);
  });

  test("playful stumble produces rotational wobble", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState();
    const stumbleRunner = createRunnerState({
      isGrounded: true,
      mode: "stumbling",
      stumbleRemaining: 0.6,
    });

    const rotations: number[] = [];
    for (let i = 0; i < 8; i++) {
      state = updatePuppetKinematics(state, stumbleRunner, 0.04);
      rotations.push(state.containerRotation);
    }

    // Wobble should alternate or oscillate
    const maxRot = Math.max(...rotations);
    const minRot = Math.min(...rotations);
    expect(maxRot - minRot).toBeGreaterThan(0.05);

    // Wings remain folded while grounded in stumble per AC
    expect(state.frontWingRotation).toBeGreaterThan(0.1);
    expect(state.backWingRotation).toBeGreaterThan(0.08);
  });

  test("flutter flaps wings with periodic sweep", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState();
    const flutterRunner = createRunnerState({
      isGrounded: false,
      mode: "fluttering",
      isFluttering: true,
      velocityY: -40,
    });

    const wingAngles: number[] = [];
    for (let i = 0; i < 20; i++) {
      state = updatePuppetKinematics(state, flutterRunner, 0.03);
      wingAngles.push(state.frontWingRotation);
    }

    const maxWing = Math.max(...wingAngles);
    const minWing = Math.min(...wingAngles);
    // Flapping range is noticeable (at least ~0.25 rad / 15 deg)
    expect(maxWing - minWing).toBeGreaterThan(0.25);
  });

  test("flutter wing stroke completes a full cycle in 1.0 second (one stroke per second)", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState({ flutterPhase: 0 });
    const flutterRunner = createRunnerState({
      isGrounded: false,
      mode: "fluttering",
      isFluttering: true,
      velocityY: -40,
    });

    const stepDelta = 0.05;
    const simulateSeconds = (durationSeconds: number) => {
      const steps = Math.round(durationSeconds / stepDelta);
      for (let i = 0; i < steps; i++) {
        state = updatePuppetKinematics(state, flutterRunner, stepDelta);
      }
    };

    // Transition into initial flutter state (t = 0)
    state = updatePuppetKinematics(state, flutterRunner, 0);
    const initialFrontWing = state.frontWingRotation;
    const initialBackWing = state.backWingRotation;
    const initialBob = state.bobOffsetY;

    // Step across 1.0 second (1 full wing stroke cycle at 1 stroke/s)
    simulateSeconds(1.0);

    // In 1.0 second, flutterPhase advances by exactly 2*PI radians (one full stroke cycle)
    expect(state.flutterPhase).toBeCloseTo(2 * Math.PI, 4);

    // Front wing, back wing, and body bob return to starting cycle phase
    expect(state.frontWingRotation).toBeCloseTo(initialFrontWing, 4);
    expect(state.backWingRotation).toBeCloseTo(initialBackWing, 4);
    expect(state.bobOffsetY).toBeCloseTo(initialBob, 4);

    // Both wings sweep down in unison at peak downstroke (t = 0.25s), lifting body upward
    let downstrokeState = createPuppetKinematicState({ flutterPhase: 0 });
    downstrokeState = updatePuppetKinematics(downstrokeState, flutterRunner, 0.25);
    // Front wing rotates clockwise (+) to sweep down; back wing rotates counter-clockwise (-) to sweep down
    expect(downstrokeState.frontWingRotation).toBeGreaterThan(0.3);
    expect(downstrokeState.backWingRotation).toBeLessThan(-0.3);
    expect(downstrokeState.bobOffsetY).toBeLessThan(-1.0);

    // Step across another 1.0 second (total 2.0s elapsed: second full stroke cycle completes)
    simulateSeconds(1.0);
    expect(state.flutterPhase).toBeCloseTo(4 * Math.PI, 4);
    expect(state.frontWingRotation).toBeCloseTo(initialFrontWing, 4);
    expect(state.backWingRotation).toBeCloseTo(initialBackWing, 4);
    expect(state.bobOffsetY).toBeCloseTo(initialBob, 4);
  });

  test("ground jump triggers a powerful unison wing flap propelling into the leap", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState({ wasGrounded: true });
    const jumpingRunner = createRunnerState({ isGrounded: false, mode: "jumping", velocityY: -440 });

    // Step to peak downstroke (0.25s)
    for (let i = 0; i < 5; i++) {
      state = updatePuppetKinematics(state, jumpingRunner, 0.05);
    }

    // Wings flap down in unison and body lifts
    expect(state.frontWingRotation).toBeGreaterThan(0.3);
    expect(state.backWingRotation).toBeLessThan(-0.3);
    expect(state.bobOffsetY).toBeLessThan(-1.0);

    // Step to end of flap stroke (0.5s total)
    for (let i = 0; i < 5; i++) {
      state = updatePuppetKinematics(state, jumpingRunner, 0.05);
    }

    // Wings return to spread leap/glide pose
    expect(state.frontWingRotation).toBeLessThanOrEqual(0.05);
    expect(state.backWingRotation).toBeLessThanOrEqual(0.05);
  });

  test("airborne flap impulse triggers a powerful unison wing flap propelling upward", async () => {
    const { createPuppetKinematicState, updatePuppetKinematics } = await import("./wing-puppet");
    let state = createPuppetKinematicState({
      wasGrounded: false,
      previousMode: "falling",
      previousVelocityY: 200,
    });
    const flappedRunner = createRunnerState({
      isGrounded: false,
      mode: "flapping",
      velocityY: -320,
    });

    // Step to peak downstroke (0.25s)
    for (let i = 0; i < 5; i++) {
      state = updatePuppetKinematics(state, flappedRunner, 0.05);
    }

    // Wings flap down in unison and body lifts
    expect(state.frontWingRotation).toBeGreaterThan(0.3);
    expect(state.backWingRotation).toBeLessThan(-0.3);
    expect(state.bobOffsetY).toBeLessThan(-1.0);

    // Step to end of flap stroke (0.5s total)
    for (let i = 0; i < 5; i++) {
      state = updatePuppetKinematics(state, flappedRunner, 0.05);
    }

    // Wings return to spread glide pose
    expect(state.frontWingRotation).toBeLessThanOrEqual(0.05);
    expect(state.backWingRotation).toBeLessThanOrEqual(0.05);
  });
});


