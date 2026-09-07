import { describe, expect, test } from "vitest";
import { STAR_STOPS, type StarStop } from "./journey";
import {
  calculateSceneryLayerOffset,
  getPlaceScenery,
  getPlaceLayers,
  validatePlaceScenery,
  validateAllPlaceScenery,
} from "./scenery";

describe("calculateSceneryLayerOffset", () => {
  describe("factor zero (fixed layer)", () => {
    test("returns 0 regardless of runner position", () => {
      expect(calculateSceneryLayerOffset(0, 0)).toBe(0);
      expect(calculateSceneryLayerOffset(100, 0)).toBe(0);
      expect(calculateSceneryLayerOffset(500, 0)).toBe(0);
      expect(calculateSceneryLayerOffset(2500, 0)).toBe(0);
      expect(calculateSceneryLayerOffset(4500, 0)).toBe(0);
    });
  });

  describe("factor one (full speed layer)", () => {
    test("returns layer offset equal to runner position", () => {
      expect(calculateSceneryLayerOffset(0, 1)).toBe(0);
      expect(calculateSceneryLayerOffset(100, 1)).toBe(100);
      expect(calculateSceneryLayerOffset(350, 1)).toBe(350);
      expect(calculateSceneryLayerOffset(2000, 1)).toBe(2000);
      expect(calculateSceneryLayerOffset(4500, 1)).toBe(4500);
    });
  });

  describe("fractional factors (traveling Scenery Layers)", () => {
    test("returns exact proportional offset for 0.5 (middle layer)", () => {
      expect(calculateSceneryLayerOffset(0, 0.5)).toBe(0);
      expect(calculateSceneryLayerOffset(100, 0.5)).toBe(50);
      expect(calculateSceneryLayerOffset(500, 0.5)).toBe(250);
      expect(calculateSceneryLayerOffset(4500, 0.5)).toBe(2250);
    });

    test("returns exact proportional offset for 0.2 (ADR-0023 far layer speed)", () => {
      expect(calculateSceneryLayerOffset(0, 0.2)).toBe(0);
      expect(calculateSceneryLayerOffset(100, 0.2)).toBe(20);
      expect(calculateSceneryLayerOffset(500, 0.2)).toBe(100);
      expect(calculateSceneryLayerOffset(4500, 0.2)).toBe(900);
    });

    test("handles quarter and fractional intervals accurately", () => {
      expect(calculateSceneryLayerOffset(200, 0.25)).toBe(50);
      expect(calculateSceneryLayerOffset(300, 1 / 3)).toBeCloseTo(100, 5);
      expect(calculateSceneryLayerOffset(800, 0.75)).toBe(600);
    });
  });

  describe("edge cases", () => {
    test("returns 0 when runner position is 0 for any factor", () => {
      expect(calculateSceneryLayerOffset(0, 0)).toBe(0);
      expect(calculateSceneryLayerOffset(0, 0.5)).toBe(0);
      expect(calculateSceneryLayerOffset(0, 1)).toBe(0);
    });
  });
});

describe("Place Scenery data declaration", () => {
  test("every place declares three Scenery Layers: far, middle, and near in order", () => {
    for (const place of STAR_STOPS) {
      const scenery = getPlaceScenery(place);
      expect(scenery).toBeDefined();
      expect(scenery.place).toBe(place);
      expect(scenery.layers).toHaveLength(3);

      const [far, middle, near] = scenery.layers;
      expect(far?.depth).toBe("far");
      expect(middle?.depth).toBe("middle");
      expect(near?.depth).toBe("near");
    }
  });

  test("Rose Garden declares three Scenery Layers with distinct factors and authored Set Pieces", () => {
    const garden = getPlaceScenery("garden");
    expect(garden.layers).toHaveLength(3);

    const [far, middle, near] = garden.layers;
    expect(far?.depth).toBe("far");
    expect(far?.depthFactor).toBe(0.2);
    expect(far?.paintingAssetId).toBe("garden.far-layer");
    expect(far?.setPieces).toEqual([]);

    expect(middle?.depth).toBe("middle");
    expect(middle?.depthFactor).toBe(0.5);
    expect(middle?.setPieces).toHaveLength(5);
    const middleAssetIds = middle!.setPieces.map((p) => p.assetId);
    expect(new Set(middleAssetIds).size).toBe(middleAssetIds.length);
    const archCluster = middle?.setPieces.find((p) => p.assetId === "garden.arch-cluster");
    expect(archCluster).toBeDefined();
    expect(archCluster?.positionAlongCourse).toBe(2890);

    expect(near?.depth).toBe("near");
    expect(near?.depthFactor).toBe(1.0);
    expect(near?.setPieces).toHaveLength(3);
    const nearAssetIds = near!.setPieces.map((p) => p.assetId);
    expect(new Set(nearAssetIds).size).toBe(nearAssetIds.length);
  });

  test("other places initially declare their existing painting as a single fixed far layer with factor 0", () => {
    const otherPlaces: StarStop[] = ["lacewood", "abbey", "clouds", "peak", "sea", "castle"];
    const expectedPaintings: Record<StarStop, string> = {
      garden: "garden.far-layer",
      lacewood: "lacewood.background",
      abbey: "abbey.background",
      clouds: "cloister.background",
      peak: "pellegrino-peak.background",
      sea: "sapphire-sea.background",
      castle: "celebration.castle-approach",
    };

    for (const place of otherPlaces) {
      const scenery = getPlaceScenery(place);
      const farLayer = scenery.layers[0]!;
      expect(farLayer.depth).toBe("far");
      expect(farLayer.depthFactor).toBe(0);
      expect(farLayer.paintingAssetId).toBe(expectedPaintings[place]);
      expect(farLayer.setPieces).toEqual([]);
    }
  });

  test("other places initially declare middle and near layers with distinct depth factors and empty Set Piece lists", () => {
    const otherPlaces: StarStop[] = ["lacewood", "abbey", "clouds", "peak", "sea", "castle"];
    for (const place of otherPlaces) {
      const scenery = getPlaceScenery(place);
      const middleLayer = scenery.layers[1]!;
      const nearLayer = scenery.layers[2]!;

      expect(middleLayer.depth).toBe("middle");
      expect(middleLayer.depthFactor).toBe(0.5);
      expect(middleLayer.setPieces).toEqual([]);

      expect(nearLayer.depth).toBe("near");
      expect(nearLayer.depthFactor).toBe(1.0);
      expect(nearLayer.setPieces).toEqual([]);
    }
  });

  test("getPlaceLayers helper returns layers for a given place", () => {
    const layers = getPlaceLayers("garden");
    expect(layers).toHaveLength(3);
    expect(layers[0]?.depth).toBe("far");
    expect(layers[0]?.depthFactor).toBe(0.2);
  });
});

