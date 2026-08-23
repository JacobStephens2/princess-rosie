import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathExists, publishArtifactsAtomically, sha256 } from "./artifacts";
import { inspectPcm, MASTERING_CONTRACT, validateMasterWav } from "./audio";
import type { PcmInspection } from "./audio";
import { cueSlug } from "./catalog";
import { createGenerateRequest } from "./model";
import type { CatalogCue, GenerateRequest } from "./model";
import type { GenerationResponse } from "./provider";

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export interface CueJobInputs {
  pipelineSchemaVersion: number;
  providerAdapter: "fake" | "real";
  providerProfile: string;
  runtimePath: string;
  sdkVersion: string;
}

export function cueJobHash(cue: CatalogCue, inputs: CueJobInputs): string {
  return sha256(stableJson({
    pipelineSchemaVersion: inputs.pipelineSchemaVersion,
    provider: "ElevenLabs",
    providerAdapter: inputs.providerAdapter,
    providerProfile: inputs.providerProfile,
    sdkVersion: inputs.sdkVersion,
    masteringContract: MASTERING_CONTRACT,
    runtimePath: inputs.runtimePath,
    cue: {
      id: cue.id,
      durationSeconds: cue.durationSeconds,
      looping: cue.looping,
      channelPolicy: cue.channelPolicy,
      masteringIntent: cue.masteringIntent,
      priority: cue.priority,
      authoring: cue.authoring,
      sourceMaster: cue.sourceMaster,
      runtimeMapping: cue.runtimeMapping,
    },
  }));
}

interface CandidateRecord {
  id: string;
  cueId: string;
  jobHash: string;
  request: GenerateRequest;
  response: Omit<GenerationResponse, "stream">;
  inspection: PcmInspection;
  sourceHash: string;
}

export interface CompletedCandidate extends CandidateRecord {
  pcm: Buffer;
}

export interface BuildRequestRecord extends GenerateRequest {
  cueId: string;
  candidate: string;
  outcome: "succeeded" | "rejected" | "failed" | "unknown";
  statusCode?: number;
}

export interface InvocationReport {
  status: "running" | "completed" | "interrupted";
  requestLimit: number;
  requests: BuildRequestRecord[];
}

export class PaidRequestLimitError extends Error {}

export class CandidateQaError extends Error {}

export interface CueJobState {
  cueId: string;
  jobHash: string;
  status: "ready" | "transmitted" | "retrying" | "unknown" | "approved";
  candidate?: string;
  attempt?: number;
}

export async function readCueJobState(
  outputRoot: string,
  cue: CatalogCue,
): Promise<CueJobState | undefined> {
  const path = join(outputRoot, ".soundscape-build", "jobs", `${cueSlug(cue.id)}.json`);
  if (!await pathExists(path)) return undefined;
  try {
    return JSON.parse(await readFile(path, "utf8")) as CueJobState;
  } catch {
    throw new Error(`Durable job state for ${cue.id} is corrupt`);
  }
}

export async function writeCueJobState(
  outputRoot: string,
  state: CueJobState,
): Promise<void> {
  await publishArtifactsAtomically(outputRoot, [{
    path: join(outputRoot, ".soundscape-build", "jobs", `${cueSlug(state.cueId)}.json`),
    contents: `${JSON.stringify(state, null, 2)}\n`,
  }]);
}

export async function writeInvocationReport(
  outputRoot: string,
  report: InvocationReport,
): Promise<void> {
  await publishArtifactsAtomically(outputRoot, [{
    path: join(outputRoot, "soundscape-build-report.json"),
    contents: `${JSON.stringify(report, null, 2)}\n`,
  }]);
}

