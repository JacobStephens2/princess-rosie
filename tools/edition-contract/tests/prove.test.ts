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
  chosenPathRecorded: true,
  cloudRestPreservesProgress: true,
  networkRequests: 0,
};

describe("Edition Contract proof", () => {
  test("accepts conforming Godot Lacewood tracer evidence", async () => {
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
    const shimmerIndex = outOfOrderEvents.findIndex(
      ({ event, context }) =>
        event === "sound-event.journey-history-shimmer" && context.route === "lacewood.floor",
    );
    const selectionIndex = outOfOrderEvents.findIndex(
      ({ event, context }) =>
        event === "sound-event.path-choice-selected" && context.route === "lacewood.floor",
    );
    const shimmerEvent = outOfOrderEvents[shimmerIndex];
    const selectionEvent = outOfOrderEvents[selectionIndex];
    if (!shimmerEvent || !selectionEvent) throw new Error("Tracer route events are missing");
    outOfOrderEvents[shimmerIndex] = selectionEvent;
    outOfOrderEvents[selectionIndex] = shimmerEvent;

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
