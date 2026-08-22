import { readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import {
  canonicalPath,
  pathExists,
  publishArtifactsAtomically,
  sha256,
} from "./artifacts";
import {
  inspectPcm,
  masterCatalogAudio,
  masterMonoWav,
  validateMasterWav,
} from "./audio";
import type { MasteredAudio, PcmInspection } from "./audio";
import {
  CandidateQaError,
  cueJobHash,
  PaidRequestLimitError,
  readCompletedCandidate,
  readCueJobState,
  storeCompletedCandidate,
  validateApprovedCue,
  writeCueJobState,
  writeInvocationReport,
} from "./build-state";
import type { CompletedCandidate, InvocationReport } from "./build-state";
import {
  cueSlug,
  loadCatalog,
  loadRuntimeMappings,
  validateCatalog,
} from "./catalog";
import type { CatalogInputPaths } from "./catalog";
import { manageMediaDocs } from "./media-docs";
import { createGenerateRequest } from "./model";
import type { CatalogCue, GenerateRequest } from "./model";
import {
  createFakeProvider,
  createRealProvider,
  isDocumentedFormatRejection,
  isExplicitRetryableResponse,
  providerStatusCode,
  readStream,
  resolveCredential,
} from "./provider";
import type { Environment, GenerationResponse } from "./provider";
import { createRuntimeArtifact } from "./runtime";

const require = createRequire(import.meta.url);
const SDK_VERSION = (
  require("@elevenlabs/elevenlabs-js/package.json") as { version: string }
).version;
const PIPELINE_SCHEMA_VERSION = 2;

interface CliInput {
  argv: readonly string[];
  env: Environment;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
  realProviderBaseUrl?: string;
  protectedProductionOutputRoot?: string;
  waitForRetry?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  approveCandidates?: (
    candidates: readonly ApprovalCandidate[],
  ) => Promise<ApprovalInput>;
}

interface ConfirmationArgs {
  command: "confirmation";
  catalogPath: string;
  outputRoot: string;
  provider: "fake" | "real";
  fake48Khz: "accept" | "reject";
  approvedCandidate?: CandidateId;
  selectionReason?: string;
  forceCue?: string;
}

interface BuildArgs extends CatalogInputPaths {
  command: "build";
  outputRoot: string;
  provider: "fake" | "real";
  fake48Khz: "accept" | "reject";
  fakeAudio: "valid" | "silent" | "short" | "bad-loop";
  cue: string | "all";
  paidRequestLimit: number;
  approvedCandidate?: string;
  selectionReason?: string;
  forceCue?: string;
  recoverUnknownCue?: string;
}

interface ValidateArgs extends CatalogInputPaths {
  command: "validate";
}

interface RemasterArgs extends CatalogInputPaths {
  command: "remaster";
  outputRoot: string;
  cue: string | "all";
}

interface MediaDocsArgs {
  command: "media-docs";
  outputRoot: string;
  mediaDocPath: string;
  mode: "generate" | "validate";
}

type ParsedArgs = BuildArgs | ConfirmationArgs | MediaDocsArgs | RemasterArgs | ValidateArgs;

interface ApprovalCandidate {
  id: string;
  previewWav: Buffer;
}

interface ApprovalInput {
  approvedCandidate: string;
  selectionReason: string;
}

const CANDIDATE_IDS = ["candidate-1", "candidate-2", "candidate-3"] as const;
type CandidateId = (typeof CANDIDATE_IDS)[number];

function parseCandidateId(value: string | undefined): CandidateId | undefined {
  return CANDIDATE_IDS.find((candidateId) => candidateId === value);
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0];
  if (
    command !== "confirmation" &&
    command !== "build" &&
    command !== "media-docs" &&
    command !== "remaster" &&
    command !== "validate"
  ) {
    throw new Error("Usage: build|confirmation|media-docs|remaster|validate [options]");
  }
  if (
    argv.some(
      (value) =>
        value === "--api-key" ||
        value.startsWith("--api-key=") ||
        value === "--elevenlabs-api-key" ||
        value.startsWith("--elevenlabs-api-key="),
    )
  ) {
    throw new Error("ElevenLabs credentials must not be supplied as command arguments");
  }

  const values = new Map<string, string>();
  const knownOptions = new Set([
    "--catalog",
    "--source-media",
    "--runtime-mappings",
    "--cue",
    "--paid-request-limit",
    "--recover-unknown",
    "--output-root",
    "--provider",
    "--fake-48khz",
    "--fake-audio",
    "--media-doc",
    "--mode",
    "--approve",
    "--selection-reason",
    "--force",
  ]);
  for (let index = 1; index < argv.length; index += 2) {
    const option = argv[index];
    const value = argv[index + 1];
    if (!option?.startsWith("--") || value === undefined) {
      throw new Error("Every Soundscape Build option requires a value");
    }
    if (!knownOptions.has(option)) throw new Error(`Unknown Soundscape Build option: ${option}`);
    values.set(option, value);
  }

  const catalogPath = values.get("--catalog");
  if (command === "media-docs") {
    const outputRoot = values.get("--output-root");
    const mediaDocPath = values.get("--media-doc");
    const mode = values.get("--mode");
    if (!outputRoot || !mediaDocPath || (mode !== "generate" && mode !== "validate")) {
      throw new Error("Missing required Soundscape Build option");
    }
    return { command, outputRoot, mediaDocPath, mode };
  }
  if (command === "validate") {
    const sourceMediaPath = values.get("--source-media");
    const runtimeMappingsPath = values.get("--runtime-mappings");
    if (!catalogPath || !sourceMediaPath || !runtimeMappingsPath) {
      throw new Error("Missing required Soundscape Build option");
    }
    return { command, catalogPath, sourceMediaPath, runtimeMappingsPath };
  }
  const outputRoot = values.get("--output-root");
  if (command === "remaster") {
    const sourceMediaPath = values.get("--source-media");
    const runtimeMappingsPath = values.get("--runtime-mappings");
    const cue = values.get("--cue");
    if (!catalogPath || !sourceMediaPath || !runtimeMappingsPath || !outputRoot || !cue) {
      throw new Error("Missing required Soundscape Build option");
    }
    return { command, catalogPath, sourceMediaPath, runtimeMappingsPath, outputRoot, cue };
  }
  const provider = values.get("--provider");
  const fake48Khz = values.get("--fake-48khz") ?? "accept";
  const fakeAudio = values.get("--fake-audio") ?? "valid";
  const approvedCandidateValue = values.get("--approve");
  const approvedCandidate = parseCandidateId(approvedCandidateValue);
  const selectionReason = values.get("--selection-reason");
  const forceCue = values.get("--force");
  const recoverUnknownCue = values.get("--recover-unknown");
  const hasExplicitApproval = approvedCandidateValue !== undefined || selectionReason !== undefined;
  if (command === "build") {
    const sourceMediaPath = values.get("--source-media");
    const runtimeMappingsPath = values.get("--runtime-mappings");
    const cue = values.get("--cue");
    const paidRequestLimitValue = values.get("--paid-request-limit") ?? "30";
    const paidRequestLimit = Number(paidRequestLimitValue);
    if (
      !catalogPath ||
      !sourceMediaPath ||
      !runtimeMappingsPath ||
      !outputRoot ||
      !cue ||
      !["fake", "real"].includes(provider ?? "") ||
      !["accept", "reject"].includes(fake48Khz) ||
      !["valid", "silent", "short", "bad-loop"].includes(fakeAudio) ||
      !Number.isSafeInteger(paidRequestLimit) ||
      paidRequestLimit < 1 ||
      (hasExplicitApproval && !approvedCandidateValue) ||
      (hasExplicitApproval && !selectionReason?.trim())
    ) {
      throw new Error("Missing required Soundscape Build option");
    }
    return {
      command,
      catalogPath,
      sourceMediaPath,
      runtimeMappingsPath,
      outputRoot,
      provider: provider as "fake" | "real",
      fake48Khz: fake48Khz as "accept" | "reject",
      fakeAudio: fakeAudio as "valid" | "silent" | "short" | "bad-loop",
      cue,
      paidRequestLimit,
      ...(approvedCandidateValue ? { approvedCandidate: approvedCandidateValue } : {}),
      ...(selectionReason ? { selectionReason } : {}),
      ...(forceCue ? { forceCue } : {}),
      ...(recoverUnknownCue ? { recoverUnknownCue } : {}),
    };
  }
  if (
    !catalogPath ||
    !outputRoot ||
    !["fake", "real"].includes(provider ?? "") ||
    !["accept", "reject"].includes(fake48Khz) ||
    (hasExplicitApproval && !approvedCandidate) ||
    (hasExplicitApproval && !selectionReason?.trim()) ||
    (forceCue !== undefined && forceCue !== "cue.story.confirmation")
  ) {
    throw new Error("Missing required Soundscape Build option");
  }

  return {
    command: "confirmation",
    catalogPath,
    outputRoot,
    provider: provider as "fake" | "real",
    fake48Khz: fake48Khz as "accept" | "reject",
    ...(approvedCandidate ? { approvedCandidate } : {}),
    ...(selectionReason ? { selectionReason } : {}),
    ...(forceCue ? { forceCue } : {}),
  };
}

