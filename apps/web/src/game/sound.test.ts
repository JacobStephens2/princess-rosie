import { describe, expect, test } from "vitest";
import { GameAudio, PENTATONIC_SCALE } from "./sound";

describe("GameAudio sound profiles and pentatonic melodies", () => {
  test("defines ascending pentatonic scale frequencies for celesta and harp notes", () => {
    expect(PENTATONIC_SCALE).toBeDefined();
    expect(PENTATONIC_SCALE.length).toBeGreaterThanOrEqual(5);

    // Verify ascending order
    for (let i = 1; i < PENTATONIC_SCALE.length; i++) {
      const current = PENTATONIC_SCALE[i]!;
      const prev = PENTATONIC_SCALE[i - 1]!;
      expect(current).toBeGreaterThan(prev);
    }
  });

  test("can trigger resonant chime for springboard contact", () => {
    const audio = new GameAudio();
    expect(() => audio.play("chime")).not.toThrow();
  });

  test("can play sequential ascending pentatonic sparkle notes", () => {
    const audio = new GameAudio();
    expect(() => audio.playSparkle(0)).not.toThrow();
    expect(() => audio.playSparkle(1)).not.toThrow();
    expect(() => audio.playSparkle(5)).not.toThrow();
  });
});
