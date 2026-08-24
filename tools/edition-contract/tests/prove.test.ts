import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { prepareEditionPack, proveEditionPack } from "../src/editionContract";

const tracerPackRoot = fileURLToPath(new URL("../../../shared/edition", import.meta.url));
const tracerScenarioPath = fileURLToPath(
  new URL("../../../shared/edition/parity/tracer-bullet.json", import.meta.url),
);

type TestSoundEvent = {
  event: string;
  context: Record<string, string | boolean>;
};

async function readTracerSoundEvents(): Promise<TestSoundEvent[]> {
  const scenario = JSON.parse(await readFile(tracerScenarioPath, "utf8")) as {
    requiredSoundEvents: TestSoundEvent[];
  };
  return scenario.requiredSoundEvents;
}

const tracerFacts = {
  birthdayStars: ["birthday-star.lacewood"],
  rainbowPaths: ["rainbow-path.lacewood"],
  singleRoute: "single-route.lacewood",
  flightControlBindings: ["keyboard.space", "pointer.primary"],
  flightControlImmediate: true,
  flightControlCycles: 3,
  singleRouteDurationSeconds: 18.0,
  safeLimitsPreserveForwardMotion: true,
  observedInteractions: ["silver-ribbons", "rose-lights"],
  canonicalCelebrationEcho: "silver-ribbons-and-rose-lights",
  birthdayStarGuaranteed: true,
  cloudRestPreservesProgress: true,
  cloudRestAutomaticResume: true,
  cloudRestGentleHelpLevel: 1,
  cloudRestMaximumGentleHelpLevel: 2,
  gentleHelpVisibleToChild: false,
  journeyProgressPersisted: false,
  networkRequests: 0,
};

describe("Edition Contract proof", () => {
  test("accepts the complete opening-to-flight semantic sequence", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);
    const soundEvents: TestSoundEvent[] = [
      {
        event: "sound-event.opening-storybook-moment",
        context: { moment: "opening.celebration-preparations" },
      },
      {
        event: "sound-event.opening-storybook-moment",
        context: { moment: "opening.scattered-stars" },
      },
      {
        event: "sound-event.opening-storybook-moment",
        context: { moment: "opening.departure" },
      },
      { event: "sound-event.flight-launch", context: {} },
      { event: "sound-event.movement-state", context: { state: "flight" } },
      { event: "sound-event.movement-state", context: { state: "rise" } },
      { event: "sound-event.movement-state", context: { state: "glide" } },
      { event: "sound-event.replay", context: { destination: "opening-storybook" } },
      { event: "sound-event.sound-preference-changed", context: { enabled: false } },
      { event: "sound-event.sound-preference-changed", context: { enabled: true } },
    ];

    const proof = await proveEditionPack(tracerPackRoot, prepared, {
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "opening-flight",
      soundEvents,
      facts: {
        openingImageryReadOnly: true,
        openingMomentCount: 3,
        birthdayStarCount: 7,
        celebrationPreparationHost: "Gigi",
        promiseKeepers: ["Princess Rosie", "Stella"],
        waitsForPlayerIntent: true,
        playerActionBindings: ["keyboard.space", "pointer.primary"],
        overlapDeduplicated: true,
        automaticForwardMotion: true,
        frameRateIndependent: true,
        transparentCharacterLayer: true,
        continuousMovementLayers: 1,
        genericConfirmationOverlap: false,
        networkRequests: 0,
      },
    });

    expect(proof).toMatchObject({
      scenarioId: "opening-flight",
      status: "passed",
      failures: [],
    });
  });

  test("accepts the contract-declared Lacewood tracer evidence", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);
    const tracerSoundEvents = await readTracerSoundEvents();

    const proof = await proveEditionPack(tracerPackRoot, prepared, {
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
      soundEvents: tracerSoundEvents,
      facts: tracerFacts,
    });

    expect(proof).toEqual({
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
      status: "passed",
      failures: [],
    });
  });

  test("rejects sound events emitted in the wrong order", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);
    const tracerSoundEvents = await readTracerSoundEvents();
    const outOfOrderEvents = [...tracerSoundEvents];
    const silverRibbonIndex = outOfOrderEvents.findIndex(
      ({ event, context }) =>
        event === "sound-event.vignette-interaction"
        && context.interaction === "silver-ribbons",
    );
    const roseLightIndex = outOfOrderEvents.findIndex(
      ({ event, context }) =>
        event === "sound-event.vignette-interaction" && context.interaction === "rose-lights",
    );
    const silverRibbonEvent = outOfOrderEvents[silverRibbonIndex];
    const roseLightEvent = outOfOrderEvents[roseLightIndex];
    if (!silverRibbonEvent || !roseLightEvent) {
      throw new Error("Tracer interaction events are missing");
    }
    outOfOrderEvents[silverRibbonIndex] = roseLightEvent;
    outOfOrderEvents[roseLightIndex] = silverRibbonEvent;

    const proof = await proveEditionPack(tracerPackRoot, prepared, {
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
      soundEvents: outOfOrderEvents,
      facts: tracerFacts,
    });

    expect(proof).toMatchObject({
      status: "failed",
      failures: [
        {
          fact: "soundEvents",
          expected: tracerSoundEvents,
          actual: outOfOrderEvents,
        },
      ],
    });
  });
});
