import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

const CONTRACT_VERSION = "rosi-edition-contract/1";
const SOUNDSCAPE_FILE_ROLES = [
  "soundscape-events",
  "soundscape-catalog",
  "soundscape-source-media",
  "soundscape-provenance",
] as const;

interface EditionFile {
  role: string;
  id?: string;
  path: string;
}

interface EditionManifest {
  contractVersion: string;
  revision: string;
  files: EditionFile[];
}

interface SoundscapeEventFile {
  events: Array<{ id: string; parameters: string[] }>;
}

interface SoundscapeCatalogFile {
  entries: Array<{
    id: string;
    event: string;
    match: Record<string, unknown>;
    category: string;
    priority: number;
    requirement: "required" | "optional";
    durationSeconds: number;
    looping: boolean;
    channelPolicy: string;
    masteringIntent: string;
    sourceMaster: string;
    runtimeMapping: string;
    fallbackRole: string;
  }>;
}

interface SoundscapeSourceMediaFile {
  roles: Array<{ id: string }>;
  fallbackRoles: Array<{ id: string }>;
  sourceMasters: Array<{ id: string; role: string; provenanceRole: string }>;
}

interface SoundscapeProvenanceFile {
  roles: Array<{ id: string }>;
}

interface ScenarioFile {
  id: string;
  bytes: Buffer;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function invalidCatalogField(entryId: unknown, field: string): never {
  throw new Error(`Invalid soundscape catalog ${field}: ${String(entryId)}`);
}

function assertUniqueIds(items: Array<{ id: string }>, kind: string): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (!isNonEmptyString(item.id)) throw new Error(`Invalid soundscape ${kind} id`);
    if (ids.has(item.id)) throw new Error(`Duplicate soundscape ${kind} id: ${item.id}`);
    ids.add(item.id);
  }
}

function validateEventDefinitions(events: SoundscapeEventFile): void {
  assertUniqueIds(events.events, "event");
  for (const event of events.events) {
    const parameters = new Set<string>();
    for (const parameter of event.parameters) {
      if (!isNonEmptyString(parameter) || parameters.has(parameter)) {
        throw new Error(`Invalid soundscape event parameter: ${event.id}`);
      }
      parameters.add(parameter);
    }
  }
}

function validateSourceMedia(
  sourceMedia: SoundscapeSourceMediaFile,
  provenance: SoundscapeProvenanceFile,
): { sourceMasterIds: Set<string>; fallbackRoleIds: Set<string> } {
  assertUniqueIds(sourceMedia.roles, "source-media role");
  assertUniqueIds(sourceMedia.fallbackRoles, "fallback role");
  assertUniqueIds(sourceMedia.sourceMasters, "source master");
  assertUniqueIds(provenance.roles, "provenance role");

  const sourceMediaRoleIds = new Set(sourceMedia.roles.map((role) => role.id));
  const provenanceRoleIds = new Set(provenance.roles.map((role) => role.id));
  for (const master of sourceMedia.sourceMasters) {
    if (!sourceMediaRoleIds.has(master.role)) {
      throw new Error(`Unknown soundscape source-media role: ${master.role}`);
    }
    if (!provenanceRoleIds.has(master.provenanceRole)) {
      throw new Error(`Unknown soundscape provenance role: ${master.provenanceRole}`);
    }
  }

  return {
    sourceMasterIds: new Set(sourceMedia.sourceMasters.map((master) => master.id)),
    fallbackRoleIds: new Set(sourceMedia.fallbackRoles.map((role) => role.id)),
  };
}

function validateCatalog(
  catalog: SoundscapeCatalogFile,
  eventsById: Map<string, SoundscapeEventFile["events"][number]>,
  sourceMasterIds: Set<string>,
  fallbackRoleIds: Set<string>,
): void {
  assertUniqueIds(catalog.entries, "catalog");
  for (const entry of catalog.entries) {
    const event = eventsById.get(entry.event);
    if (!event) throw new Error(`Unknown soundscape event: ${entry.event}`);
    for (const parameter of Object.keys(entry.match)) {
      if (!event.parameters.includes(parameter)) {
        throw new Error(
          `Soundscape cue ${entry.id} matches unknown event parameter: ${parameter}`,
        );
      }
    }
    if (!isNonEmptyString(entry.category)) invalidCatalogField(entry.id, "category");
    if (!Number.isInteger(entry.priority) || entry.priority < 0 || entry.priority > 100) {
      invalidCatalogField(entry.id, "priority");
    }
    if (entry.requirement !== "required" && entry.requirement !== "optional") {
      invalidCatalogField(entry.id, "requirement");
    }
    if (
      typeof entry.durationSeconds !== "number" ||
      !Number.isFinite(entry.durationSeconds) ||
      entry.durationSeconds <= 0
    ) {
      invalidCatalogField(entry.id, "durationSeconds");
    }
    if (typeof entry.looping !== "boolean") invalidCatalogField(entry.id, "looping");
    if (!isNonEmptyString(entry.channelPolicy)) invalidCatalogField(entry.id, "channelPolicy");
    if (!isNonEmptyString(entry.masteringIntent)) {
      invalidCatalogField(entry.id, "masteringIntent");
    }
    if (!isNonEmptyString(entry.runtimeMapping)) {
      invalidCatalogField(entry.id, "runtimeMapping");
    }
    if (!isNonEmptyString(entry.fallbackRole) || !fallbackRoleIds.has(entry.fallbackRole)) {
      invalidCatalogField(entry.id, "fallbackRole");
    }
    if (!sourceMasterIds.has(entry.sourceMaster)) {
      throw new Error(`Unknown soundscape source master: ${entry.sourceMaster}`);
    }
  }
}