export async function readCompletedCandidate(
  candidateRoot: string,
  cue: CatalogCue,
  jobHash: string,
  id: string,
): Promise<CompletedCandidate | undefined> {
  const pcmPath = join(candidateRoot, `${id}.pcm`);
  const metadataPath = join(candidateRoot, `${id}.json`);
  const hasPcm = await pathExists(pcmPath);
  const hasMetadata = await pathExists(metadataPath);
  if (!hasPcm && !hasMetadata) return undefined;
  if (!hasPcm || !hasMetadata) {
    throw new Error(`Completed candidate ${id} for ${cue.id} is corrupt or mismatched`);
  }
  try {
    const pcm = await readFile(pcmPath);
    const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as CandidateRecord;
    if (
      metadata.id !== id ||
      metadata.cueId !== cue.id ||
      metadata.jobHash !== jobHash ||
      metadata.sourceHash !== sha256(pcm) ||
      !cue.authoring.sourceFormats.includes(metadata.request.format) ||
      stableJson(metadata.request) !== stableJson(createGenerateRequest(cue, metadata.request.format))
    ) {
      throw new Error("candidate metadata mismatch");
    }
    const inspection = inspectPcm(pcm, metadata.request);
    if (stableJson(inspection) !== stableJson(metadata.inspection)) {
      throw new Error("candidate inspection mismatch");
    }
    return { ...metadata, pcm, inspection };
  } catch {
    throw new Error(`Completed candidate ${id} for ${cue.id} is corrupt or mismatched`);
  }
}

export async function storeCompletedCandidate(
  outputRoot: string,
  candidateRoot: string,
  candidate: CompletedCandidate,
): Promise<void> {
  const { pcm, ...metadata } = candidate;
  await publishArtifactsAtomically(outputRoot, [
    { path: join(candidateRoot, `${candidate.id}.pcm`), contents: pcm },
    {
      path: join(candidateRoot, `${candidate.id}.json`),
      contents: `${JSON.stringify(metadata, null, 2)}\n`,
    },
    {
      path: join(
        outputRoot,
        ".soundscape-build",
        "jobs",
        `${cueSlug(candidate.cueId)}.json`,
      ),
      contents: `${JSON.stringify({
        cueId: candidate.cueId,
        jobHash: candidate.jobHash,
        status: "ready",
        candidate: candidate.id,
      }, null, 2)}\n`,
    },
  ]);
}

export async function validateApprovedCue(
  outputRoot: string,
  cue: CatalogCue,
  jobHash: string,
  runtimeRelativePath = `runtime/${cueSlug(cue.id)}.wav`,
): Promise<"missing" | "valid"> {
  const slug = cueSlug(cue.id);
  const masterPath = join(outputRoot, "masters", `${slug}.wav`);
  const runtimePath = join(outputRoot, runtimeRelativePath);
  const runtimeImportPath = join(outputRoot, "runtime-imports", `${slug}.json`);
  const provenancePath = join(outputRoot, "provenance", `${slug}.json`);
  const statePath = join(outputRoot, "catalog-state", `${slug}.json`);
  const present = await Promise.all(
    [masterPath, runtimePath, runtimeImportPath, provenancePath, statePath]
      .map((path) => pathExists(path)),
  );
  if (present.every((value) => !value)) return "missing";
  if (!present.every(Boolean)) {
    throw new Error(`Approved ${cue.id} artifacts are corrupt or incomplete`);
  }
  try {
    const master = await readFile(masterPath);
    const runtime = await readFile(runtimePath);
    validateMasterWav(master, cue);
    const provenance = JSON.parse(await readFile(provenancePath, "utf8")) as {
      cueId?: string;
      jobHash?: string;
      selectedOutputHash?: string;
      runtimeDerivativeHash?: string;
    };
    const runtimeImport = JSON.parse(await readFile(runtimeImportPath, "utf8")) as {
      cueId?: string;
      runtimeMapping?: string;
      sourceHash?: string;
      derivativeHash?: string;
    };
    const state = JSON.parse(await readFile(statePath, "utf8")) as {
      cueId?: string;
      jobHash?: string;
      status?: string;
      masterHash?: string;
      runtimeHash?: string;
    };
    if (
      master.length <= 44 ||
      provenance.cueId !== cue.id ||
      provenance.jobHash !== jobHash ||
      provenance.selectedOutputHash !== sha256(master) ||
      provenance.runtimeDerivativeHash !== sha256(runtime) ||
      runtimeImport.cueId !== cue.id ||
      runtimeImport.runtimeMapping !== cue.runtimeMapping ||
      runtimeImport.sourceHash !== sha256(master) ||
      runtimeImport.derivativeHash !== sha256(runtime) ||
      state.cueId !== cue.id ||
      state.jobHash !== jobHash ||
      state.status !== "approved" ||
      state.masterHash !== sha256(master) ||
      state.runtimeHash !== sha256(runtime)
    ) {
      throw new Error("approval mismatch");
    }
    return "valid";
  } catch {
    throw new Error(`Approved ${cue.id} artifacts are corrupt or mismatched`);
  }
}