describe("Place Scenery data validation", () => {
  test("validates all authored place scenery successfully", () => {
    expect(() => validateAllPlaceScenery()).not.toThrow();
  });

  test("rejects place data with missing layers", () => {
    const incomplete = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: 0, setPieces: [] },
      ],
    };
    expect(() => validatePlaceScenery(incomplete as any)).toThrow(
      /must declare three Scenery Layers: far, middle, and near/i
    );
  });

  test("rejects layer with missing setPieces list", () => {
    const missingSetPieces = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: 0 },
        { depth: "middle" as const, depthFactor: 0.5, setPieces: [] },
        { depth: "near" as const, depthFactor: 1.0, setPieces: [] },
      ],
    };
    expect(() => validatePlaceScenery(missingSetPieces as any)).toThrow(/must declare a setPieces list/i);
  });

  test("rejects invalid depth factor (negative or NaN)", () => {
    const invalidFactor = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: -0.5, setPieces: [] },
        { depth: "middle" as const, depthFactor: 0.5, setPieces: [] },
        { depth: "near" as const, depthFactor: 1.0, setPieces: [] },
      ],
    };
    expect(() => validatePlaceScenery(invalidFactor)).toThrow(/invalid depth factor/i);
  });

  test("rejects unknown painting asset id not in derivative manifest", () => {
    const unknownPainting = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: 0, paintingAssetId: "non-existent.painting", setPieces: [] },
        { depth: "middle" as const, depthFactor: 0.5, setPieces: [] },
        { depth: "near" as const, depthFactor: 1.0, setPieces: [] },
      ],
    };
    expect(() => validatePlaceScenery(unknownPainting)).toThrow(/unknown asset id: "non-existent.painting"/i);
  });

  test("rejects unknown set piece asset id not in derivative manifest", () => {
    const unknownSetPiece = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: 0, paintingAssetId: "flight.rose-garden-background", setPieces: [] },
        {
          depth: "middle" as const,
          depthFactor: 0.5,
          setPieces: [
            { assetId: "unknown.set-piece", positionAlongCourse: 1000, groundAnchor: 1.0 },
          ],
        },
        { depth: "near" as const, depthFactor: 1.0, setPieces: [] },
      ],
    };
    expect(() => validatePlaceScenery(unknownSetPiece)).toThrow(/unknown asset id: "unknown.set-piece"/i);
  });

  test("rejects set piece with position before course start (< 0)", () => {
    const negativePosition = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: 0, paintingAssetId: "flight.rose-garden-background", setPieces: [] },
        {
          depth: "middle" as const,
          depthFactor: 0.5,
          setPieces: [
            { assetId: "flight.rose-garden-background", positionAlongCourse: -50, groundAnchor: 1.0 },
          ],
        },
        { depth: "near" as const, depthFactor: 1.0, setPieces: [] },
      ],
    };
    expect(() => validatePlaceScenery(negativePosition)).toThrow(/outside course bounds/i);
  });

  test("rejects set piece with position beyond course length", () => {
    const beyondCourse = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: 0, paintingAssetId: "flight.rose-garden-background", setPieces: [] },
        {
          depth: "middle" as const,
          depthFactor: 0.5,
          setPieces: [
            { assetId: "flight.rose-garden-background", positionAlongCourse: 5000, groundAnchor: 1.0 },
          ],
        },
        { depth: "near" as const, depthFactor: 1.0, setPieces: [] },
      ],
    };
    // DEFAULT_RUNNER_CONFIG.courseLength is 4500
    expect(() => validatePlaceScenery(beyondCourse, { courseLength: 4500 })).toThrow(/outside course bounds/i);
  });

  test("accepts set pieces at course boundary positions (0 and courseLength)", () => {
    const boundaryScenery = {
      place: "garden" as StarStop,
      layers: [
        { depth: "far" as const, depthFactor: 0, paintingAssetId: "flight.rose-garden-background", setPieces: [] },
        {
          depth: "middle" as const,
          depthFactor: 0.5,
          setPieces: [
            { assetId: "flight.rose-garden-background", positionAlongCourse: 0, groundAnchor: 1.0 },
            { assetId: "flight.rose-garden-background", positionAlongCourse: 4500, groundAnchor: 1.0 },
          ],
        },
        { depth: "near" as const, depthFactor: 1.0, setPieces: [] },
      ],
    };
    expect(() => validatePlaceScenery(boundaryScenery, { courseLength: 4500 })).not.toThrow();
  });
});

