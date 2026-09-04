import { describe, expect, test } from "vitest";
import { collectBirthdayStar, createJourney } from "./journey";
import {
  createRunnerState,
  handleJumpInput,
  updateRunner,
  DEFAULT_RUNNER_CONFIG,
} from "./gallop-and-flutter";

describe("Gallop and Flutter Runner", () => {
  test("Princess Rosie and Stella gallop forward automatically along Storybook Ground", () => {
    const initial = createRunnerState();

    expect(initial.isGrounded).toBe(true);
    expect(initial.mode).toBe("galloping");
    expect(initial.y).toBe(DEFAULT_RUNNER_CONFIG.groundY);
    expect(initial.velocityY).toBe(0);

    const advanced = updateRunner(initial, 0.5, false);

    expect(advanced.x).toBeGreaterThan(initial.x);
    expect(advanced.y).toBe(DEFAULT_RUNNER_CONFIG.groundY);
    expect(advanced.isGrounded).toBe(true);
    expect(advanced.mode).toBe("galloping");
    expect(advanced.x).toBe(initial.x + DEFAULT_RUNNER_CONFIG.forwardSpeed * 0.5);
  });

  test("tapping while grounded triggers an immediate, responsive jump", () => {
    const initial = createRunnerState();
    const jumped = handleJumpInput(initial);

    expect(jumped.isGrounded).toBe(false);
    expect(jumped.mode).toBe("jumping");
    expect(jumped.velocityY).toBe(DEFAULT_RUNNER_CONFIG.jumpVelocity);

    const airborne = updateRunner(jumped, 0.1, false);
    expect(airborne.y).toBeLessThan(initial.y);
    expect(airborne.isGrounded).toBe(false);
  });

  test("sustaining input while airborne slows downward descent into a gentle flutter-glide", () => {
    // Runner is airborne and cresting/falling
    const airborne = createRunnerState({
      isGrounded: false,
      y: 350,
      velocityY: 50,
      mode: "falling",
    });

    const fluttering = updateRunner(airborne, 0.4, true);
    const falling = updateRunner(airborne, 0.4, false);

    expect(fluttering.isFluttering).toBe(true);
    expect(fluttering.mode).toBe("fluttering");
    expect(fluttering.velocityY).toBeLessThanOrEqual(DEFAULT_RUNNER_CONFIG.flutterMaxFallSpeed);

    expect(falling.isFluttering).toBe(false);
    expect(falling.mode).toBe("falling");
    expect(falling.velocityY).toBeGreaterThan(fluttering.velocityY);
    expect(fluttering.y).toBeLessThan(falling.y);
  });

  test("releasing sustained input while airborne resumes normal falling descent", () => {
    const fluttering = createRunnerState({
      isGrounded: false,
      y: 350,
      velocityY: 90,
      isFluttering: true,
      mode: "fluttering",
    });

    const released = updateRunner(fluttering, 0.2, false);
    expect(released.isFluttering).toBe(false);
    expect(released.mode).toBe("falling");
    expect(released.velocityY).toBeGreaterThan(DEFAULT_RUNNER_CONFIG.flutterMaxFallSpeed);
  });

  test("tapping again while airborne provides an upward wing-flap impulse capped below ceiling", () => {
    // Airborne moving downwards
    const airborne = createRunnerState({
      isGrounded: false,
      y: 300,
      velocityY: 100,
      mode: "falling",
    });

    const flapped = handleJumpInput(airborne);
    expect(flapped.mode).toBe("flapping");
    expect(flapped.velocityY).toBe(DEFAULT_RUNNER_CONFIG.flapVelocity);

    // Flapping near the ceiling should not allow crossing above ceilingY
    const nearCeiling = createRunnerState({
      isGrounded: false,
      y: DEFAULT_RUNNER_CONFIG.ceilingY + 10,
      velocityY: DEFAULT_RUNNER_CONFIG.flapVelocity,
      mode: "flapping",
    });

    const updatedNearCeiling = updateRunner(nearCeiling, 0.1, false);
    expect(updatedNearCeiling.y).toBeGreaterThanOrEqual(DEFAULT_RUNNER_CONFIG.ceilingY);
    expect(updatedNearCeiling.velocityY).toBeGreaterThanOrEqual(0);
  });

  test("landing on Storybook Ground immediately returns Stella to galloping forward", () => {
    const falling = createRunnerState({
      isGrounded: false,
      y: DEFAULT_RUNNER_CONFIG.groundY - 5,
      velocityY: 300,
      mode: "falling",
    });

    const landed = updateRunner(falling, 0.1, true);

    expect(landed.isGrounded).toBe(true);
    expect(landed.y).toBe(DEFAULT_RUNNER_CONFIG.groundY);
    expect(landed.velocityY).toBe(0);
    expect(landed.isFluttering).toBe(false);
    expect(landed.mode).toBe("galloping");
    expect(landed.x).toBeGreaterThan(falling.x);
  });

  test("navigating through the garden course to the end triggers place completion in domain state", () => {
    let journey = createJourney();
    expect(journey.collectedStars).not.toContain("garden");

    // Runner near end of course
    const nearEnd = createRunnerState({
      x: DEFAULT_RUNNER_CONFIG.courseLength - 10,
    });

    const completed = updateRunner(nearEnd, 0.1, false);

    expect(completed.x).toBeGreaterThanOrEqual(DEFAULT_RUNNER_CONFIG.courseLength);
    expect(completed.courseCompleted).toBe(true);

    // Domain state transition on course completion
    journey = collectBirthdayStar(journey, "garden");
    expect(journey.collectedStars).toContain("garden");
    expect(journey.openRainbowPaths).toContain("garden");
  });
});
