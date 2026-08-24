import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { runSoundscapeBuildCli } from "../src/cli";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const soundscapeRoot = join(repositoryRoot, "shared", "edition", "soundscape");

const SOURCE_MEDIA = {
  roles: [{ id: "source-media.generated-master", description: "An approved master." }],
  fallbackRoles: [{ id: "fallback.story-confirmation", description: "A synthesized cue." }],
  sourceMasters: [
    {
      id: "source-master.story.confirmation",
      role: "source-media.generated-master",
      provenanceRole: "provenance.commercial-generated-effect",
      path: "masters/story-confirmation.wav",
      provenancePath: "provenance/story-confirmation.json",
    },
  ],
};

const PROVENANCE = {
  roles: [
    {
      id: "provenance.commercial-generated-effect",
      description: "Evidence for a generated effect.",
      requiredEvidence: [],
    },
  ],
};

const MANIFEST = {
  contractVersion: "rosie-edition-contract/1",
  revision: "role-test",
  files: [
    { role: "content", path: "content.json" },
    { role: "soundscape-catalog", path: "soundscape/catalog.json" },
    { role: "soundscape-source-media", path: "soundscape/source-media.json" },
    { role: "soundscape-provenance", path: "soundscape/provenance.json" },
  ],
};

interface Overrides {
  sourceMedia?: unknown;
  provenance?: unknown;
  manifest?: unknown;
}

async function validateEdition(overrides: Overrides = {}): Promise<{
  exitCode: number;
  stderr: string[];
}> {
  const workspace = await mkdtemp(join(tmpdir(), "rosie-edition-roles-"));
  const catalogPath = join(workspace, "catalog.json");
  const runtimeMappingsPath = join(workspace, "runtime-mappings.json");
  const sourceMediaPath = join(workspace, "source-media.json");
  const provenancePath = join(workspace, "provenance.json");
  const manifestPath = join(workspace, "edition.json");
  // An empty catalog keeps these cases on the role declarations alone; the
  // checked-in catalog is exercised by the last test in this file.
  await writeFile(catalogPath, JSON.stringify({ entries: [] }));
  await writeFile(runtimeMappingsPath, JSON.stringify({ mappings: [] }));
  await writeFile(sourceMediaPath, JSON.stringify(overrides.sourceMedia ?? SOURCE_MEDIA));
  await writeFile(provenancePath, JSON.stringify(overrides.provenance ?? PROVENANCE));
  await writeFile(manifestPath, JSON.stringify(overrides.manifest ?? MANIFEST));

  const stderr: string[] = [];
  const result = await runSoundscapeBuildCli({
    argv: [
      "validate",
      "--catalog",
      catalogPath,
      "--source-media",
      sourceMediaPath,
      "--runtime-mappings",
      runtimeMappingsPath,
      "--provenance",
      provenancePath,
      "--edition-manifest",
      manifestPath,
    ],
    env: {},
    stdout: () => {},
    stderr: (message) => stderr.push(message),
  });
  return { exitCode: result.exitCode, stderr };
}

describe("Edition Pack role declarations", () => {
  test("rejects a source master whose media role is not declared", async () => {
    const { exitCode, stderr } = await validateEdition({
      sourceMedia: {
        ...SOURCE_MEDIA,
        sourceMasters: [
          { ...SOURCE_MEDIA.sourceMasters[0], role: "source-media.undeclared" },
        ],
      },
    });
    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("source-media.undeclared");
  });

  test("rejects a source master whose provenance role is not declared", async () => {
    const { exitCode, stderr } = await validateEdition({
      sourceMedia: {
        ...SOURCE_MEDIA,
        sourceMasters: [
          { ...SOURCE_MEDIA.sourceMasters[0], provenanceRole: "provenance.undeclared" },
        ],
      },
    });
    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("provenance.undeclared");
  });

  test("rejects duplicate source-media role identifiers", async () => {
    const { exitCode, stderr } = await validateEdition({
      sourceMedia: {
        ...SOURCE_MEDIA,
        roles: [...SOURCE_MEDIA.roles, ...SOURCE_MEDIA.roles],
      },
    });
    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("source-media.generated-master");
  });

  test("rejects duplicate provenance role identifiers", async () => {
    const { exitCode, stderr } = await validateEdition({
      provenance: { roles: [...PROVENANCE.roles, ...PROVENANCE.roles] },
    });
    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("provenance.commercial-generated-effect");
  });

  test("rejects a duplicate reserved soundscape role in the Edition Pack manifest", async () => {
    const { exitCode, stderr } = await validateEdition({
      manifest: {
        ...MANIFEST,
        files: [
          ...MANIFEST.files,
          { role: "soundscape-catalog", path: "soundscape/catalog-copy.json" },
        ],
      },
    });
    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("soundscape-catalog");
  });

  test("allows a repeated non-reserved role in the Edition Pack manifest", async () => {
    const { exitCode } = await validateEdition({
      manifest: {
        ...MANIFEST,
        files: [
          ...MANIFEST.files,
          { role: "source-media", path: "source-media/first.png" },
          { role: "source-media", path: "source-media/second.png" },
        ],
      },
    });
    expect(exitCode).toBe(0);
  });

  test("accepts the checked-in Edition Pack", async () => {
    const stderr: string[] = [];
    const result = await runSoundscapeBuildCli({
      argv: [
        "validate",
        "--catalog",
        join(soundscapeRoot, "catalog.json"),
        "--source-media",
        join(soundscapeRoot, "source-media.json"),
        "--runtime-mappings",
        join(soundscapeRoot, "runtime-mappings.json"),
        "--provenance",
        join(soundscapeRoot, "provenance.json"),
        "--edition-manifest",
        join(repositoryRoot, "shared", "edition", "edition.json"),
      ],
      env: {},
      stdout: () => {},
      stderr: (message) => stderr.push(message),
    });
    expect(stderr.join("\n")).toBe("");
    expect(result.exitCode).toBe(0);
  });
});
