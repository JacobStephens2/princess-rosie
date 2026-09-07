import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const openingDir = join(repoRoot, "shared", "edition", "source-media", "opening-storybook");

describe("opening storybook provenance and candidate metadata", () => {
  test("opening celebration preparations provenance records direct gpt-image-2 generation with US provider headquarters", async () => {
    const provPath = join(openingDir, "provenance.json");
    const raw = await readFile(provPath, "utf8");
    const doc = JSON.parse(raw);

    expect(doc.schemaVersion).toBe(1);
    expect(Array.isArray(doc.assets)).toBe(true);

    const asset = doc.assets.find((a: { id: string }) => a.id === "opening.celebration-preparations");
    expect(asset).toBeDefined();
    expect(asset.asset).toBe("celebration-preparations.png");

    // The asset must have direct generation metadata referencing approved finale
    expect(asset.generation).toBeDefined();
    expect(asset.generation.provider).toBe("OpenAI");
    expect(asset.generation.providerHeadquarters).toBe("United States");
    expect(asset.generation.model).toBe("gpt-image-2");
    expect(asset.generation.quality).toBe("high");
    expect(asset.generation.size).toBe("1680x944");
    expect(asset.generation.outputFormat).toBe("png");
    expect(asset.generation.referenceAsset).toContain("birthday-castle-celebration.png");
    expect(asset.generation.prompt).toContain("Gigi");
    expect(asset.generation.prompt).toContain("high chair");
    expect(asset.generation.prompt).toContain("unlit candle");

    // Check sha256 matches actual file on disk
    const imagePath = join(openingDir, asset.asset);
    const imageBytes = await readFile(imagePath);
    const calculatedSha256 = createHash("sha256").update(imageBytes).digest("hex");
    expect(asset.sha256).toBe(calculatedSha256);

    // Selection metadata
    expect(asset.selection).toBeDefined();
    expect(asset.selection.status).toBe("approved");
    expect(asset.selection.ownerManualReview).toBe("approved");
  });

  test("candidates directory contains generation metadata matching image hashes", async () => {
    const candidatesSummaryPath = join(openingDir, "candidates", "candidates_summary.json");
    const summaryRaw = await readFile(candidatesSummaryPath, "utf8");
    const summary = JSON.parse(summaryRaw);

    expect(summary.items.length).toBeGreaterThanOrEqual(2);
    for (const item of summary.items) {
      expect(item.model).toBe("gpt-image-2");
      expect(item.size).toBe("1680x944");
      expect(item.sha256).toBeDefined();
      expect(item.tokens).toBeDefined();
      expect(item.estimatedCostUsd).toBeGreaterThan(0);

      const candidateBytes = await readFile(join(repoRoot, item.output));
      const hash = createHash("sha256").update(candidateBytes).digest("hex");
      expect(item.sha256).toBe(hash);
    }
  });
});
