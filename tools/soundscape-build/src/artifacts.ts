import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

export function isErrnoCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

export function sha256(value: Buffer | string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (isErrnoCode(error, "ENOENT")) return false;
    throw error;
  }
}

export async function canonicalPath(path: string): Promise<string> {
  let existingAncestor = resolve(path);
  const missingSegments: string[] = [];
  for (;;) {
    try {
      return join(await realpath(existingAncestor), ...missingSegments.reverse());
    } catch (error) {
      if (!isErrnoCode(error, "ENOENT")) throw error;
      const parent = dirname(existingAncestor);
      if (parent === existingAncestor) return resolve(path);
      missingSegments.push(basename(existingAncestor));
      existingAncestor = parent;
    }
  }
}

interface DurableArtifact {
  path: string;
  contents: Buffer | string;
}

export async function publishArtifactsAtomically(
  outputRoot: string,
  artifacts: readonly DurableArtifact[],
): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const stageRoot = await mkdtemp(join(outputRoot, ".soundscape-build-stage-"));
  const staged = artifacts.map((artifact, index) => ({
    ...artifact,
    stagePath: join(stageRoot, `artifact-${index}`),
    backupPath: join(stageRoot, `backup-${index}`),
    existed: false,
  }));
  const published: typeof staged = [];
  const backedUp: typeof staged = [];

  try {
    for (const artifact of staged) await writeFile(artifact.stagePath, artifact.contents);
    for (const artifact of staged) {
      await mkdir(dirname(artifact.path), { recursive: true });
      try {
        const status = await lstat(artifact.path);
        if (!status.isFile()) {
          throw new Error(
            `Durable artifact target is not a regular file: ${basename(artifact.path)}`,
          );
        }
        artifact.existed = true;
      } catch (error) {
        if (isErrnoCode(error, "ENOENT")) continue;
        throw error;
      }
    }
    for (const artifact of staged) {
      if (!artifact.existed) continue;
      await rename(artifact.path, artifact.backupPath);
      backedUp.push(artifact);
    }
    for (const artifact of staged) {
      await rename(artifact.stagePath, artifact.path);
      published.push(artifact);
    }
  } catch (error) {
    for (const artifact of [...published].reverse()) {
      await rm(artifact.path, { force: true });
    }
    for (const artifact of [...backedUp].reverse()) {
      await rename(artifact.backupPath, artifact.path);
    }
    throw error;
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
}
