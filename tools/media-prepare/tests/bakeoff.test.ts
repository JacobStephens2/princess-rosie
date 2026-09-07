import { describe, expect, it } from "vitest";
import {
  calculateFramePlacements,
  calculateContactSheetLayout,
  recordBakeoffGeneration,
  calculateTotalSpend,
  buildProvenanceManifest,
  type EntrantAssets,
} from "../src/bakeoff";


describe("bakeoff layout geometry", () => {
  it("computes 1280x720 Stage frame placements with rose bush resting on Storybook Ground (y=560)", () => {
    const assets: EntrantAssets = {
      provider: "gpt-image-2",
      farLayerWidth: 3072,
      farLayerHeight: 1024,
      archClusterWidth: 3072,
      archClusterHeight: 1024,
      roseBushWidth: 1024,
      roseBushHeight: 1024,
    };

    const placements = calculateFramePlacements(assets);

    expect(placements.frameWidth).toBe(1280);
    expect(placements.frameHeight).toBe(720);

    // Far layer covers 1280x720
    expect(placements.farLayer.width).toBe(1280);
    expect(placements.farLayer.height).toBe(720);
    expect(placements.farLayer.x).toBe(0);
    expect(placements.farLayer.y).toBe(0);

    // Arch cluster spans Stage width, placed on ground or covering mid-ground
    expect(placements.archCluster.width).toBe(1280);
    expect(placements.archCluster.height).toBe(427); // 1280 / 3 rounded
    expect(placements.archCluster.x).toBe(0);

    // Rose bush cutout sized as an in-game obstacle (e.g. 140px tall) with bottom anchored on Storybook Ground (y=560)
    expect(placements.roseBush.height).toBe(140);
    expect(placements.roseBush.width).toBe(140);
    expect(placements.roseBush.y + placements.roseBush.height).toBe(560);
  });

  it("calculates 3 side-by-side Stage frames for the contact sheet", () => {
    const providers = ["gpt-image-2", "recraft", "flux-2-pro"];
    const layout = calculateContactSheetLayout(providers);

    expect(layout.sheetWidth).toBe(3840); // 1280 * 3
    expect(layout.sheetHeight).toBe(720);
    expect(layout.frames).toHaveLength(3);
    expect(layout.frames[0]).toEqual({ provider: "gpt-image-2", x: 0, y: 0, width: 1280, height: 720 });
    expect(layout.frames[1]).toEqual({ provider: "recraft", x: 1280, y: 0, width: 1280, height: 720 });
    expect(layout.frames[2]).toEqual({ provider: "flux-2-pro", x: 2560, y: 0, width: 1280, height: 720 });
  });
});

describe("bakeoff provenance & spend recording", () => {
  it("records generation metadata and validates required fields", () => {
    const record = recordBakeoffGeneration({
      provider: "gpt-image-2",
      model: "gpt-image-2",
      role: "arch-cluster",
      size: "3072x1024",
      prompt: "Rose Garden arches in picture-book style",
      costUsd: 0.1186,
      outputPath: "shared/edition/source-media/garden/bake-off/gpt-image-2-arch-cluster.png",
      sha256: "dummy-sha256-hash",
    });

    expect(record.provider).toBe("gpt-image-2");
    expect(record.model).toBe("gpt-image-2");
    expect(record.size).toBe("3072x1024");
    expect(record.prompt).toBe("Rose Garden arches in picture-book style");
    expect(record.costUsd).toBe(0.1186);
    expect(record.selection.status).toBe("candidate");
  });

  it("calculates total spend across all generations in USD", () => {
    const generations = [
      { costUsd: 0.1186 },
      { costUsd: 0.2107 },
      { costUsd: 0.04 },
      { costUsd: 0.05 },
    ];

    const total = calculateTotalSpend(generations);
    expect(total).toBe(0.4193);
  });

  it("builds provenance document with candidate status for all assets and never marks approved", () => {
    const generations = [
      recordBakeoffGeneration({
        provider: "gpt-image-2",
        model: "gpt-image-2",
        role: "arch-cluster",
        size: "3072x1024",
        prompt: "Rose Garden arch cluster",
        costUsd: 0.1186,
        outputPath: "shared/edition/source-media/garden/bake-off/gpt-image-2-arch-cluster.png",
        sha256: "hash1",
      }),
      recordBakeoffGeneration({
        provider: "recraft",
        model: "recraftv3",
        role: "rose-bush",
        size: "1024x1024",
        prompt: "Rose bush obstacle",
        costUsd: 0.05,
        outputPath: "shared/edition/source-media/garden/bake-off/recraft-rose-bush.png",
        sha256: "hash2",
      }),
    ];

    const doc = buildProvenanceManifest(generations, "2026-09-07");
    expect(doc.assets).toHaveLength(2);
    for (const asset of doc.assets) {
      expect(asset.selection.status).toBe("candidate");
      expect(asset.selection.status).not.toBe("approved");
    }
  });
});

