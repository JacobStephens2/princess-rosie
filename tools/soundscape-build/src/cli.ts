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
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const require = createRequire(import.meta.url);
const SDK_VERSION = (
  require("@elevenlabs/elevenlabs-js/package.json") as { version: string }
).version;
const PIPELINE_SCHEMA_VERSION = 1;

type Environment = Record<string, string | undefined>;

function isErrnoCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

interface CliInput {
  argv: readonly string[];
  env: Environment;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
  realProviderBaseUrl?: string;
  protectedProductionOutputRoot?: string;
  approveCandidates?: (
    candidates: readonly ApprovalCandidate[],
  ) => Promise<ApprovalInput>;
}

interface CatalogCue {
  id: string;
  durationSeconds: number;
  looping: boolean;
  channelPolicy: string;
  masteringIntent: string;
  authoring: {
    prompt: string;
    model: "eleven_text_to_sound_v2";
    promptInfluence: number;
    sourceFormats: ["pcm_48000", "pcm_24000"];
    candidateCount: number;
  };
}

interface GenerateRequest {
  text: string;
  model: "eleven_text_to_sound_v2";
  durationSeconds: number;
  promptInfluence: number;
  loop: boolean;
  format: "pcm_48000" | "pcm_24000";
}

interface GenerationResponse {
  stream: ReadableStream<Uint8Array>;
  requestId?: string;
  traceId?: string;
  usage?: Record<string, string>;
}

interface Provider {
  subscription(): Promise<{ tier: string; status: string }>;
  generate(request: GenerateRequest): Promise<GenerationResponse>;
}

interface ParsedArgs {
  command: "confirmation";
  catalogPath: string;
  outputRoot: string;
  provider: "fake" | "real";
  fake48Khz: "accept" | "reject";
  approvedCandidate?: CandidateId;
  selectionReason?: string;
  forceCue?: string;
}

interface ApprovalCandidate {
  id: CandidateId;
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

class ProviderRequestError extends Error {
  constructor(
    readonly statusCode: number,
    readonly body: unknown,
    message: string,
  ) {
    super(message);
  }
}

function providerStatusCode(error: unknown): number | undefined {
  if (error instanceof ProviderRequestError) return error.statusCode;
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }
  return undefined;
}

function providerErrorBody(error: unknown): unknown {
  if (error instanceof ProviderRequestError) return error.body;
  if (typeof error === "object" && error !== null && "body" in error) return error.body;
  return undefined;
}

function isDocumentedFormatRejection(error: unknown): boolean {
  if (providerStatusCode(error) !== 422) return false;
  const body = providerErrorBody(error);
  try {
    return JSON.stringify(body).toLowerCase().includes("invalid_output_format");
  } catch {
    return false;
  }
}