function validateConfirmationCue(cue: CatalogCue): void {
  if (cue.authoring?.candidateCount !== 3) {
    throw new Error("The confirmation tracer requires exactly three candidates");
  }
  if (
    typeof cue.authoring.prompt !== "string" ||
    cue.authoring.prompt.trim() === "" ||
    cue.authoring.model !== "eleven_text_to_sound_v2" ||
    cue.authoring.promptInfluence < 0 ||
    cue.authoring.promptInfluence > 1 ||
    cue.authoring.sourceFormats?.[0] !== "pcm_48000" ||
    cue.authoring.sourceFormats?.[1] !== "pcm_24000" ||
    cue.durationSeconds < 0.5 ||
    cue.durationSeconds > 30 ||
    cue.looping !== false ||
    cue.channelPolicy !== "focused-mono"
  ) {
    throw new Error("The story confirmation authoring catalog is invalid");
  }
}

async function buildConfirmation(
  args: ConfirmationArgs,
  credential: string,
  realProviderBaseUrl: string | undefined,
  protectedProductionOutputRoot: string | undefined,
  approveCandidates: CliInput["approveCandidates"],
): Promise<void> {
  const catalog = await loadCatalog(args.catalogPath);
  const cue = catalog.entries.find(({ id }) => id === "cue.story.confirmation");
  if (!cue) throw new Error("The soundscape catalog has no story confirmation cue");
  validateConfirmationCue(cue);
  if (
    args.selectionReason?.includes(credential) ||
    JSON.stringify(cue).includes(credential)
  ) {
    throw new Error("Credential material must not appear in Soundscape Build inputs");
  }
  const masterPath = join(args.outputRoot, "masters", "story-confirmation.wav");
  const provenancePath = join(args.outputRoot, "provenance", "story-confirmation.json");
  const reportPath = join(args.outputRoot, "soundscape-build-report.json");
  if (
    args.provider === "fake" &&
    protectedProductionOutputRoot &&
    await canonicalPath(args.outputRoot) === await canonicalPath(protectedProductionOutputRoot)
  ) {
    throw new Error("Fake Soundscape Build media cannot be written to the production output root");
  }
  const hasDurableApproval =
    (await pathExists(masterPath)) ||
    (await pathExists(provenancePath)) ||
    (await pathExists(reportPath));
  if (hasDurableApproval && args.forceCue !== cue.id) {
    throw new Error(
      "Approved cue.story.confirmation is immutable; use --force cue.story.confirmation to replace it",
    );
  }
  const provider = args.provider === "fake"
    ? createFakeProvider(credential, { reject48Khz: args.fake48Khz === "reject" })
    : createRealProvider(credential, realProviderBaseUrl);
  const subscription = await provider.subscription();
  if (
    args.provider === "real" &&
    (subscription.status !== "active" || ["free", "trial"].includes(subscription.tier))
  ) {
    throw new Error("An active paid ElevenLabs plan is required for approved media");
  }

  const requests: Array<GenerateRequest & {
    candidate: CandidateId | "format-probe";
    outcome: "succeeded" | "rejected";
  }> = [];
  const candidates: Array<{
    id: CandidateId;
    request: GenerateRequest;
    response: GenerationResponse;
    pcm: Buffer;
    inspection: PcmInspection;
  }> = [];
  const generateCandidate = async (
    index: number,
    format: GenerateRequest["format"],
  ): Promise<void> => {
    const request = createGenerateRequest(cue, format);
    const id = CANDIDATE_IDS[index - 1];
    if (!id) throw new Error(`Invalid confirmation candidate index: ${index}`);
    const response = await provider.generate(request);
    const pcm = await readStream(response.stream);
    requests.push({ ...request, candidate: id, outcome: "succeeded" });
    candidates.push({ id, request, response, pcm, inspection: inspectPcm(pcm, request) });
  };

  let formatProbeOutcome: {
    requestedFormat: GenerateRequest["format"];
    outcome: "accepted" | "rejected";
    statusCode?: number;
    fallbackFormat?: GenerateRequest["format"];
  };
  let candidateIndex = 1;
  try {
    await generateCandidate(candidateIndex, cue.authoring.sourceFormats[0]);
    formatProbeOutcome = { requestedFormat: cue.authoring.sourceFormats[0], outcome: "accepted" };
    candidateIndex += 1;
  } catch (error) {
    if (!isDocumentedFormatRejection(error)) throw error;
    const rejectedRequest = createGenerateRequest(cue, cue.authoring.sourceFormats[0]);
    requests.push({
      ...rejectedRequest,
      candidate: "format-probe",
      outcome: "rejected",
    });
    formatProbeOutcome = {
      requestedFormat: cue.authoring.sourceFormats[0],
      outcome: "rejected",
      statusCode: providerStatusCode(error),
      fallbackFormat: cue.authoring.sourceFormats[1],
    };
  }

  const activeFormat = formatProbeOutcome.outcome === "accepted"
    ? formatProbeOutcome.requestedFormat
    : cue.authoring.sourceFormats[1];
  for (; candidateIndex <= cue.authoring.candidateCount; candidateIndex += 1) {
    await generateCandidate(candidateIndex, activeFormat);
  }
  const firstSuccessfulCandidate = candidates[0];
  if (!firstSuccessfulCandidate) throw new Error("The format probe produced no PCM payload");
  const formatProbe = {
    ...formatProbeOutcome,
    establishedChannelLayout: {
      candidate: firstSuccessfulCandidate.id,
      sourceChannels: firstSuccessfulCandidate.inspection.channels,
      sampleRate: firstSuccessfulCandidate.inspection.sampleRate,
      sampleFormat: "signed-16-bit-little-endian",
    },
  };

  const masteredCandidates = candidates.map((candidate) => ({
    ...candidate,
    ...masterMonoWav(candidate.pcm, candidate.inspection, cue),
  }));
  const approvalInput = args.approvedCandidate && args.selectionReason
    ? { approvedCandidate: args.approvedCandidate, selectionReason: args.selectionReason }
    : await approveCandidates!(
      masteredCandidates.map(({ id, wav }) => ({ id, previewWav: wav })),
    );
  const approvedCandidate = parseCandidateId(approvalInput.approvedCandidate);
  if (!approvedCandidate || !approvalInput.selectionReason.trim()) {
    throw new Error("A valid candidate and selection reason are required for approval");
  }
  if (approvalInput.selectionReason.includes(credential)) {
    throw new Error("Credential material must not appear in Soundscape Build inputs");
  }
  const selected = masteredCandidates.find(({ id }) => id === approvedCandidate);
  if (!selected) throw new Error("The approved candidate is not in this generation batch");
  const { wav, processing } = selected;

  const timestamp = new Date().toISOString();
  const provenance = {
    schemaVersion: PIPELINE_SCHEMA_VERSION,
    cueId: cue.id,
    sourceMasterId: "source-master.story.confirmation",
    provider: "ElevenLabs",
    adapter: args.provider,
    sdkVersion: SDK_VERSION,
    model: selected.request.model,
    parameters: {
      prompt: selected.request.text,
      durationSeconds: selected.request.durationSeconds,
      promptInfluence: selected.request.promptInfluence,
      loop: selected.request.loop,
      sourceFormat: selected.request.format,
    },
    generationTimestamp: timestamp,
    requestId: selected.response.requestId,
    traceId: selected.response.traceId,
    providerReportedUsage: selected.response.usage,
    sourceHash: sha256(selected.pcm),
    selectedOutputHash: sha256(wav),
    channelLayout: {
      sourceChannels: selected.inspection.channels,
      masterChannels: 1,
      sampleRate: selected.inspection.sampleRate,
      sampleFormat: "signed-16-bit-little-endian",
    },
    processing,
    formatProbe,
    commercialPlanStatus: { ...subscription, activePaid: args.provider === "real" },
    approvedCandidate: selected.id,
    selectionReason: approvalInput.selectionReason,
  };
  await publishArtifactsAtomically(args.outputRoot, [
    { path: masterPath, contents: wav },
    { path: provenancePath, contents: `${JSON.stringify(provenance, null, 2)}\n` },
    {
      path: reportPath,
      contents: `${JSON.stringify({ cueId: cue.id, status: "approved", requests }, null, 2)}\n`,
    },
  ]);
}

