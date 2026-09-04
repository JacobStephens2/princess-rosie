import { describe, expect, test } from "vitest";
import { collectBirthdayStar, createJourney } from "./journey";
import {
  createRunnerState,
  handleJumpInput,
  updateRunner,
  triggerPlayfulStumble,
  getSpriteAnimationState,
  DEFAULT_RUNNER_CONFIG,
  DEFAULT_ROSE_GARDEN_OBSTACLES,
  checkObstacleEncounters,
  type PlayfulObstacle,
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

  describe("Sprite Animation Pipeline and State Transitions", () => {
    test("maps grounded galloping state to gallop animation", () => {
      const grounded = createRunnerState({ isGrounded: true, mode: "galloping" });
      expect(getSpriteAnimationState(grounded)).toBe("gallop");
    });

    test("maps jump launch and upward crest to leap animation", () => {
      const leaping = createRunnerState({
        isGrounded: false,
        velocityY: DEFAULT_RUNNER_CONFIG.jumpVelocity,
        mode: "jumping",
      });
      expect(getSpriteAnimationState(leaping)).toBe("leap");

      const flapping = createRunnerState({
        isGrounded: false,
        velocityY: DEFAULT_RUNNER_CONFIG.flapVelocity,
        mode: "flapping",
      });
      expect(getSpriteAnimationState(flapping)).toBe("leap");
    });

    test("maps sustained airborne flight to flutter animation", () => {
      const fluttering = createRunnerState({
        isGrounded: false,
        velocityY: 50,
        isFluttering: true,
        mode: "fluttering",
      });
      expect(getSpriteAnimationState(fluttering)).toBe("flutter");
    });

    test("triggering a Playful Stumble slows speed and maps to stumble animation", () => {
      const galloping = createRunnerState({ isGrounded: true, mode: "galloping" });
      const stumbled = triggerPlayfulStumble(galloping);

      expect(stumbled.mode).toBe("stumbling");
      expect(stumbled.stumbleRemaining).toBeGreaterThan(0);
      expect(getSpriteAnimationState(stumbled)).toBe("stumble");

      // Verify speed reduction during stumble
      const gallopDelta = updateRunner(galloping, 0.2, false);
      const stumbleDelta = updateRunner(stumbled, 0.2, false);
      const gallopDistance = gallopDelta.x - galloping.x;
      const stumbleDistance = stumbleDelta.x - stumbled.x;

      expect(stumbleDistance).toBeLessThan(gallopDistance);
      expect(stumbleDistance).toBeCloseTo(gallopDistance * 0.6, 2);
    });

    test("Playful Stumble recovers smoothly back to gallop", () => {
      const galloping = createRunnerState({ isGrounded: true, mode: "galloping" });
      const stumbled = triggerPlayfulStumble(galloping, 0.4);

      // Halfway through stumble
      const midStumble = updateRunner(stumbled, 0.2, false);
      expect(midStumble.mode).toBe("stumbling");
      expect(midStumble.stumbleRemaining).toBeCloseTo(0.2, 2);
      expect(getSpriteAnimationState(midStumble)).toBe("stumble");

      // Complete stumble duration
      const recovered = updateRunner(midStumble, 0.25, false);
      expect(recovered.mode).toBe("galloping");
      expect(recovered.stumbleRemaining).toBe(0);
      expect(getSpriteAnimationState(recovered)).toBe("gallop");
    });

    test("landing from a leap or flutter returns to gallop animation without popping", () => {
      const airborne = createRunnerState({
        isGrounded: false,
        y: DEFAULT_RUNNER_CONFIG.groundY - 10,
        velocityY: 200,
        mode: "falling",
      });
      expect(getSpriteAnimationState(airborne)).toBe("leap");

      const landed = updateRunner(airborne, 0.1, false);
      expect(landed.isGrounded).toBe(true);
      expect(getSpriteAnimationState(landed)).toBe("gallop");
    });
  });

  describe("Playful Obstacles, Stumble Friction, and Near Miss Shimmers", () => {
    test("place-appropriate playful obstacles populate the Storybook Ground", () => {
      expect(DEFAULT_ROSE_GARDEN_OBSTACLES).toBeDefined();
      expect(DEFAULT_ROSE_GARDEN_OBSTACLES.length).toBeGreaterThanOrEqual(2);

      DEFAULT_ROSE_GARDEN_OBSTACLES.forEach((obstacle) => {
        expect(obstacle.place).toBe("garden");
        expect(obstacle.type).toBe("rose-bush");
        expect(obstacle.y).toBe(DEFAULT_RUNNER_CONFIG.groundY);
        expect(obstacle.x).toBeGreaterThan(200);
        expect(obstacle.x).toBeLessThan(DEFAULT_RUNNER_CONFIG.courseLength);
        expect(obstacle.width).toBeGreaterThan(0);
        expect(obstacle.height).toBeGreaterThan(0);
      });
    });

    test("colliding with an obstacle triggers a Playful Stumble without failure states", () => {
      const obstacle: PlayfulObstacle = {
        id: "test-bush-1",
        place: "garden",
        type: "rose-bush",
        x: 400,
        y: DEFAULT_RUNNER_CONFIG.groundY,
        width: 60,
        height: 55,
      };

      const approaching = createRunnerState({
        x: 390,
        y: DEFAULT_RUNNER_CONFIG.groundY,
        isGrounded: true,
        mode: "galloping",
      });

      const result = checkObstacleEncounters(approaching, [obstacle]);

      expect(result.stumbledObstacle?.id).toBe("test-bush-1");
      expect(result.state.mode).toBe("stumbling");
      expect(result.state.stumbleRemaining).toBe(DEFAULT_RUNNER_CONFIG.stumbleDuration);
      expect(result.state.stumbledObstacles).toContain("test-bush-1");

      // Invariant: no game-over, life deduction, damage, or restart states
      expect(result.state.courseCompleted).toBe(false);
      expect(result.state.x).toBe(approaching.x);
      expect("lives" in result.state).toBe(false);
      expect("health" in result.state).toBe(false);
    });

    test("forward velocity smoothly recovers to normal galloping speed after a stumble", () => {
      const stateInitialStumble = createRunnerState({
        mode: "stumbling",
        stumbleRemaining: 0.6,
      });

      const step1 = updateRunner(stateInitialStumble, 0.1, false);
      const speed1 = (step1.x - stateInitialStumble.x) / 0.1;
      expect(speed1).toBeCloseTo(DEFAULT_RUNNER_CONFIG.forwardSpeed * 0.6, 1);

      const stateMidRecovery = createRunnerState({
        mode: "stumbling",
        stumbleRemaining: 0.2,
      });
      const stepMid = updateRunner(stateMidRecovery, 0.1, false);
      const speedMid = (stepMid.x - stateMidRecovery.x) / 0.1;

      expect(speedMid).toBeGreaterThan(speed1);
      expect(speedMid).toBeLessThan(DEFAULT_RUNNER_CONFIG.forwardSpeed);

      const stateRecovered = createRunnerState({
        mode: "galloping",
        stumbleRemaining: 0,
      });
      const stepRecovered = updateRunner(stateRecovered, 0.1, false);
      const speedRecovered = (stepRecovered.x - stateRecovered.x) / 0.1;
      expect(speedRecovered).toBeCloseTo(DEFAULT_RUNNER_CONFIG.forwardSpeed, 1);
    });

    test("leaping cleanly over an obstacle within proximity threshold triggers Near Miss", () => {
      const obstacle: PlayfulObstacle = {
        id: "test-bush-2",
        place: "garden",
        type: "rose-bush",
        x: 600,
        y: DEFAULT_RUNNER_CONFIG.groundY,
        width: 60,
        height: 55,
      };

      // Obstacle top is 560 - 55 = 505.
      // Proximity threshold is 100, so y in [405, 505] qualifies for Near Miss.
      const leapingNearMiss = createRunnerState({
        x: 600,
        y: 470, // 35px above obstacle top -> cleanly over and within proximity!
        isGrounded: false,
        mode: "jumping",
      });

      const result = checkObstacleEncounters(leapingNearMiss, [obstacle]);

      expect(result.stumbledObstacle).toBeUndefined();
      expect(result.nearMissObstacle?.id).toBe("test-bush-2");
      expect(result.state.nearMissObstacles).toContain("test-bush-2");
      expect(result.state.stumbleRemaining).toBe(0);
      expect(result.state.mode).toBe("jumping");
    });

    test("leaping too high above the proximity threshold clears the obstacle without triggering Near Miss", () => {
      const obstacle: PlayfulObstacle = {
        id: "test-bush-3",
        place: "garden",
        type: "rose-bush",
        x: 600,
        y: DEFAULT_RUNNER_CONFIG.groundY,
        width: 60,
        height: 55,
      };

      // Obstacle top is 505. High flight near ceiling (y = 200) is far above 405 (the proximity window).
      const leapingHigh = createRunnerState({
        x: 600,
        y: 200,
        isGrounded: false,
        mode: "jumping",
      });

      const result = checkObstacleEncounters(leapingHigh, [obstacle]);

      expect(result.stumbledObstacle).toBeUndefined();
      expect(result.nearMissObstacle).toBeUndefined();
      expect(result.state.nearMissObstacles).not.toContain("test-bush-3");
      expect(result.state.stumbledObstacles).not.toContain("test-bush-3");
    });

    test("an obstacle cannot trigger both Playful Stumble and Near Miss", () => {
      const obstacle: PlayfulObstacle = {
        id: "test-bush-4",
        place: "garden",
        type: "rose-bush",
        x: 600,
        y: DEFAULT_RUNNER_CONFIG.groundY,
        width: 60,
        height: 55,
      };

      // First, runner hits the obstacle
      const colliding = createRunnerState({
        x: 600,
        y: DEFAULT_RUNNER_CONFIG.groundY,
        isGrounded: true,
      });

      const stumbleResult = checkObstacleEncounters(colliding, [obstacle]);
      expect(stumbleResult.stumbledObstacle?.id).toBe("test-bush-4");

      // Even if runner subsequently jumps while still near the obstacle, it doesn't give near miss
      const jumpedAfterStumble = {
        ...stumbleResult.state,
        y: 470,
        isGrounded: false,
      };

      const secondResult = checkObstacleEncounters(jumpedAfterStumble, [obstacle]);
      expect(secondResult.nearMissObstacle).toBeUndefined();
      expect(secondResult.state.nearMissObstacles).not.toContain("test-bush-4");

      // Conversely, an obstacle that earned Near Miss cannot subsequently trigger a stumble upon descending/landing
      const clearLeap = createRunnerState({
        x: 600,
        y: 470,
        isGrounded: false,
      });
      const nearMissResult = checkObstacleEncounters(clearLeap, [obstacle]);
      expect(nearMissResult.nearMissObstacle?.id).toBe("test-bush-4");

      const landedAfterNearMiss = {
        ...nearMissResult.state,
        y: DEFAULT_RUNNER_CONFIG.groundY,
        isGrounded: true,
      };
      const landedResult = checkObstacleEncounters(landedAfterNearMiss, [obstacle]);
      expect(landedResult.stumbledObstacle).toBeUndefined();
      expect(landedResult.state.stumbledObstacles).not.toContain("test-bush-4");
    });
  });
});

