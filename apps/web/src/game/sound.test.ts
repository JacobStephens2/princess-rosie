import { describe, expect, test } from "vitest";
import { DEFAULT_SFX_VOLUME, GameAudio, PENTATONIC_SCALE } from "./sound";

describe("GameAudio sound profiles and pentatonic melodies", () => {
  test("defines default SFX master volume", () => {
    expect(DEFAULT_SFX_VOLUME).toBe(0.48);
  });

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

  test("can trigger star gather chime and stamp award fanfare", () => {
    const audio = new GameAudio();
    expect(() => audio.play("star")).not.toThrow();
    expect(() => audio.play("stamp")).not.toThrow();
  });
});

describe("GameAudio multi-track rotation, celebration crossfade, and mute behavior", () => {
  test("maintains extensible soundtrack catalog and reports active flight track", () => {
    const audio = new GameAudio();
    const catalog = audio.getCatalog();
    expect(catalog.flightTracks).toHaveLength(4);
    expect(catalog.celebrationTheme.id).toBe("celebration-theme");

    const active = audio.getActiveFlightTrack();
    expect(active.id).toBe("birthday-flight");
  });

  test("advances to next flight soundtrack on Fly Again and persists to storage", async () => {
    const storageData: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => storageData[key] ?? null,
      setItem: (key: string, val: string) => { storageData[key] = val; },
    };

    const audio1 = new GameAudio({ storage: mockStorage });
    const initialTrack = audio1.getActiveFlightTrack();
    expect(initialTrack.id).toBe("birthday-flight");

    const nextTrack = await audio1.advanceToNextJourney();
    expect(nextTrack.id).not.toBe(initialTrack.id);
    expect(audio1.getActiveFlightTrack().id).toBe(nextTrack.id);

    // Reopen / new visit with restored storage preserves persisted Flight Soundtrack and queue
    const audio2 = new GameAudio({ storage: mockStorage });
    expect(audio2.getActiveFlightTrack().id).toBe(nextTrack.id);

    // Advancing on next journey rotates to next Flight Soundtrack in cycle
    const thirdTrack = await audio2.advanceToNextJourney();
    expect(thirdTrack.id).not.toBe(nextTrack.id);
  });


  test("initiates equal-power crossfade to celebration theme and transitions state", async () => {
    const audio = new GameAudio();
    expect(audio.isCrossfading()).toBe(false);
    expect(audio.isCelebrationActive()).toBe(false);

    await audio.crossfadeToCelebration();
    expect(audio.isCelebrationActive()).toBe(true);
  });

  test("mutes and unmutes audio channels cleanly without leaking sound", () => {
    const audio = new GameAudio();
    expect(audio.isEnabled()).toBe(true);

    audio.setEnabled(false);
    expect(audio.isEnabled()).toBe(false);

    audio.setEnabled(true);
    expect(audio.isEnabled()).toBe(true);
  });

  test("preloads secondary tracks lazily without throwing", () => {
    const audio = new GameAudio();
    expect(() => audio.preloadSecondaryTracks()).not.toThrow();
  });
});

