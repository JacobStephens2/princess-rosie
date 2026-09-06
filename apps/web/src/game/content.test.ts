import { describe, expect, test } from "vitest";
import { STOP_STORIES, resolveDerivativePath } from "./content";
import derivativeManifest from "../../public/assets/derivative-manifest.json";

describe("content and derivative place illustrations", () => {
  test("resolves derivative paths for valid media IDs", () => {
    const path = resolveDerivativePath("flight.rose-garden-background");
    expect(path).toBe("/assets/derivatives/flight.rose-garden-background.webp");
  });

  test("throws when resolving unknown media ID", () => {
    expect(() => resolveDerivativePath("nonexistent.media.id")).toThrow("Derivative not found");
  });

  test("all 7 place illustrations in STOP_STORIES load through the derivative manifest", () => {
    expect(STOP_STORIES).toHaveLength(7);

    const expectedMappings: Record<string, string> = {
      garden: "/assets/derivatives/flight.rose-garden-background.webp",
      lacewood: "/assets/derivatives/lacewood.background.webp",
      abbey: "/assets/derivatives/abbey.background.webp",
      clouds: "/assets/derivatives/cloister.background.webp",
      peak: "/assets/derivatives/pellegrino-peak.background.webp",
      sea: "/assets/derivatives/sapphire-sea.background.webp",
      castle: "/assets/derivatives/celebration.castle-approach.webp",
    };

    for (const stop of STOP_STORIES) {
      expect(stop.placeIllustration).toBeDefined();
      expect(stop.placeIllustration).toBe(expectedMappings[stop.id]);
      expect(stop.placeIllustration).toMatch(/^\/assets\/derivatives\/.+\.webp$/);

      // Verify the derivative actually exists in derivativeManifest
      const found = derivativeManifest.derivatives.find(
        (entry) => entry.path === stop.placeIllustration,
      );
      expect(found).toBeDefined();
      expect(found?.role).toBe("illustration-layer");
    }
  });

  test("no retired hand-copied PNG illustrations are referenced", () => {
    for (const stop of STOP_STORIES) {
      expect(stop.placeIllustration).not.toMatch(/place-illustration\.png$/);
    }
  });
});
