import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { prepareEditionPack, proveEditionPack } from "../src/editionContract";

const tracerPackRoot = fileURLToPath(new URL("../../../shared/edition", import.meta.url));
const tracerSoundEvents: Array<{
  event: string;
  context: Record<string, string | boolean>;
}> = [
  {
    event: "sound-event.opening-storybook-moment",
    context: { moment: "opening.departure" },
  },
  { event: "sound-event.story-confirmation", context: { action: "continue" } },
  { event: "sound-event.flight-launch", context: {} },
  { event: "sound-event.movement-state", context: { state: "flight" } },
  { event: "sound-event.place-entry", context: { place: "lacewood" } },
  {
    event: "sound-event.path-choice-available",
    context: { pathChoice: "path-choice.lacewood" },
  },
  {
    event: "sound-event.path-choice-selected",
    context: { pathChoice: "path-choice.lacewood", route: "lacewood.canopy" },
  },
  {
    event: "sound-event.vignette-interaction",
    context: { place: "lacewood", interaction: "silver-ribbon-canopy" },
  },
  {
    event: "sound-event.playful-bump",
    context: { place: "lacewood", kind: "silver-ribbon" },
  },
  {
    event: "sound-event.playful-bump",
    context: { place: "lacewood", kind: "silver-ribbon" },
  },
  {
    event: "sound-event.playful-bump",
    context: { place: "lacewood", kind: "silver-ribbon" },
  },
  { event: "sound-event.cloud-rest-entered", context: { place: "lacewood" } },
  { event: "sound-event.cloud-rest-exited", context: { place: "lacewood" } },
  { event: "sound-event.movement-state", context: { state: "flight" } },
  {
    event: "sound-event.birthday-star-proximity",
    context: { birthdayStar: "birthday-star.lacewood" },
  },
  {
    event: "sound-event.birthday-star-gathered",
    context: { birthdayStar: "birthday-star.lacewood" },
  },
  {
    event: "sound-event.rainbow-path-opened",
    context: { rainbowPath: "rainbow-path.lacewood", familyGuest: "Gram" },
  },
  {
    event: "sound-event.birthday-star-moment",
    context: { place: "lacewood", familyGuest: "Gram" },
  },
  { event: "sound-event.birthday-castle-arrival", context: {} },
  {
    event: "sound-event.celebration-interaction",
    context: { action: "dance-again" },
  },
  { event: "sound-event.replay", context: { destination: "opening-storybook" } },
  {
    event: "sound-event.opening-storybook-moment",
    context: { moment: "opening.departure" },
  },
  { event: "sound-event.flight-launch", context: {} },
  { event: "sound-event.movement-state", context: { state: "flight" } },
  { event: "sound-event.place-entry", context: { place: "lacewood" } },
  {
    event: "sound-event.path-choice-available",
    context: { pathChoice: "path-choice.lacewood" },
  },
  {
    event: "sound-event.journey-history-shimmer",
    context: { pathChoice: "path-choice.lacewood", route: "lacewood.floor" },
  },
  {
    event: "sound-event.path-choice-selected",
    context: { pathChoice: "path-choice.lacewood", route: "lacewood.floor" },
  },
  {
    event: "sound-event.vignette-interaction",
    context: { place: "lacewood", interaction: "rose-lit-floor" },
  },
  { event: "sound-event.sound-preference-changed", context: { enabled: false } },
  { event: "sound-event.sound-preference-changed", context: { enabled: true } },
];

describe("Edition Contract proof", () => {
  test("accepts conforming Godot Lacewood tracer evidence", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);

    const proof = await proveEditionPack(tracerPackRoot, prepared, {
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
      soundEvents: tracerSoundEvents,
      facts: {
        birthdayStars: ["birthday-star.lacewood"],
        rainbowPaths: ["rainbow-path.lacewood"],
        chosenPathRecorded: true,
        cloudRestPreservesProgress: true,
        networkRequests: 0,
      },
    });

    expect(proof).toEqual({
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
      status: "passed",
      failures: [],
    });
  });

  test("rejects sound events emitted in the wrong order", async () => {
    const prepared = await prepareEditionPack(tracerPackRoot);
    const outOfOrderEvents = [...tracerSoundEvents];
    outOfOrderEvents.splice(26, 2, tracerSoundEvents[27]!, tracerSoundEvents[26]!);

    const proof = await proveEditionPack(tracerPackRoot, prepared, {
      edition: "godot",
      engineVersion: "4.7.2",
      packDigest: prepared.packDigest,
      scenarioId: "tracer-bullet",
      soundEvents: outOfOrderEvents,
      facts: {
        birthdayStars: ["birthday-star.lacewood"],
        rainbowPaths: ["rainbow-path.lacewood"],
        chosenPathRecorded: true,
        cloudRestPreservesProgress: true,
        networkRequests: 0,
      },
    });

    expect(proof).toMatchObject({
      status: "failed",
      failures: [
        {
          fact: "soundEvents",
          expected: tracerSoundEvents,
          actual: outOfOrderEvents,
        },
      ],
    });
  });
});