interface PcmInspection {
  channels: 1 | 2;
  sampleRate: number;
  sampleCount: number;
  peak: number;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  if (argv[0] !== "confirmation") {
    throw new Error("Usage: confirmation [options]");
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
    "--output-root",
    "--provider",
    "--fake-48khz",
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
  const outputRoot = values.get("--output-root");
  const provider = values.get("--provider");
  const fake48Khz = values.get("--fake-48khz") ?? "accept";
  const approvedCandidateValue = values.get("--approve");
  const approvedCandidate = parseCandidateId(approvedCandidateValue);
  const selectionReason = values.get("--selection-reason");
  const forceCue = values.get("--force");
  const hasExplicitApproval = approvedCandidateValue !== undefined || selectionReason !== undefined;
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

async function resolveCredential(env: Environment): Promise<string> {
  const direct = env.ELEVENLABS_API_KEY?.trim();
  if (direct) return direct;

  const keyFile = env.ELEVENLABS_API_KEY_FILE?.trim();
  if (keyFile) {
    try {
      const contents = (await readFile(keyFile, "utf8")).trim();
      if (contents && !contents.includes("\n") && !contents.includes("\r")) {
        const assignment = "ELEVENLABS_API_KEY=";
        const credential = contents.startsWith(assignment)
          ? contents.slice(assignment.length).trim()
          : contents;
        if (credential && !credential.includes("=")) return credential;
      }
    } catch {
      // Credential failures deliberately collapse to one non-sensitive diagnostic.
    }
  }

  throw new Error("ElevenLabs credentials are not configured");
}

function createFakeProvider(
  _credential: string,
  options: { reject48Khz: boolean },
): Provider {
  let requestNumber = 0;
  return {
    async subscription() {
      return { tier: "fixture", status: "active" };
    },
    async generate(request) {
      requestNumber += 1;
      if (options.reject48Khz && request.format === "pcm_48000") {
        throw new ProviderRequestError(
          422,
          { detail: { status: "invalid_output_format" } },
          "The requested PCM format is unavailable on this plan",
        );
      }
      const sampleRate = request.format === "pcm_48000" ? 48_000 : 24_000;
      const frameCount = Math.round(sampleRate * request.durationSeconds);
      const pcm = Buffer.alloc(frameCount * 2 * 2);
      const frequency = 520 + requestNumber * 70;
      for (let frame = 0; frame < frameCount; frame += 1) {
        const envelope = Math.sin((Math.PI * frame) / frameCount) ** 2;
        const sample = Math.round(
          Math.sin((2 * Math.PI * frequency * frame) / sampleRate) * envelope * 7_500,
        );
        pcm.writeInt16LE(sample, frame * 4);
        pcm.writeInt16LE(Math.round(sample * 0.92), frame * 4 + 2);
      }
      const split = Math.max(2, Math.floor(pcm.length / 3) & ~1);
      const chunks = [pcm.subarray(0, split), pcm.subarray(split, split * 2), pcm.subarray(split * 2)];
      return {
        stream: new ReadableStream<Uint8Array>({
          start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
            controller.close();
          },
        }),
        requestId: `fake-request-${requestNumber}`,
        traceId: `fake-trace-${requestNumber}`,
        usage: { characterCost: String(request.text.length) },
      };
    },
  };
}

function createRealProvider(credential: string, baseUrl: string | undefined): Provider {
  const client = new ElevenLabsClient({
    apiKey: credential,
    ...(baseUrl ? { baseUrl } : {}),
    maxRetries: 0,
  });
  return {
    async subscription() {
      const subscription = await client.user.subscription.get({ maxRetries: 0 });
      return { tier: subscription.tier, status: subscription.status };
    },
    async generate(request) {
      const { data, rawResponse } = await client.textToSoundEffects
        .convert(
          {
            text: request.text,
            modelId: request.model,
            durationSeconds: request.durationSeconds,
            promptInfluence: request.promptInfluence,
            loop: request.loop,
            outputFormat: request.format,
          },
          { maxRetries: 0 },
        )
        .withRawResponse();
      return {
        stream: data,
        requestId: rawResponse.headers.get("request-id") ?? undefined,
        traceId: rawResponse.headers.get("x-trace-id") ?? undefined,
        usage: {
          characterCost: rawResponse.headers.get("character-cost") ?? "not-reported",
        },
      };
    },
  };
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function inspectPcm(pcm: Buffer, request: GenerateRequest): PcmInspection {
  if (pcm.length === 0 || pcm.length % 2 !== 0) throw new Error("Invalid PCM payload");
  const sampleRate = request.format === "pcm_48000" ? 48_000 : 24_000;
  const expectedFrames = sampleRate * request.durationSeconds;
  const samples = pcm.length / 2;
  const channelEstimate = samples / expectedFrames;
  const channels = Math.abs(channelEstimate - 1) <= 0.02 ? 1 : Math.abs(channelEstimate - 2) <= 0.02 ? 2 : undefined;
  if (!channels) throw new Error("PCM channel layout could not be established");
  let peak = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    peak = Math.max(peak, Math.abs(pcm.readInt16LE(offset)) / 32_768);
  }
  if (peak < 0.001) throw new Error("PCM payload is silent");
  return { channels, sampleRate, sampleCount: samples / channels, peak };
}

function masterMonoWav(pcm: Buffer, inspection: PcmInspection): { wav: Buffer; processing: string[] } {
  const mono = Buffer.alloc(inspection.sampleCount * 2);
  for (let frame = 0; frame < inspection.sampleCount; frame += 1) {
    const offset = frame * inspection.channels * 2;
    const sample = inspection.channels === 1
      ? pcm.readInt16LE(offset)
      : Math.round((pcm.readInt16LE(offset) + pcm.readInt16LE(offset + 2)) / 2);
    mono.writeInt16LE(sample, frame * 2);
  }

  const fadeInFrames = Math.min(Math.round(inspection.sampleRate * 0.01), inspection.sampleCount);
  const fadeOutFrames = Math.min(Math.round(inspection.sampleRate * 0.02), inspection.sampleCount);
  const peakCeiling = 10 ** (-6 / 20);
  const scale = inspection.peak > peakCeiling ? peakCeiling / inspection.peak : 1;
  for (let frame = 0; frame < inspection.sampleCount; frame += 1) {
    const fadeIn = fadeInFrames === 0 ? 1 : Math.min(1, frame / fadeInFrames);
    const framesRemaining = inspection.sampleCount - 1 - frame;
    const fadeOut = fadeOutFrames === 0 ? 1 : Math.min(1, framesRemaining / fadeOutFrames);
    const sample = Math.round(mono.readInt16LE(frame * 2) * scale * fadeIn * fadeOut);
    mono.writeInt16LE(Math.max(-32_768, Math.min(32_767, sample)), frame * 2);
  }

  const wav = Buffer.alloc(44 + mono.length);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + mono.length, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(inspection.sampleRate, 24);
  wav.writeUInt32LE(inspection.sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(mono.length, 40);
  mono.copy(wav, 44);

  return {
    wav,
    processing: [
      "inspect-pcm-s16le",
      ...(inspection.channels === 2 ? ["downmix-stereo-to-mono"] : []),
      "fade-in-10ms",
      "fade-out-20ms",
      "peak-ceiling--6dbfs",
      "wav-wrap-pcm16le",
    ],
  };
}

function sha256(value: Buffer | string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (isErrnoCode(error, "ENOENT")) return false;
    throw error;
  }
}

async function canonicalPath(path: string): Promise<string> {
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

async function publishApproval(
  outputRoot: string,
  artifacts: readonly DurableArtifact[],
): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const stageRoot = await mkdtemp(join(outputRoot, ".story-confirmation-stage-"));
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
            `Durable approval target is not a regular file: ${basename(artifact.path)}`,
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
  args: ParsedArgs,
  credential: string,
  realProviderBaseUrl: string | undefined,
  protectedProductionOutputRoot: string | undefined,
  approveCandidates: CliInput["approveCandidates"],
): Promise<void> {
  const catalog = JSON.parse(await readFile(args.catalogPath, "utf8")) as { entries: CatalogCue[] };
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
    ...masterMonoWav(candidate.pcm, candidate.inspection),
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
  await publishApproval(args.outputRoot, [
    { path: masterPath, contents: wav },
    { path: provenancePath, contents: `${JSON.stringify(provenance, null, 2)}\n` },
    {
      path: reportPath,
      contents: `${JSON.stringify({ cueId: cue.id, status: "approved", requests }, null, 2)}\n`,
    },
  ]);
}

function createGenerateRequest(
  cue: CatalogCue,
  format: GenerateRequest["format"],
): GenerateRequest {
  return {
    text: cue.authoring.prompt,
    model: cue.authoring.model,
    durationSeconds: cue.durationSeconds,
    promptInfluence: cue.authoring.promptInfluence,
    loop: cue.looping,
    format,
  };
}

export async function runSoundscapeBuildCli(input: CliInput): Promise<{ exitCode: number }> {
  let credential: string | undefined;
  try {
    const args = parseArgs(input.argv);
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
