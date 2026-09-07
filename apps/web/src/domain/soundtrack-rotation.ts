export interface FlightSoundtrack {
  readonly id: string;
  readonly title: string;
  readonly src: string;
  readonly style: string;
}

export interface CelebrationTheme {
  readonly id: string;
  readonly title: string;
  readonly src: string;
}

export interface SoundtrackCatalog {
  readonly flightTracks: readonly FlightSoundtrack[];
  readonly celebrationTheme: CelebrationTheme;
}

export const DEFAULT_SOUNDTRACK_CATALOG: SoundtrackCatalog = {
  flightTracks: [
    {
      id: "birthday-flight",
      title: "Birthday Flight (Waltz)",
      src: "/assets/audio/birthday-flight.mp3",
      style: "waltz",
    },
    {
      id: "pastoral-lilt",
      title: "Pastoral Lilt",
      src: "/assets/audio/pastoral-lilt.mp3",
      style: "pastoral",
    },
    {
      id: "playful-bounce",
      title: "Playful Marimba and Celesta",
      src: "/assets/audio/playful-bounce.mp3",
      style: "playful",
    },
    {
      id: "soaring-flight",
      title: "Epic Soaring Flight",
      src: "/assets/audio/soaring-flight.mp3",
      style: "soaring",
    },
  ],
  celebrationTheme: {
    id: "celebration-theme",
    title: "Birthday Castle Celebration Theme",
    src: "/assets/audio/celebration-theme.mp3",
  },
};

export interface SoundtrackPlaylistState {
  readonly catalog: SoundtrackCatalog;
  readonly currentTrack: FlightSoundtrack;
  readonly lastPlayedId: string;
  readonly queue: readonly string[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export const SOUNDTRACK_STORAGE_KEY = "rosie.soundtrack-rotation";

export interface PlaylistOptions {
  readonly random?: () => number;
  readonly storage?: StorageLike;
}

export function savePlaylistState(
  state: SoundtrackPlaylistState,
  storage: StorageLike
): void {
  try {
    const payload = JSON.stringify({
      lastPlayedId: state.lastPlayedId,
      queue: state.queue,
    });
    storage.setItem(SOUNDTRACK_STORAGE_KEY, payload);
  } catch {
    // Ignore storage quota or security errors
  }
}

export function restorePlaylistState(
  catalog: SoundtrackCatalog = DEFAULT_SOUNDTRACK_CATALOG,
  storage: StorageLike
): SoundtrackPlaylistState | null {
  try {
    const raw = storage.getItem(SOUNDTRACK_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const lastPlayedId = typeof parsed.lastPlayedId === "string" ? parsed.lastPlayedId : undefined;
    if (!lastPlayedId) return null;

    const track = catalog.flightTracks.find((t) => t.id === lastPlayedId);
    if (!track) return null;

    const allIds = catalog.flightTracks.map((t) => t.id);
    let queue: string[] = [];

    if (Array.isArray(parsed.queue)) {
      queue = parsed.queue.filter((id: unknown): id is string =>
        typeof id === "string" && allIds.includes(id)
      );
    }


    if (queue.length === 0) {
      queue = shuffleIds(allIds, lastPlayedId);
    }

    return {
      catalog,
      currentTrack: track,
      lastPlayedId: track.id,
      queue,
    };
  } catch {
    return null;
  }
}


export function shuffleIds(
  ids: readonly string[],
  avoidFirstId?: string,
  random: () => number = Math.random
): string[] {
  if (ids.length <= 1) return [...ids];

  const result = [...ids];
  // Standard Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }

  // Guarantee that first item in new cycle does not match avoidFirstId
  if (avoidFirstId && result[0] === avoidFirstId && result.length > 1) {
    const swapIndex = 1 + Math.floor(random() * (result.length - 1));
    const temp = result[0]!;
    result[0] = result[swapIndex]!;
    result[swapIndex] = temp;
  }

  return result;
}

export function createSoundtrackPlaylist(
  catalog: SoundtrackCatalog = DEFAULT_SOUNDTRACK_CATALOG,
  options?: PlaylistOptions
): SoundtrackPlaylistState {
  if (options?.storage) {
    const restored = restorePlaylistState(catalog, options.storage);
    if (restored) return restored;
  }

  const initialTrack = catalog.flightTracks[0];
  if (!initialTrack) {
    throw new Error("Soundtrack catalog must contain at least one flight track");
  }

  const random = options?.random ?? Math.random;
  const otherIds = catalog.flightTracks.slice(1).map((t) => t.id);
  const queue = shuffleIds(otherIds, undefined, random);

  return {
    catalog,
    currentTrack: initialTrack,
    lastPlayedId: initialTrack.id,
    queue,
  };
}


export function advanceSoundtrackPlaylist(
  state: SoundtrackPlaylistState,
  random: () => number = Math.random
): SoundtrackPlaylistState {
  const allIds = state.catalog.flightTracks.map((t) => t.id);

  let nextId: string;
  let nextQueue: string[];

  if (state.queue.length > 0) {
    nextId = state.queue[0]!;
    const remaining = state.queue.slice(1);
    if (remaining.length === 0) {
      // End of cycle reached: generate a new cycle avoiding nextId as the first track
      nextQueue = shuffleIds(allIds, nextId, random);
    } else {
      nextQueue = remaining;
    }
  } else {
    // Queue was empty: generate new cycle avoiding lastPlayedId
    const newCycle = shuffleIds(allIds, state.lastPlayedId, random);
    nextId = newCycle[0]!;
    const remaining = newCycle.slice(1);
    nextQueue = remaining.length === 0 ? shuffleIds(allIds, nextId, random) : remaining;
  }

  const nextTrack = state.catalog.flightTracks.find((t) => t.id === nextId);
  if (!nextTrack) {
    throw new Error(`Track ${nextId} not found in catalog`);
  }

  return {
    catalog: state.catalog,
    currentTrack: nextTrack,
    lastPlayedId: nextId,
    queue: nextQueue,
  };
}

