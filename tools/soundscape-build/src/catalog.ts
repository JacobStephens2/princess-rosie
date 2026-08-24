import { readFile } from "node:fs/promises";
import type { CatalogCue } from "./model";

export interface CatalogInputPaths {
  catalogPath: string;
  sourceMediaPath: string;
  runtimeMappingsPath: string;
}

export interface RuntimeMapping {
  id: string;
  sourceMaster: string;
  path: string;
}

export async function loadCatalog(path: string): Promise<{ entries: CatalogCue[] }> {
  return JSON.parse(await readFile(path, "utf8")) as { entries: CatalogCue[] };
}

export async function loadRuntimeMappings(
  path: string,
): Promise<{ mappings: RuntimeMapping[] }> {
  return JSON.parse(await readFile(path, "utf8")) as { mappings: RuntimeMapping[] };
}

function assertRequiredString(
  cue: Partial<CatalogCue>,
  cueLabel: string,
  field: keyof CatalogCue,
): void {
  if (typeof cue[field] !== "string" || !(cue[field] as string).trim()) {
    throw new Error(`Catalog cue ${cueLabel} is missing required field: ${field}`);
  }
}

export async function validateCatalog(args: CatalogInputPaths): Promise<number> {
  const [catalogText, sourceMediaText, runtimeMappingsText] = await Promise.all([
    readFile(args.catalogPath, "utf8"),
    readFile(args.sourceMediaPath, "utf8"),
    readFile(args.runtimeMappingsPath, "utf8"),
  ]);
  const catalog = JSON.parse(catalogText) as { entries?: Array<Partial<CatalogCue>> };
  const sourceMedia = JSON.parse(sourceMediaText) as {
    sourceMasters?: Array<{ id?: string; path?: string; provenancePath?: string }>;
  };
  const runtimeMappings = JSON.parse(runtimeMappingsText) as {
    mappings?: Array<{ id?: string; sourceMaster?: string; path?: string }>;
  };
  if (!Array.isArray(catalog.entries)) throw new Error("Catalog entries must be an array");

  const sourceMasterIdentifiers = (sourceMedia.sourceMasters ?? []).map(({ id }) => id);
  const duplicateSourceMaster = sourceMasterIdentifiers.find(
    (id, index) => id !== undefined && sourceMasterIdentifiers.indexOf(id) !== index,
  );
  if (duplicateSourceMaster) {
    throw new Error(`Duplicate source master identifier: ${duplicateSourceMaster}`);
  }
  const runtimeMappingIdentifiers = (runtimeMappings.mappings ?? []).map(({ id }) => id);
  const duplicateRuntimeMapping = runtimeMappingIdentifiers.find(
    (id, index) => id !== undefined && runtimeMappingIdentifiers.indexOf(id) !== index,
  );
  if (duplicateRuntimeMapping) {
    throw new Error(`Duplicate runtime mapping identifier: ${duplicateRuntimeMapping}`);
  }

  const sourceMastersById = new Map(
    (sourceMedia.sourceMasters ?? []).map((sourceMaster) => [sourceMaster.id, sourceMaster]),
  );
  const mappingsById = new Map(
    (runtimeMappings.mappings ?? []).map((mapping) => [mapping.id, mapping]),
  );
  const cueIds = new Set<string>();

  for (const [index, cue] of catalog.entries.entries()) {
    const cueLabel = typeof cue.id === "string" && cue.id.trim()
      ? cue.id
      : `at index ${index}`;
    assertRequiredString(cue, cueLabel, "id");
    if (cueIds.has(cue.id!)) throw new Error(`Duplicate catalog cue identifier: ${cue.id}`);
    cueIds.add(cue.id!);
    for (const field of [
      "event",
      "category",
      "requirement",
      "channelPolicy",
      "masteringIntent",
      "selectionStatus",
      "sourceMaster",
      "runtimeMapping",
      "fallbackRole",
    ] as const) {
      assertRequiredString(cue, cueLabel, field);
    }
    if (!cue.match || typeof cue.match !== "object" || Array.isArray(cue.match)) {
      throw new Error(`Catalog cue ${cueLabel} is missing required field: match`);
    }
    if (cue.selectionStatus !== "unapproved" && cue.selectionStatus !== "approved") {
      throw new Error(`Catalog cue ${cueLabel} has invalid selectionStatus`);
    }
    if (cue.priority === undefined) {
      throw new Error(`Catalog cue ${cueLabel} is missing required field: priority`);
    }
    if (![20, 40, 60, 100].includes(cue.priority)) {
      throw new Error(`Catalog cue ${cueLabel} has invalid priority`);
    }
    if (
      typeof cue.durationSeconds !== "number" ||
      !Number.isFinite(cue.durationSeconds) ||
      cue.durationSeconds < 0.5 ||
      cue.durationSeconds > 30
    ) {
      throw new Error(`Catalog cue ${cueLabel} has invalid durationSeconds`);
    }
    if (
      cue.channelPolicy !== "focused-mono" &&
      cue.channelPolicy !== "warm-stereo" &&
      cue.channelPolicy !== "warm-stereo-loop"
    ) {
      throw new Error(`Catalog cue ${cueLabel} has invalid channelPolicy`);
    }
    if (
      typeof cue.looping !== "boolean" ||
      (cue.looping && cue.channelPolicy !== "warm-stereo-loop") ||
      (!cue.looping && cue.channelPolicy === "warm-stereo-loop")
    ) {
      throw new Error(`Catalog cue ${cueLabel} has a contradictory loop policy`);
    }
    const authoring = cue.authoring;
    if (!authoring || typeof authoring !== "object") {
      throw new Error(`Catalog cue ${cueLabel} is missing required field: authoring`);
    }
    if (typeof authoring.prompt !== "string" || !authoring.prompt.trim()) {
      throw new Error(`Catalog cue ${cueLabel} is missing required field: authoring.prompt`);
    }
    if (authoring.prompt.length > 450) {
      throw new Error(`Catalog cue ${cueLabel} exceeds the 450-character prompt limit`);
    }
    if (authoring.model !== "eleven_text_to_sound_v2") {
      throw new Error(`Catalog cue ${cueLabel} has invalid authoring model`);
    }
    if (
      typeof authoring.promptInfluence !== "number" ||
      authoring.promptInfluence < 0 ||
      authoring.promptInfluence > 1
    ) {
      throw new Error(`Catalog cue ${cueLabel} has invalid promptInfluence`);
    }
    if (
      authoring.sourceFormats?.[0] !== "pcm_48000" ||
      authoring.sourceFormats?.[1] !== "pcm_24000"
    ) {
      throw new Error(`Catalog cue ${cueLabel} has invalid sourceFormats`);
    }
    if (authoring.candidateCount !== 3) {
      throw new Error(`Catalog cue ${cueLabel} requires exactly three candidates per batch`);
    }
    const sourceMaster = sourceMastersById.get(cue.sourceMaster);
    if (!sourceMaster) {
      throw new Error(
        `Catalog cue ${cueLabel} has unresolved sourceMaster: ${cue.sourceMaster}`,
      );
    }
    if (
      cue.selectionStatus === "approved" &&
      (!sourceMaster.path?.trim() || !sourceMaster.provenancePath?.trim())
    ) {
      throw new Error(
        `Catalog cue ${cueLabel} references an unapproved sourceMaster: ${cue.sourceMaster}`,
      );
    }
    const runtimeMapping = mappingsById.get(cue.runtimeMapping);
    if (
      !runtimeMapping ||
      runtimeMapping.sourceMaster !== cue.sourceMaster ||
      typeof runtimeMapping.path !== "string" ||
      !/^runtime\/[a-z0-9][a-z0-9-]*\.wav$/.test(runtimeMapping.path)
    ) {
      throw new Error(
        `Catalog cue ${cueLabel} has unresolved runtimeMapping: ${cue.runtimeMapping}`,
      );
    }
  }
  return catalog.entries.length;
}