function validateScenarioSoundEvents(
  scenarioFiles: ScenarioFile[],
  eventsById: Map<string, SoundscapeEventFile["events"][number]>,
  catalog: SoundscapeCatalogFile,
): void {
  for (const scenarioFile of scenarioFiles) {
    const scenario = JSON.parse(scenarioFile.bytes.toString("utf8")) as {
      requiredSoundEvents?: SoundscapeEventEvidence[];
    };
    for (const soundEvent of scenario.requiredSoundEvents ?? []) {
      const event = eventsById.get(soundEvent.event);
      if (!event) {
        throw new Error(
          `Scenario ${scenarioFile.id} references unknown soundscape event: ${soundEvent.event}`,
        );
      }
      const contextKeys = Object.keys(soundEvent.context).sort();
      const parameterKeys = [...event.parameters].sort();
      if (!isDeepStrictEqual(contextKeys, parameterKeys)) {
        throw new Error(
          `Invalid soundscape event context in scenario ${scenarioFile.id}: ${soundEvent.event}`,
        );
      }
      const hasCatalogMapping = catalog.entries.some(
        (entry) =>
          entry.event === soundEvent.event &&
          Object.entries(entry.match).every(([parameter, expected]) =>
            isDeepStrictEqual(soundEvent.context[parameter], expected),
          ),
      );
      if (!hasCatalogMapping) {
        throw new Error(
          `Scenario ${scenarioFile.id} sound event has no catalog mapping: ${soundEvent.event}`,
        );
      }
    }
  }
}

export interface PreparedEditionPack {
  contractVersion: typeof CONTRACT_VERSION;
  revision: string;
  packDigest: `sha256:${string}`;
  scenarioIds: string[];
  soundscape?: {
    eventIds: string[];
    catalogEntryIds: string[];
  };
}

export interface EditionEvidence {
  edition: string;
  engineVersion: string;
  packDigest: `sha256:${string}`;
  scenarioId: string;
  soundEvents?: SoundscapeEventEvidence[];
  facts: Record<string, unknown>;
}

export interface SoundscapeEventEvidence {
  event: string;
  context: Record<string, string | number | boolean>;
}

export interface EditionProof {
  edition: string;
  engineVersion: string;
  packDigest: `sha256:${string}`;
  scenarioId: string;
  status: "passed" | "failed";
  failures: Array<{
    fact: string;
    expected: unknown;
    actual: unknown;
  }>;
}

function prepareSoundscape(
  filesByRole: Map<string, Buffer>,
  scenarioFiles: ScenarioFile[],
): PreparedEditionPack["soundscape"] {
  const hasSoundscape = SOUNDSCAPE_FILE_ROLES.some((role) => filesByRole.has(role));
  if (!hasSoundscape) return undefined;

  const soundscapeFiles = SOUNDSCAPE_FILE_ROLES.map((role) => {
    const bytes = filesByRole.get(role);
    if (!bytes) throw new Error(`Edition Pack is missing soundscape role: ${role}`);
    return bytes;
  });
  const [eventBytes, catalogBytes, sourceMediaBytes, provenanceBytes] = soundscapeFiles;
  if (!eventBytes || !catalogBytes || !sourceMediaBytes || !provenanceBytes) {
    throw new Error("Edition Pack soundscape roles could not be loaded");
  }

  const events = JSON.parse(eventBytes.toString("utf8")) as SoundscapeEventFile;
  const catalog = JSON.parse(catalogBytes.toString("utf8")) as SoundscapeCatalogFile;
  const sourceMedia = JSON.parse(sourceMediaBytes.toString("utf8")) as SoundscapeSourceMediaFile;
  const provenance = JSON.parse(provenanceBytes.toString("utf8")) as SoundscapeProvenanceFile;
  validateEventDefinitions(events);

  const eventsById = new Map(events.events.map((event) => [event.id, event]));
  const { sourceMasterIds, fallbackRoleIds } = validateSourceMedia(sourceMedia, provenance);
  validateCatalog(catalog, eventsById, sourceMasterIds, fallbackRoleIds);
  validateScenarioSoundEvents(scenarioFiles, eventsById, catalog);

  return {
    eventIds: events.events.map((event) => event.id),
    catalogEntryIds: catalog.entries.map((entry) => entry.id),
  };
}