async function remasterCatalog(args: RemasterArgs): Promise<number> {
  await validateCatalog(args);
  const [catalog, runtimeMappings] = await Promise.all([
    loadCatalog(args.catalogPath),
    loadRuntimeMappings(args.runtimeMappingsPath),
  ]);
  const runtimePathByMapping = new Map(
    runtimeMappings.mappings.map((mapping) => [mapping.id, mapping.path]),
  );
  const cues: CatalogCue[] = [];
  for (const cue of catalog.entries) {
    if (args.cue !== "all" && cue.id !== args.cue) continue;
    if (args.cue === "all") {
      const statePath = join(args.outputRoot, "catalog-state", `${cueSlug(cue.id)}.json`);
      if (!await pathExists(statePath)) continue;
      const state = JSON.parse(await readFile(statePath, "utf8")) as { status?: string };
      if (state.status !== "approved") continue;
    }
    cues.push(cue);
  }
  if (cues.length === 0) throw new Error(`No approved soundscape cue matches: ${args.cue}`);
  for (const cue of cues) {
    const slug = cueSlug(cue.id);
    const runtimeRelativePath = runtimePathByMapping.get(cue.runtimeMapping)!;
    const provenance = JSON.parse(
      await readFile(join(args.outputRoot, "provenance", `${slug}.json`), "utf8"),
    ) as { adapter?: "fake" | "real"; providerProfile?: string };
    if (provenance.adapter !== "fake" && provenance.adapter !== "real") {
      throw new Error(`Approved ${cue.id} provenance has no valid provider adapter`);
    }
    const jobHash = cueJobHash(cue, {
      pipelineSchemaVersion: PIPELINE_SCHEMA_VERSION,
      providerAdapter: provenance.adapter,
      providerProfile: provenance.providerProfile ??
        (provenance.adapter === "real" ? "elevenlabs-api-v1" : "fake-default"),
      runtimePath: runtimeRelativePath,
      sdkVersion: SDK_VERSION,
    });
    await validateApprovedCue(
      args.outputRoot,
      cue,
      jobHash,
      runtimeRelativePath,
    );
    const masterPath = join(args.outputRoot, "masters", `${slug}.wav`);
    const statePath = join(args.outputRoot, "catalog-state", `${slug}.json`);
    const master = await readFile(masterPath);
    const audioQa = validateMasterWav(master, cue);
    const { derivative, runtimeImport } = createRuntimeArtifact(
      cue,
      master,
      audioQa,
      runtimeRelativePath,
    );
    const state = JSON.parse(await readFile(statePath, "utf8")) as Record<string, unknown>;
    await publishArtifactsAtomically(args.outputRoot, [
      { path: join(args.outputRoot, runtimeRelativePath), contents: derivative },
      {
        path: join(args.outputRoot, "runtime-imports", `${slug}.json`),
        contents: `${JSON.stringify(runtimeImport, null, 2)}\n`,
      },
      {
        path: statePath,
        contents: `${JSON.stringify({
          ...state,
          runtimePath: runtimeRelativePath,
          runtimeHash: sha256(derivative),
        }, null, 2)}\n`,
      },
    ]);
  }
  return cues.length;
}