export function cueSlug(cueId: string): string {
  return cueId.replace(/^cue\./, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

/**
 * Roles reserved for exactly one Edition Pack file each. Content roles such as
 * `source-media` intentionally repeat, one entry per asset.
 */
const RESERVED_SOUNDSCAPE_ROLES = [
  "soundscape-events",
  "soundscape-catalog",
  "soundscape-source-media",
  "soundscape-mix",
  "soundscape-runtime-mappings",
  "soundscape-provenance",
] as const;

export interface EditionRoleInputPaths {
  sourceMediaPath: string;
  provenancePath: string;
  manifestPath: string;
}

function assertUniqueRoleIds(
  roles: Array<{ id?: string }> | undefined,
  label: string,
): Set<string> {
  const identifiers = new Set<string>();
  for (const { id } of roles ?? []) {
    if (typeof id !== "string" || !id.trim()) {
      throw new Error(`Every ${label} needs an identifier`);
    }
    if (identifiers.has(id)) throw new Error(`Duplicate ${label}: ${id}`);
    identifiers.add(id);
  }
  return identifiers;
}

/**
 * Proves the Edition Pack declares every role its soundscape files reach for.
 * The Godot adapter validates that manifest entries are well formed and their
 * files exist; these are the cross-references it cannot see.
 */
export async function validateEditionRoles(args: EditionRoleInputPaths): Promise<void> {
  const [sourceMediaText, provenanceText, manifestText] = await Promise.all([
    readFile(args.sourceMediaPath, "utf8"),
    readFile(args.provenancePath, "utf8"),
    readFile(args.manifestPath, "utf8"),
  ]);
  const sourceMedia = JSON.parse(sourceMediaText) as {
    roles?: Array<{ id?: string }>;
    fallbackRoles?: Array<{ id?: string }>;
    sourceMasters?: Array<{ id?: string; role?: string; provenanceRole?: string }>;
  };
  const provenance = JSON.parse(provenanceText) as { roles?: Array<{ id?: string }> };
  const manifest = JSON.parse(manifestText) as {
    files?: Array<{ role?: string; path?: string }>;
  };

  const sourceMediaRoleIds = assertUniqueRoleIds(sourceMedia.roles, "source-media role");
  assertUniqueRoleIds(sourceMedia.fallbackRoles, "fallback role");
  const provenanceRoleIds = assertUniqueRoleIds(provenance.roles, "provenance role");

  for (const sourceMaster of sourceMedia.sourceMasters ?? []) {
    const label = sourceMaster.id ?? "an unnamed source master";
    if (!sourceMaster.role || !sourceMediaRoleIds.has(sourceMaster.role)) {
      throw new Error(
        `Source master ${label} has an undeclared source-media role: ${sourceMaster.role}`,
      );
    }
    if (!sourceMaster.provenanceRole || !provenanceRoleIds.has(sourceMaster.provenanceRole)) {
      throw new Error(
        `Source master ${label} has an undeclared provenance role: ${sourceMaster.provenanceRole}`,
      );
    }
  }

  if (!Array.isArray(manifest.files)) {
    throw new Error("Edition Pack files must be an array");
  }
  const claimedRoles = new Set<string>();
  for (const file of manifest.files) {
    if (typeof file.role !== "string") continue;
    if (!RESERVED_SOUNDSCAPE_ROLES.some((role) => role === file.role)) continue;
    if (claimedRoles.has(file.role)) {
      throw new Error(`Duplicate Edition Pack role: ${file.role}`);
    }
    claimedRoles.add(file.role);
  }
}
