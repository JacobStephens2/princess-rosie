import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { prepareEditionPack } from "../src/editionContract";

const tracerPackRoot = fileURLToPath(new URL("../../../shared/edition", import.meta.url));

describe("Edition Contract", () => {
  test("prepares the frozen Lacewood tracer Edition Pack", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);

    expect(prepared).toEqual({
      contractVersion: "rosie-edition-contract/1",
      revision: "tracer-lacewood-1",
      packDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      scenarioIds: ["tracer-bullet"],
    });
  });
});
