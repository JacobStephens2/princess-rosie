import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { prepareEditionPack } from "../src/editionContract";

const tracerPackRoot = fileURLToPath(new URL("../../../shared/edition", import.meta.url));
const invalidCatalogFields: Array<[string, unknown]> = [
  ["category", ""],
  ["priority", -1],
  ["requirement", "sometimes"],
  ["durationSeconds", 0],
  ["looping", "no"],
  ["channelPolicy", ""],
  ["masteringIntent", ""],
  ["runtimeMapping", ""],
  ["fallbackRole", "fallback.missing"],
];
const soundscapeInputPaths = [
  "soundscape/events.json",
  "soundscape/catalog.json",
  "soundscape/source-media.json",
  "soundscape/mix.json",
  "soundscape/provenance.json",
];
const invalidIdentifierCases: Array<[string, string, string]> = [
  ["event", "soundscape/events.json", "events"],
  ["catalog", "soundscape/catalog.json", "entries"],
  ["source-media role", "soundscape/source-media.json", "roles"],
  ["fallback role", "soundscape/source-media.json", "fallbackRoles"],
  ["source master", "soundscape/source-media.json", "sourceMasters"],
  ["provenance role", "soundscape/provenance.json", "roles"],
];
interface MutableMixFixture {
  soundtrack: { gainDb: number };
  categoryGainDb: {
    ambience: number;
    movement: number;
    ordinaryForeground: number;
  };
}

async function withPackCopy(assertion: (packRoot: string) => Promise<void>): Promise<void> {
  const packRoot = await mkdtemp(join(tmpdir(), "rosi-edition-pack-"));
  try {
    await cp(tracerPackRoot, packRoot, { recursive: true });
    await assertion(packRoot);
  } finally {
    await rm(packRoot, { recursive: true });
  }
}

async function editPackJson<T>(
  packRoot: string,
  path: string,
  edit: (value: T) => void,
): Promise<void> {
  const filePath = join(packRoot, path);
  const value = JSON.parse(await readFile(filePath, "utf8")) as T;
  edit(value);
  await writeFile(filePath, JSON.stringify(value));
}