function parseManifest(bytes: Buffer): EditionManifest {
  const manifest = JSON.parse(bytes.toString("utf8")) as Partial<EditionManifest>;
  if (manifest.contractVersion !== CONTRACT_VERSION) {
    throw new Error(`Unsupported Edition Contract version: ${String(manifest.contractVersion)}`);
  }
  if (typeof manifest.revision !== "string" || manifest.revision.length === 0) {
    throw new Error("Edition Pack revision must be a non-empty string");
  }
  if (!Array.isArray(manifest.files)) {
    throw new Error("Edition Pack files must be an array");
  }
  return manifest as EditionManifest;
}

function resolvePackFile(packRoot: string, path: string): string {
  if (isAbsolute(path)) throw new Error(`Edition Pack path must be relative: ${path}`);
  const resolved = resolve(packRoot, path);
  const fromRoot = relative(packRoot, resolved);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error(`Edition Pack path escapes its root: ${path}`);
  }
  return resolved;
}

export async function prepareEditionPack(packRoot: string): Promise<PreparedEditionPack> {
  const manifestPath = resolve(packRoot, "edition.json");
  const manifestBytes = await readFile(manifestPath);
  const manifest = parseManifest(manifestBytes);
  const digest = createHash("sha256");
  digest.update("edition.json\0");
  digest.update(manifestBytes);

  const scenarioIds: string[] = [];
  const scenarioFiles: Array<{ id: string; bytes: Buffer }> = [];
  const filesByRole = new Map<string, Buffer>();
  const files = [...manifest.files].sort((left, right) => left.path.localeCompare(right.path));
  for (const file of files) {
    if (typeof file.path !== "string" || typeof file.role !== "string") {
      throw new Error("Every Edition Pack file needs a role and relative path");
    }
    if (
      SOUNDSCAPE_FILE_ROLES.some((role) => role === file.role) &&
      filesByRole.has(file.role)
    ) {
      throw new Error(`Duplicate Edition Pack role: ${file.role}`);
    }
    const bytes = await readFile(resolvePackFile(packRoot, file.path));
    digest.update("\0");
    digest.update(file.path);
    digest.update("\0");
    digest.update(bytes);
    filesByRole.set(file.role, bytes);
    if (file.role === "scenario") {
      if (typeof file.id !== "string" || file.id.length === 0) {
        throw new Error(`Scenario file needs an id: ${file.path}`);
      }
      scenarioIds.push(file.id);
      scenarioFiles.push({ id: file.id, bytes });
    }
  }

  const soundscape = prepareSoundscape(filesByRole, scenarioFiles);

  return {
    contractVersion: CONTRACT_VERSION,
    revision: manifest.revision,
    packDigest: `sha256:${digest.digest("hex")}`,
    scenarioIds,
    ...(soundscape ? { soundscape } : {}),
  };
}

export async function proveEditionPack(
  packRoot: string,
  prepared: PreparedEditionPack,
  evidence: EditionEvidence,
): Promise<EditionProof> {
  if (evidence.packDigest !== prepared.packDigest) {
    throw new Error("Edition evidence digest does not match the prepared pack");
  }
  if (!prepared.scenarioIds.includes(evidence.scenarioId)) {
    throw new Error(`Unknown Edition Contract scenario: ${evidence.scenarioId}`);
  }

  const manifest = parseManifest(await readFile(resolve(packRoot, "edition.json")));
  const scenarioFile = manifest.files.find(
    (file) => file.role === "scenario" && file.id === evidence.scenarioId,
  );
  if (!scenarioFile) throw new Error(`Missing scenario file: ${evidence.scenarioId}`);

  const scenario = JSON.parse(
    await readFile(resolvePackFile(packRoot, scenarioFile.path), "utf8"),
  ) as {
    requiredFacts?: Record<string, unknown>;
    requiredSoundEvents?: SoundscapeEventEvidence[];
  };
  if (!scenario.requiredFacts) {
    throw new Error(`Scenario has no required facts: ${evidence.scenarioId}`);
  }

  const failures: EditionProof["failures"] = Object.entries(scenario.requiredFacts).flatMap(
    ([fact, expected]) => {
      const actual = evidence.facts[fact];
      return isDeepStrictEqual(actual, expected) ? [] : [{ fact, expected, actual }];
    },
  );
  if (
    scenario.requiredSoundEvents &&
    !isDeepStrictEqual(evidence.soundEvents, scenario.requiredSoundEvents)
  ) {
    failures.push({
      fact: "soundEvents",
      expected: scenario.requiredSoundEvents,
      actual: evidence.soundEvents,
    });
  }

  return {
    edition: evidence.edition,
    engineVersion: evidence.engineVersion,
    packDigest: evidence.packDigest,
    scenarioId: evidence.scenarioId,
    status: failures.length === 0 ? "passed" : "failed",
    failures,
  };
}
