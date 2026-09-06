import { describe, expect, test } from "vitest";
import {
  STOP_STORIES,
  resolveDerivativePath,
  getFamilyGuestDerivativePath,
  getBirthdayStarDerivativePath,
  getRainbowPathDerivativePath,
} from "./content";
import { FAMILY_GUESTS } from "../domain/journey";
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

  test("all 7 Family Guests resolve through the derivative manifest", () => {
    for (const guest of FAMILY_GUESTS) {
      const path = getFamilyGuestDerivativePath(guest);
      expect(path).toBe(`/assets/derivatives/family-guest.${guest.toLowerCase()}.webp`);

      const entry = derivativeManifest.derivatives.find((d) => d.path === path);
      expect(entry).toBeDefined();
      expect(entry?.role).toBe("character-layer");
      expect(entry?.id).toBe(`family-guest.${guest.toLowerCase()}`);
    }
  });

  test("painted Birthday Star resolves through the derivative manifest", () => {
    const path = getBirthdayStarDerivativePath();
    expect(path).toBe("/assets/derivatives/journey.birthday-star.webp");

    const entry = derivativeManifest.derivatives.find((d) => d.path === path);
    expect(entry).toBeDefined();
    expect(entry?.role).toBe("sprite");
    expect(entry?.id).toBe("journey.birthday-star");
  });

  test("painted Rainbow Path resolves through the derivative manifest", () => {
    const path = getRainbowPathDerivativePath();
    expect(path).toBe("/assets/derivatives/journey.rainbow-path.webp");

    const entry = derivativeManifest.derivatives.find((d) => d.path === path);
    expect(entry).toBeDefined();
    expect(entry?.role).toBe("treatment");
    expect(entry?.id).toBe("journey.rainbow-path");
  });

  test("all 7 stops declare three Scenery Layers with valid derivatives", () => {
    for (const stop of STOP_STORIES) {
      expect(stop.layers).toHaveLength(3);
      const [far, middle, near] = stop.layers;
      expect(far?.depth).toBe("far");
      expect(far?.depthFactor).toBe(0);
      expect(far?.paintingAssetId).toBeDefined();
      expect(resolveDerivativePath(far!.paintingAssetId!)).toBe(stop.placeIllustration);

      expect(middle?.depth).toBe("middle");
      expect(middle?.depthFactor).toBe(0.5);
      expect(middle?.setPieces).toEqual([]);

      expect(near?.depth).toBe("near");
      expect(near?.depthFactor).toBe(1.0);
      expect(near?.setPieces).toEqual([]);
    }
  });
});

