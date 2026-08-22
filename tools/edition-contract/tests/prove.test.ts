import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { prepareEditionPack, proveEditionPack } from "../src/editionContract";

const tracerPackRoot = fileURLToPath(new URL("../../../shared/edition", import.meta.url));

describe("Edition Contract proof", () => {
  test("accepts conforming Godot Lacewood tracer evidence", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);

    const proof = await proveEditionPack(tracerPackRoot, prepared, {
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
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
});
