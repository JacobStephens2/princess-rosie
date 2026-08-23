import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

const CONTRACT_VERSION = "rosie-edition-contract/1";

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

export interface PreparedEditionPack {
  contractVersion: typeof CONTRACT_VERSION;
  revision: string;
  packDigest: `sha256:${string}`;
  scenarioIds: string[];
}

export interface EditionEvidence {
  edition: string;
  engineVersion: string;
  packDigest: `sha256:${string}`;
  scenarioId: string;
  facts: Record<string, unknown>;
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
  const files = [...manifest.files].sort((left, right) => left.path.localeCompare(right.path));
  for (const file of files) {
    if (typeof file.path !== "string" || typeof file.role !== "string") {
      throw new Error("Every Edition Pack file needs a role and relative path");
    }
    const bytes = await readFile(resolvePackFile(packRoot, file.path));
    digest.update("\0");
    digest.update(file.path);
    digest.update("\0");
    digest.update(bytes);
    if (file.role === "scenario") {
      if (typeof file.id !== "string" || file.id.length === 0) {
        throw new Error(`Scenario file needs an id: ${file.path}`);
      }
      scenarioIds.push(file.id);
    }
  }

  return {
    contractVersion: CONTRACT_VERSION,
    revision: manifest.revision,
    packDigest: `sha256:${digest.digest("hex")}`,
    scenarioIds,
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
  ) as { requiredFacts?: Record<string, unknown> };
  if (!scenario.requiredFacts) {
    throw new Error(`Scenario has no required facts: ${evidence.scenarioId}`);
  }

  const failures = Object.entries(scenario.requiredFacts).flatMap(([fact, expected]) => {
    const actual = evidence.facts[fact];
    return isDeepStrictEqual(actual, expected) ? [] : [{ fact, expected, actual }];
  });

  return {
    edition: evidence.edition,
    engineVersion: evidence.engineVersion,
    packDigest: evidence.packDigest,
    scenarioId: evidence.scenarioId,
    status: failures.length === 0 ? "passed" : "failed",
    failures,
  };
}