async function buildCatalog(
  args: BuildArgs,
  credential: string,
  input: CliInput,
): Promise<void> {
  await validateCatalog(args);
  const [catalog, runtimeMappings] = await Promise.all([
    loadCatalog(args.catalogPath),
    loadRuntimeMappings(args.runtimeMappingsPath),
  ]);
  const runtimePathByMapping = new Map(
    runtimeMappings.mappings.map((mapping) => [mapping.id, mapping.path]),
  );
  const cues = args.cue === "all"
    ? catalog.entries
    : catalog.entries.filter(({ id }) => id === args.cue);
  if (cues.length === 0) throw new Error(`Unknown soundscape cue: ${args.cue}`);
  if (args.forceCue && !cues.some(({ id }) => id === args.forceCue)) {
    throw new Error("The force option must name a cue selected by this build command");
  }
  if (
    args.provider === "fake" &&
    input.protectedProductionOutputRoot &&
    await canonicalPath(args.outputRoot) === await canonicalPath(input.protectedProductionOutputRoot)
  ) {
    throw new Error("Fake Soundscape Build media cannot be written to the production output root");
  }
  for (const cue of cues) {
    if (JSON.stringify(cue).includes(credential)) {
      throw new Error("Credential material must not appear in Soundscape Build inputs");
    }
  }

  const provider = args.provider === "fake"
    ? createFakeProvider(credential, {
      reject48Khz: args.fake48Khz === "reject",
      audio: args.fakeAudio,
    })
    : createRealProvider(credential, input.realProviderBaseUrl);
  const providerProfile = args.provider === "real"
    ? "elevenlabs-api-v1"
    : `fake-${args.fake48Khz}-${args.fakeAudio}`;
  const subscription = await provider.subscription();
  if (
    args.provider === "real" &&
    (subscription.status !== "active" || ["free", "trial"].includes(subscription.tier))
  ) {
    throw new Error("An active paid ElevenLabs plan is required for approved media");
  }
  const report: InvocationReport = {
    status: "running",
    requestLimit: args.paidRequestLimit,
    requests: [],
  };
  await writeInvocationReport(args.outputRoot, report);

  const requestCandidate = async (
    cue: CatalogCue,
    jobHash: string,
    id: string,
    format: GenerateRequest["format"],
  ): Promise<CompletedCandidate> => {
    const request = createGenerateRequest(cue, format);
    for (let attempt = 0; attempt <= 3; attempt += 1) {
      if (report.requests.length >= args.paidRequestLimit) {
        report.status = "interrupted";
        await writeInvocationReport(args.outputRoot, report);
        throw new PaidRequestLimitError(
          `Paid request limit ${args.paidRequestLimit} reached; rerun the same command to resume safely.`,
        );
      }
      await writeCueJobState(args.outputRoot, {
        cueId: cue.id,
        jobHash,
        status: "transmitted",
        candidate: id,
        attempt: attempt + 1,
      });
      let response: GenerationResponse;
      let pcm: Buffer;
      try {
        response = await provider.generate(request);
        pcm = await readStream(response.stream);
      } catch (error) {
        const statusCode = providerStatusCode(error);
        const explicitResponse = statusCode !== undefined;
        const retryable = isExplicitRetryableResponse(error);
        report.requests.push({
          ...request,
          cueId: cue.id,
          candidate: id,
          outcome: explicitResponse
            ? (isDocumentedFormatRejection(error) ? "rejected" : "failed")
            : "unknown",
          ...(statusCode ? { statusCode } : {}),
        });
        await writeInvocationReport(args.outputRoot, report);
        if (retryable && attempt < 3) {
          await writeCueJobState(args.outputRoot, {
            cueId: cue.id,
            jobHash,
            status: "retrying",
            candidate: id,
            attempt: attempt + 1,
          });
          const jitter = Math.floor((input.random?.() ?? Math.random()) * 100);
          const delay = 250 * (2 ** attempt) + jitter;
          if (input.waitForRetry) {
            await input.waitForRetry(delay);
          } else {
            await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, delay));
          }
          continue;
        }
        if (!explicitResponse) {
          await writeCueJobState(args.outputRoot, {
            cueId: cue.id,
            jobHash,
            status: "unknown",
            candidate: id,
            attempt: attempt + 1,
          });
          throw new Error(
            `Paid request for ${cue.id} ${id} has unknown outcome; acknowledge it explicitly before recovery.`,
          );
        }
        await writeCueJobState(args.outputRoot, {
          cueId: cue.id,
          jobHash,
          status: "ready",
          candidate: id,
          attempt: attempt + 1,
        });
        throw error;
      }
      let inspection: PcmInspection;
      try {
        inspection = inspectPcm(pcm, request);
      } catch (error) {
        report.requests.push({
          ...request,
          cueId: cue.id,
          candidate: id,
          outcome: "failed",
        });
        await writeInvocationReport(args.outputRoot, report);
        await writeCueJobState(args.outputRoot, {
          cueId: cue.id,
          jobHash,
          status: "ready",
          candidate: id,
          attempt: attempt + 1,
        });
        throw new CandidateQaError(
          error instanceof Error ? error.message : "Candidate audio QA failed",
        );
      }
      report.requests.push({
        ...request,
        cueId: cue.id,
        candidate: id,
        outcome: "succeeded",
      });
      await writeInvocationReport(args.outputRoot, report);
      return {
        id,
        cueId: cue.id,
        jobHash,
        request,
        response: {
          requestId: response.requestId,
          traceId: response.traceId,
          usage: response.usage,
        },
        inspection,
        sourceHash: sha256(pcm),
        pcm,
      };
    }
    throw new Error(`Retry planning failed for ${cue.id} ${id}`);
  };

  for (const cue of cues) {
    const runtimeRelativePath = runtimePathByMapping.get(cue.runtimeMapping)!;
    const jobHash = cueJobHash(cue, {
      pipelineSchemaVersion: PIPELINE_SCHEMA_VERSION,
      providerAdapter: args.provider,
      providerProfile,
      runtimePath: runtimeRelativePath,
      sdkVersion: SDK_VERSION,
    });
    const existingJobState = await readCueJobState(args.outputRoot, cue);
    if (
      existingJobState?.jobHash === jobHash &&
      ["retrying", "transmitted", "unknown"].includes(existingJobState.status)
    ) {
      if (existingJobState.status !== "unknown") {
        await writeCueJobState(args.outputRoot, {
          ...existingJobState,
          status: "unknown",
        });
      }
      if (args.recoverUnknownCue !== cue.id) {
        throw new Error(
          `${cue.id} has an unknown paid request; use --recover-unknown ${cue.id} to continue.`,
        );
      }
      await writeCueJobState(args.outputRoot, { cueId: cue.id, jobHash, status: "ready" });
    }
    const forced = args.forceCue === cue.id;
    let approvalState: "missing" | "valid";
    try {
      approvalState = await validateApprovedCue(
        args.outputRoot,
        cue,
        jobHash,
        runtimePathByMapping.get(cue.runtimeMapping)!,
      );
    } catch (error) {
      if (!forced) throw error;
      approvalState = "missing";
    }
    if (approvalState === "valid" && !forced) continue;
    if (approvalState === "valid" && forced) approvalState = "missing";

    const slug = cueSlug(cue.id);
    const candidateRoot = join(
      args.outputRoot,
      ".soundscape-build",
      "candidates",
      slug,
      jobHash.replace("sha256:", ""),
    );
    let selected: (CompletedCandidate & MasteredAudio) | undefined;
    let selectionReason = "";
    let activeFormat: GenerateRequest["format"] = cue.authoring.sourceFormats[0];
    let formatProbeOutcome: {
      requestedFormat: GenerateRequest["format"];
      outcome: "accepted" | "rejected";
      statusCode?: number;
      fallbackFormat?: GenerateRequest["format"];
      establishedChannelLayout?: {
        candidate: string;
        sourceChannels: 1 | 2;
        sampleRate: number;
        sampleFormat: "signed-16-bit-little-endian";
      };
    } | undefined;
    const recordEstablishedFormat = (candidate: CompletedCandidate) => {
      if (formatProbeOutcome?.establishedChannelLayout) return;
      const usedFallback = candidate.request.format === cue.authoring.sourceFormats[1];
      formatProbeOutcome = {
        ...(formatProbeOutcome ?? {
          requestedFormat: cue.authoring.sourceFormats[0],
          outcome: usedFallback ? "rejected" as const : "accepted" as const,
          ...(usedFallback
            ? { statusCode: 422, fallbackFormat: cue.authoring.sourceFormats[1] }
            : {}),
        }),
        establishedChannelLayout: {
          candidate: candidate.id,
          sourceChannels: candidate.inspection.channels,
          sampleRate: candidate.inspection.sampleRate,
          sampleFormat: "signed-16-bit-little-endian",
        },
      };
    };
    for (let batch = 1; batch <= 3 && !selected; batch += 1) {
      const candidates: CompletedCandidate[] = [];
      for (let position = 1; position <= cue.authoring.candidateCount; position += 1) {
        const id = batch === 1
          ? `candidate-${position}`
          : `batch-${batch}-candidate-${position}`;
        const completed = await readCompletedCandidate(candidateRoot, cue, jobHash, id);
        if (completed) {
          activeFormat = completed.request.format;
          recordEstablishedFormat(completed);
          candidates.push(completed);
          continue;
        }
        let generated: CompletedCandidate;
        try {
          generated = await requestCandidate(cue, jobHash, id, activeFormat);
        } catch (error) {
          if (error instanceof CandidateQaError) continue;
          if (position !== 1 || !isDocumentedFormatRejection(error)) throw error;
          activeFormat = cue.authoring.sourceFormats[1];
          if (batch === 1) {
            formatProbeOutcome = {
              requestedFormat: cue.authoring.sourceFormats[0],
              outcome: "rejected",
              statusCode: providerStatusCode(error),
              fallbackFormat: activeFormat,
            };
          }
          try {
            generated = await requestCandidate(cue, jobHash, id, activeFormat);
          } catch (fallbackError) {
            if (fallbackError instanceof CandidateQaError) continue;
            throw fallbackError;
          }
        }
        recordEstablishedFormat(generated);
        await storeCompletedCandidate(args.outputRoot, candidateRoot, generated);
        candidates.push(generated);
      }
      const mastered: Array<CompletedCandidate & MasteredAudio> = [];
      let reportChanged = false;
      for (const candidate of candidates) {
        try {
          mastered.push({
            ...candidate,
            ...masterCatalogAudio(candidate.pcm, candidate.inspection, cue),
          });
        } catch {
          const requestRecord = [...report.requests].reverse().find((entry) =>
            entry.cueId === cue.id && entry.candidate === candidate.id
          );
          if (requestRecord) {
            requestRecord.outcome = "failed";
            reportChanged = true;
          }
          await rm(join(candidateRoot, `${candidate.id}.pcm`), { force: true });
          await rm(join(candidateRoot, `${candidate.id}.json`), { force: true });
        }
      }
      if (reportChanged) await writeInvocationReport(args.outputRoot, report);
      if (mastered.length === 0) continue;
      const approval = args.approvedCandidate && args.selectionReason
        ? { approvedCandidate: args.approvedCandidate, selectionReason: args.selectionReason }
        : await input.approveCandidates!(
          mastered.map(({ id, wav }) => ({ id, previewWav: wav })),
        );
      if (approval.approvedCandidate === "none") {
        for (const candidate of candidates) {
          await rm(join(candidateRoot, `${candidate.id}.pcm`), { force: true });
          await rm(join(candidateRoot, `${candidate.id}.json`), { force: true });
        }
        continue;
      }
      const approved = mastered.find(({ id }) => id === approval.approvedCandidate);
      if (!approved || !approval.selectionReason.trim()) {
        throw new Error("A valid candidate and selection reason are required for approval");
      }
      if (approval.selectionReason.includes(credential)) {
        throw new Error("Credential material must not appear in Soundscape Build inputs");
      }
      selected = approved;
      selectionReason = approval.selectionReason;
    }
    if (!selected) throw new Error(`No candidate passed QA for ${cue.id} after three batches`);
    if (!formatProbeOutcome?.establishedChannelLayout) {
      throw new Error(`Format probe state is incomplete for ${cue.id}`);
    }

    const masterPath = join(args.outputRoot, "masters", `${slug}.wav`);
    const runtimePath = join(args.outputRoot, runtimeRelativePath);
    const runtimeImportPath = join(args.outputRoot, "runtime-imports", `${slug}.json`);
    const provenancePath = join(args.outputRoot, "provenance", `${slug}.json`);
    const statePath = join(args.outputRoot, "catalog-state", `${slug}.json`);
    const { derivative: runtimeDerivative, runtimeImport } = createRuntimeArtifact(
      cue,
      selected.wav,
      selected.audioQa,
      runtimeRelativePath,
    );
    const provenance = {
      schemaVersion: PIPELINE_SCHEMA_VERSION,
      cueId: cue.id,
      sourceMasterId: cue.sourceMaster,
      runtimeMapping: cue.runtimeMapping,
      jobHash,
      provider: "ElevenLabs",
      adapter: args.provider,
      providerProfile,
      sdkVersion: SDK_VERSION,
      model: selected.request.model,
      parameters: {
        prompt: selected.request.text,
        durationSeconds: selected.request.durationSeconds,
        promptInfluence: selected.request.promptInfluence,
        loop: selected.request.loop,
        sourceFormat: selected.request.format,
      },
      generationTimestamp: new Date().toISOString(),
      requestId: selected.response.requestId,
      traceId: selected.response.traceId,
      providerReportedUsage: selected.response.usage,
      sourceHash: selected.sourceHash,
      selectedOutputHash: sha256(selected.wav),
      channelLayout: {
        sourceChannels: selected.inspection.channels,
        masterChannels: selected.audioQa.channels,
        sampleRate: selected.inspection.sampleRate,
        sampleFormat: "signed-16-bit-little-endian",
      },
      processing: selected.processing,
      formatProbe: formatProbeOutcome,
      audioQa: selected.audioQa,
      runtimeDerivativeHash: sha256(runtimeDerivative),
      commercialPlanStatus: { ...subscription, activePaid: args.provider === "real" },
      masteringIntent: cue.masteringIntent,
      channelPolicy: cue.channelPolicy,
      priority: cue.priority,
      priorityBand: cue.priority === 100 ? "critical" : "non-critical",
      approvedCandidate: selected.id,
      selectionReason,
    };
    await publishArtifactsAtomically(args.outputRoot, [
      { path: masterPath, contents: selected.wav },
      { path: runtimePath, contents: runtimeDerivative },
      { path: runtimeImportPath, contents: `${JSON.stringify(runtimeImport, null, 2)}\n` },
      { path: provenancePath, contents: `${JSON.stringify(provenance, null, 2)}\n` },
      {
        path: statePath,
        contents: `${JSON.stringify({
          cueId: cue.id,
          sourceMaster: cue.sourceMaster,
          runtimeMapping: cue.runtimeMapping,
          status: "approved",
          jobHash,
          masterPath: `masters/${slug}.wav`,
          masterHash: sha256(selected.wav),
          runtimePath: runtimeRelativePath,
          runtimeHash: sha256(runtimeDerivative),
        }, null, 2)}\n`,
      },
    ]);
    await writeCueJobState(args.outputRoot, { cueId: cue.id, jobHash, status: "approved" });
    await rm(candidateRoot, { recursive: true, force: true });
  }
  report.status = "completed";
  await writeInvocationReport(args.outputRoot, report);
}

 export async function runSoundscapeBuildCli(input: CliInput): Promise<{ exitCode: number }> {
  let credential: string | undefined;
  try {
    const args = parseArgs(input.argv);
    if (args.command === "media-docs") {
      await manageMediaDocs(args);
      input.stdout(
        `${args.mode === "generate" ? "Generated" : "Validated"} Fairytale Soundscape media documentation.`,
      );
      return { exitCode: 0 };
    }
    if (args.command === "validate") {
      const cueCount = await validateCatalog(args);
      input.stdout(
        `Validated ${cueCount} soundscape catalog ${cueCount === 1 ? "cue" : "cues"}.`,
      );
      return { exitCode: 0 };
    }
    if (args.command === "remaster") {
      const cueCount = await remasterCatalog(args);
      input.stdout(
        `Remastered ${cueCount} soundscape ${cueCount === 1 ? "cue" : "cues"}.`,
      );
      return { exitCode: 0 };
    }
    if (args.command === "build") {
      if (!args.approvedCandidate && !input.approveCandidates) {
        throw new Error("An approval prompt is required when --approve is omitted");
      }
      credential = await resolveCredential(input.env);
      await buildCatalog(args, credential, input);
      input.stdout("Soundscape catalog build completed.");
      return { exitCode: 0 };
    }
    if (!args.approvedCandidate && !input.approveCandidates) {
      throw new Error("An approval prompt is required when --approve is omitted");
    }
    credential = await resolveCredential(input.env);
    await buildConfirmation(
      args,
      credential,
      input.realProviderBaseUrl,
      input.protectedProductionOutputRoot,
      input.approveCandidates,
    );
    input.stdout("Approved story confirmation master and provenance.");
    return { exitCode: 0 };
  } catch (error) {
    const diagnostic = error instanceof Error ? error.message : "Soundscape Build failed";
    input.stderr(credential ? diagnostic.split(credential).join("[REDACTED]") : diagnostic);
    return { exitCode: 1 };
  }
}
