import { describe, expect, test } from "vitest";
import {
  DEFAULT_SOUNDTRACK_CATALOG,
  createSoundtrackPlaylist,
  advanceSoundtrackPlaylist,
  savePlaylistState,
  restorePlaylistState,
} from "./soundtrack-rotation";



describe("Soundtrack catalog and playlist state creation", () => {
  test("maintains a catalog of four flight soundtracks and one celebration theme", () => {
    expect(DEFAULT_SOUNDTRACK_CATALOG.flightTracks).toHaveLength(4);
    expect(DEFAULT_SOUNDTRACK_CATALOG.celebrationTheme).toBeDefined();

    const ids = DEFAULT_SOUNDTRACK_CATALOG.flightTracks.map((track) => track.id);
    expect(ids).toEqual([
      "birthday-flight",
      "pastoral-lilt",
      "playful-bounce",
      "soaring-flight",
    ]);
    expect(DEFAULT_SOUNDTRACK_CATALOG.celebrationTheme.id).toBe("celebration-theme");
  });

  test("initializes playlist with the first track active when no prior state is stored", () => {
    const playlist = createSoundtrackPlaylist(DEFAULT_SOUNDTRACK_CATALOG);
    expect(playlist.currentTrack.id).toBe("birthday-flight");
    expect(playlist.lastPlayedId).toBe("birthday-flight");
    expect(playlist.queue.length).toBeGreaterThan(0);
  });

  test("advances through queue on consecutive journeys without repeating within a cycle", () => {
    let state = createSoundtrackPlaylist(DEFAULT_SOUNDTRACK_CATALOG);
    const played: string[] = [state.currentTrack.id];

    for (let i = 0; i < DEFAULT_SOUNDTRACK_CATALOG.flightTracks.length - 1; i++) {
      state = advanceSoundtrackPlaylist(state);
      played.push(state.currentTrack.id);
    }

    expect(played).toHaveLength(DEFAULT_SOUNDTRACK_CATALOG.flightTracks.length);
    const uniquePlayed = new Set(played);
    expect(uniquePlayed.size).toBe(DEFAULT_SOUNDTRACK_CATALOG.flightTracks.length);
  });

  test("guarantees no track repeats consecutively across cycle boundaries over 100 transitions", () => {
    let state = createSoundtrackPlaylist(DEFAULT_SOUNDTRACK_CATALOG);
    let previousId = state.currentTrack.id;

    for (let i = 0; i < 100; i++) {
      state = advanceSoundtrackPlaylist(state);
      expect(state.currentTrack.id).not.toBe(previousId);
      previousId = state.currentTrack.id;
    }
  });

  test("accepts a deterministic random function for predictable shuffle generation", () => {
    // Constant 0 random function
    const mockRandom = () => 0;
    let state = createSoundtrackPlaylist(DEFAULT_SOUNDTRACK_CATALOG, { random: mockRandom });
    state = advanceSoundtrackPlaylist(state, mockRandom);
    expect(state.currentTrack).toBeDefined();
  });

  test("persists last-played track and queue to storage and restores them on subsequent visits", () => {
    const memoryStorage: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => memoryStorage[key] ?? null,
      setItem: (key: string, val: string) => { memoryStorage[key] = val; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
    };

    let state = createSoundtrackPlaylist(DEFAULT_SOUNDTRACK_CATALOG);
    state = advanceSoundtrackPlaylist(state);
    const advancedTrackId = state.currentTrack.id;
    const advancedQueue = [...state.queue];

    savePlaylistState(state, mockStorage);

    const restored = restorePlaylistState(DEFAULT_SOUNDTRACK_CATALOG, mockStorage);
    expect(restored).not.toBeNull();
    expect(restored?.currentTrack.id).toBe(advancedTrackId);
    expect(restored?.lastPlayedId).toBe(advancedTrackId);
    expect(restored?.queue).toEqual(advancedQueue);
  });

  test("recovers gracefully from empty or corrupted storage without throwing", () => {
    const mockStorage = {
      getItem: () => "invalid-json{",
      setItem: () => {},
      removeItem: () => {},
    };

    const restored = restorePlaylistState(DEFAULT_SOUNDTRACK_CATALOG, mockStorage);
    expect(restored).toBeNull();

    const playlist = createSoundtrackPlaylist(DEFAULT_SOUNDTRACK_CATALOG, { storage: mockStorage });
    expect(playlist.currentTrack.id).toBe("birthday-flight");
  });
});


