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
      facts: {
        birthdayStars: ["birthday-star.lacewood"],
        rainbowPaths: ["rainbow-path.lacewood"],
        chosenPathRecorded: true,
        cloudRestPreservesProgress: true,
        networkRequests: 0,
      },
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
    outOfOrderEvents.splice(26, 2, tracerSoundEvents[27]!, tracerSoundEvents[26]!);

    const proof = await proveEditionPack(tracerPackRoot, prepared, {
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
      soundEvents: outOfOrderEvents,
      facts: {
        birthdayStars: ["birthday-star.lacewood"],
        rainbowPaths: ["rainbow-path.lacewood"],
        chosenPathRecorded: true,
        cloudRestPreservesProgress: true,
        networkRequests: 0,
      },
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