describe("Edition Contract", () => {
  test("prepares the frozen Pellegrino Peak Edition Pack", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);

    expect(prepared).toMatchObject({
      contractVersion: "rosi-edition-contract/1",
      revision: "pellegrino-peak-soundscape-1",
      packDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      scenarioIds: ["opening-flight", "pellegrino-peak", "tracer-bullet"],
    });
  });

  test("prepares the Fairytale Soundscape event and catalog identities", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);

    expect(prepared.soundscape).toMatchObject({
      eventIds: [
        "sound-event.opening-storybook-moment",
        "sound-event.story-confirmation",
        "sound-event.flight-launch",
        "sound-event.movement-state",
        "sound-event.place-entry",
        "sound-event.vignette-interaction",
        "sound-event.path-choice-available",
        "sound-event.path-choice-selected",
        "sound-event.journey-history-shimmer",
        "sound-event.playful-bump",
        "sound-event.near-miss",
        "sound-event.birthday-star-proximity",
        "sound-event.birthday-star-gathered",
        "sound-event.rainbow-path-opened",
        "sound-event.birthday-star-moment",
        "sound-event.cloud-rest-entered",
        "sound-event.cloud-rest-exited",
        "sound-event.birthday-castle-arrival",
        "sound-event.celebration-interaction",
        "sound-event.replay",
        "sound-event.sound-preference-changed",
      ],
      catalogEntryIds: [
        "cue.opening.celebration-reveal",
        "cue.opening.star-scatter",
        "cue.opening.departure",
        "cue.story.confirmation",
        "cue.flight.launch",
        "cue.movement.flight",
        "cue.movement.rise",
        "cue.movement.glide",
        "cue.place.lacewood",
        "cue.place.pellegrino-peak",
        "cue.vignette.lacewood.canopy",
        "cue.vignette.lacewood.floor",
        "cue.vignette.pellegrino-peak.updraft",
        "cue.path-choice.available",
        "cue.path-choice.lacewood.canopy",
        "cue.path-choice.lacewood.floor",
        "cue.journey-history.shimmer",
        "cue.playful-bump.lacewood",
        "cue.playful-bump.pellegrino-peak",
        "cue.near-miss",
        "cue.near-miss.pellegrino-peak",
        "cue.birthday-star.proximity",
        "cue.birthday-star.gather",
        "cue.rainbow-path.open",
        "cue.rainbow-path.pellegrino-peak",
        "cue.birthday-star-moment.lacewood",
        "cue.birthday-star-moment.pellegrino-peak",
        "cue.cloud-rest.enter",
        "cue.cloud-rest.ambience",
        "cue.cloud-rest.exit",
        "cue.birthday-castle.arrival",
        "cue.celebration.dance-again",
        "cue.replay",
        "cue.sound.off",
        "cue.sound.on",
      ],
    });
  });

  test("prepares the bounded opening-to-flight runtime mix", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);

    expect(prepared.soundscape?.mix).toEqual({
      soundtrack: {
        id: "music.birthday-flight",
        path: "source-media/soundscape/music/birthday-flight.mp3",
        looping: true,
        gainDb: -6.7,
        fallbackRole: "fallback.music",
      },
      categoryGainDb: {
        music: 0,
        ambience: -10,
        movement: -10,
        ordinaryForeground: 3,
        criticalForeground: 3,
        optionalDetail: -10,
      },
      foregroundVoiceMaximum: 2,
      ambienceCrossfadeMs: 900,
      musicDuckDb: -4,
      truePeakCeilingDbfs: -3,
      confirmationDelayMaximumMs: 200,
    });
  });

  test("rejects a runtime mapping that does not belong to its catalog source master", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        mappings: Array<{ sourceMaster: string }>;
      }>(packRoot, "soundscape/runtime-mappings.json", (runtimeMappings) => {
        runtimeMappings.mappings[0]!.sourceMaster = "source-master.opening.star-scatter";
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Invalid soundscape runtime mapping: runtime-cue.opening.celebration-reveal",
      );
    });
  });

  test("rejects a soundtrack path other than the bundled music asset", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        soundtrack: { path: string };
      }>(packRoot, "soundscape/mix.json", (mix) => {
        mix.soundtrack.path = "source-media/soundscape/music/missing.mp3";
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Invalid soundscape soundtrack asset",
      );
    });
  });

  test.each<[string, (mix: MutableMixFixture) => void]>([
    ["soundtrack reference", (mix) => { mix.soundtrack.gainDb = -3; }],
    ["ambience", (mix) => { mix.categoryGainDb.ambience = -7; }],
    ["movement", (mix) => { mix.categoryGainDb.movement = -13; }],
    ["ordinary foreground", (mix) => { mix.categoryGainDb.ordinaryForeground = 1; }],
  ])("rejects an out-of-bounds %s mix level", async (_label, mutate) => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<MutableMixFixture>(packRoot, "soundscape/mix.json", mutate);

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Invalid soundscape category balance",
      );
    });
  });

  test("rejects runtime mix categories that leak engine-specific names", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        categoryGainDb: Record<string, number>;
      }>(packRoot, "soundscape/mix.json", (mix) => {
        delete mix.categoryGainDb.movement;
        mix.categoryGainDb.engineBus = -10;
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Invalid soundscape category gains",
      );
    });
  });

  test("preserves preparation for an Edition Pack without a soundscape contract", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        files: Array<{ role: string }>;
      }>(packRoot, "edition.json", (manifest) => {
        manifest.files = manifest.files.filter((file) => !file.role.startsWith("soundscape-"));
      });
      await editPackJson<{
        requiredSoundEvents?: unknown;
      }>(packRoot, "parity/tracer-bullet.json", (scenario) => {
        delete scenario.requiredSoundEvents;
      });

      const prepared = await prepareEditionPack(packRoot);

      expect(prepared.soundscape).toBeUndefined();
    });
  });

  test("rejects a catalog entry whose source master is not declared", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        entries: Array<{ sourceMaster: string }>;
      }>(packRoot, "soundscape/catalog.json", (catalog) => {
        catalog.entries[0]!.sourceMaster = "source-master.missing";
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Unknown soundscape source master: source-master.missing",
      );
    });
  });

  test.each(invalidCatalogFields)(
    "rejects a catalog entry with invalid %s",
    async (field, invalidValue) => {
      await withPackCopy(async (packRoot) => {
        await editPackJson<{
          entries: Array<Record<string, unknown>>;
        }>(packRoot, "soundscape/catalog.json", (catalog) => {
          catalog.entries[0]![field] = invalidValue;
        });

        await expect(prepareEditionPack(packRoot)).rejects.toThrow(
          `Invalid soundscape catalog ${field}: cue.opening.celebration-reveal`,
        );
      });
    },
  );

  test("rejects a catalog entry whose semantic event is not declared", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        entries: Array<{ event: string }>;
      }>(packRoot, "soundscape/catalog.json", (catalog) => {
        catalog.entries[0]!.event = "sound-event.missing";
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Unknown soundscape event: sound-event.missing",
      );
    });
  });

  test("rejects source media whose provenance role is not declared", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        sourceMasters: Array<{ provenanceRole: string }>;
      }>(packRoot, "soundscape/source-media.json", (sourceMedia) => {
        sourceMedia.sourceMasters[0]!.provenanceRole = "provenance.missing";
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Unknown soundscape provenance role: provenance.missing",
      );
    });
  });

  test("rejects a source master whose media role is not declared", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        sourceMasters: Array<{ role: string }>;
      }>(packRoot, "soundscape/source-media.json", (sourceMedia) => {
        sourceMedia.sourceMasters[0]!.role = "source-media.missing";
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Unknown soundscape source-media role: source-media.missing",
      );
    });
  });

  test("rejects a tracer scenario that references an unknown sound event", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        requiredSoundEvents: Array<{ event: string }>;
      }>(packRoot, "parity/tracer-bullet.json", (scenario) => {
        scenario.requiredSoundEvents[0]!.event = "sound-event.missing";
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Scenario tracer-bullet references unknown soundscape event: sound-event.missing",
      );
    });
  });

  test.each(soundscapeInputPaths)("includes %s in the immutable revision digest", async (path) => {
    const original = await prepareEditionPack(tracerPackRoot);
    await withPackCopy(async (packRoot) => {
      const inputPath = join(packRoot, path);
      const input = await readFile(inputPath, "utf8");
      await writeFile(inputPath, `${input}\n `);

      const changed = await prepareEditionPack(packRoot);

      expect(changed.packDigest).not.toBe(original.packDigest);
    });
  });

  test("rejects catalog matching on a parameter absent from its semantic event", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        entries: Array<{ match: Record<string, unknown> }>;
      }>(packRoot, "soundscape/catalog.json", (catalog) => {
        catalog.entries[0]!.match = { engineBus: "story" };
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Soundscape cue cue.opening.celebration-reveal matches unknown event parameter: engineBus",
      );
    });
  });

  test("rejects scenario evidence that omits a semantic event parameter", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        requiredSoundEvents: Array<{ context: Record<string, unknown> }>;
      }>(packRoot, "parity/tracer-bullet.json", (scenario) => {
        scenario.requiredSoundEvents[0]!.context = {};
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Invalid soundscape event context in scenario tracer-bullet: sound-event.opening-storybook-moment",
      );
    });
  });

  test("rejects a scenario sound event with no catalog mapping", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        requiredSoundEvents: Array<{ context: Record<string, unknown> }>;
      }>(packRoot, "parity/tracer-bullet.json", (scenario) => {
        scenario.requiredSoundEvents[0]!.context = { moment: "opening.missing" };
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Scenario tracer-bullet sound event has no catalog mapping: sound-event.opening-storybook-moment",
      );
    });
  });

  test("rejects duplicate semantic sound event identifiers", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        events: Array<{ id: string }>;
      }>(packRoot, "soundscape/events.json", (events) => {
        events.events[1]!.id = events.events[0]!.id;
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Duplicate soundscape event id: sound-event.opening-storybook-moment",
      );
    });
  });

  test("rejects duplicate soundscape catalog identifiers", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        entries: Array<{ id: string }>;
      }>(packRoot, "soundscape/catalog.json", (catalog) => {
        catalog.entries[1]!.id = catalog.entries[0]!.id;
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Duplicate soundscape catalog id: cue.opening.celebration-reveal",
      );
    });
  });

  test("rejects duplicate reserved soundscape roles in the Edition Pack manifest", async () => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        files: Array<{ role: string; path: string }>;
      }>(packRoot, "edition.json", (manifest) => {
        manifest.files.push({
          role: "soundscape-catalog",
          path: "soundscape/catalog.json",
        });
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Duplicate Edition Pack role: soundscape-catalog",
      );
    });
  });

  test.each(invalidIdentifierCases)(
    "rejects an empty soundscape %s identifier",
    async (kind, path, collection) => {
      await withPackCopy(async (packRoot) => {
        await editPackJson<Record<string, Array<{ id: string }>>>(packRoot, path, (document) => {
          document[collection]![0]!.id = "";
        });

        await expect(prepareEditionPack(packRoot)).rejects.toThrow(
          `Invalid soundscape ${kind} id`,
        );
      });
    },
  );

  test.each([
    ["empty", [""]],
    ["duplicate", ["moment", "moment"]],
  ])("rejects %s semantic event parameter names", async (_kind, parameters) => {
    await withPackCopy(async (packRoot) => {
      await editPackJson<{
        events: Array<{ parameters: string[] }>;
      }>(packRoot, "soundscape/events.json", (events) => {
        events.events[0]!.parameters = parameters;
      });

      await expect(prepareEditionPack(packRoot)).rejects.toThrow(
        "Invalid soundscape event parameter: sound-event.opening-storybook-moment",
      );
    });
  });
});
