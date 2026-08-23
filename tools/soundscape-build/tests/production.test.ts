import { mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { createServer, type ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { runSoundscapeBuildCli } from "../src/cli";

interface ValidationFixture {
  catalog: { entries: Array<Record<string, unknown>> };
  sourceMedia: { sourceMasters: Array<Record<string, unknown>> };
  runtimeMappings: { mappings: Array<Record<string, unknown>> };
}

function respondWithSubscription(response: ServerResponse): void {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({
    tier: "starter",
    status: "active",
    character_count: 0,
    character_limit: 10_000,
    max_credit_limit_extension: 0,
    can_extend_character_limit: false,
    allowed_to_extend_character_limit: false,
    voice_slots_used: 0,
    professional_voice_slots_used: 0,
    professional_voice_slots_used_in_workspace: 0,
    voice_limit: 0,
    voice_add_edit_counter: 0,
    professional_voice_limit: 0,
    can_extend_voice_limit: false,
    can_use_instant_voice_cloning: false,
    can_use_professional_voice_cloning: false,
    current_overage: { amount: "0", currency: "usd" },
    open_invoices: [],
    has_open_invoices: false,
  }));
}

function pcmFixture(): Buffer {
  const sampleRate = 48_000;
  const frameCount = sampleRate * 0.5;
  const pcm = Buffer.alloc(frameCount * 4);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const sample = Math.round(Math.sin((2 * Math.PI * 600 * frame) / sampleRate) * 5_000);
    pcm.writeInt16LE(sample, frame * 4);
    pcm.writeInt16LE(sample, frame * 4 + 2);
  }
  return pcm;
}

function validFixture(): ValidationFixture {
  return {
    catalog: {
      entries: [
        {
          id: "cue.test.garden-air",
          event: "sound-event.place-entry",
          match: { place: "place.rosalias-rose-garden" },
          category: "place",
          priority: 40,
          requirement: "required",
          durationSeconds: 12,
          looping: true,
          channelPolicy: "warm-stereo-loop",
          masteringIntent: "warm-garden-air-for-macbook",
          selectionStatus: "unapproved",
          authoring: {
            prompt: "Warm nonverbal garden air with soft petals. No voice or music.",
            model: "eleven_text_to_sound_v2",
            promptInfluence: 0.3,
            sourceFormats: ["pcm_48000", "pcm_24000"],
            candidateCount: 3,
          },
          sourceMaster: "source-master.test.garden-air",
          runtimeMapping: "runtime-cue.test.garden-air",
          fallbackRole: "fallback.optional-silence",
        },
      ],
    },
    sourceMedia: {
      sourceMasters: [
        {
          id: "source-master.test.garden-air",
          role: "source-media.generated-master",
          provenanceRole: "provenance.commercial-generated-effect",
        },
      ],
    },
    runtimeMappings: {
      mappings: [
        {
          id: "runtime-cue.test.garden-air",
          sourceMaster: "source-master.test.garden-air",
          path: "runtime/garden-air.wav",
        },
      ],
    },
  };
}

async function validateFixture(fixture: ValidationFixture): Promise<{
  exitCode: number;
  stdout: string[];
  stderr: string[];
}> {
  const root = await mkdtemp(join(tmpdir(), "rosi-soundscape-validation-"));
  const catalogPath = join(root, "catalog.json");
  const sourceMediaPath = join(root, "source-media.json");
  const runtimeMappingsPath = join(root, "runtime-mappings.json");
  await Promise.all([
    writeFile(catalogPath, JSON.stringify(fixture.catalog)),
    writeFile(sourceMediaPath, JSON.stringify(fixture.sourceMedia)),
    writeFile(runtimeMappingsPath, JSON.stringify(fixture.runtimeMappings)),
  ]);
  const stdout: string[] = [];
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
    ],
    env: {},
    stdout: (message) => stdout.push(message),
    stderr: (message) => stderr.push(message),
  });
  return { exitCode: result.exitCode, stdout, stderr };
}

function multiCueFixture(cueCount: number): ValidationFixture {
  const fixture = validFixture();
  const template = fixture.catalog.entries[0]!;
  fixture.catalog.entries = Array.from({ length: cueCount }, (_, index) => ({
    ...template,
    id: `cue.test.${index + 1}`,
    match: { place: `place.test-${index + 1}` },
    durationSeconds: 0.5,
    looping: false,
    channelPolicy: "focused-mono",
    masteringIntent: "gentle-test-response-for-macbook",
    authoring: {
      ...(template.authoring as Record<string, unknown>),
      prompt: `Gentle nonverbal test response ${index + 1}. No voice or music.`,
    },
    sourceMaster: `source-master.test.${index + 1}`,
    runtimeMapping: `runtime-cue.test.${index + 1}`,
  }));
  fixture.sourceMedia.sourceMasters = Array.from({ length: cueCount }, (_, index) => ({
    id: `source-master.test.${index + 1}`,
    role: "source-media.generated-master",
    provenanceRole: "provenance.commercial-generated-effect",
  }));
  fixture.runtimeMappings.mappings = Array.from({ length: cueCount }, (_, index) => ({
    id: `runtime-cue.test.${index + 1}`,
    sourceMaster: `source-master.test.${index + 1}`,
    path: `runtime/test-${index + 1}.wav`,
  }));
  return fixture;
}

async function writeFixture(root: string, fixture: ValidationFixture): Promise<{
  catalogPath: string;
  sourceMediaPath: string;
  runtimeMappingsPath: string;
}> {
  const catalogPath = join(root, "catalog.json");
  const sourceMediaPath = join(root, "source-media.json");
  const runtimeMappingsPath = join(root, "runtime-mappings.json");
  await Promise.all([
    writeFile(catalogPath, JSON.stringify(fixture.catalog)),
    writeFile(sourceMediaPath, JSON.stringify(fixture.sourceMedia)),
    writeFile(runtimeMappingsPath, JSON.stringify(fixture.runtimeMappings)),
  ]);
  return { catalogPath, sourceMediaPath, runtimeMappingsPath };
}

async function buildFixture(input: {
  fixtureRoot: string;
  outputRoot: string;
  cue?: string;
  paidRequestLimit?: number;
  recoverUnknown?: boolean;
  approveCandidates: NonNullable<Parameters<typeof runSoundscapeBuildCli>[0]["approveCandidates"]>;
}): Promise<{ exitCode: number; stdout: string[]; stderr: string[]; report: Record<string, unknown> }> {
  const paths = await writeFixture(input.fixtureRoot, multiCueFixture(
    input.cue ? 1 : 11,
  ));
  const stdout: string[] = [];
  const stderr: string[] = [];
  const result = await runSoundscapeBuildCli({
    argv: [
      "build",
      "--catalog",
      paths.catalogPath,
      "--source-media",
      paths.sourceMediaPath,
      "--runtime-mappings",
      paths.runtimeMappingsPath,
      "--output-root",
      input.outputRoot,
      "--provider",
      "fake",
      "--cue",
      input.cue ?? "all",
      ...(input.paidRequestLimit === undefined
        ? []
        : ["--paid-request-limit", String(input.paidRequestLimit)]),
      ...(input.recoverUnknown ? ["--recover-unknown", "cue.test.1"] : []),
    ],
    env: { ELEVENLABS_API_KEY: "production-planning-fixture-secret" },
    approveCandidates: input.approveCandidates,
    stdout: (message) => stdout.push(message),
    stderr: (message) => stderr.push(message),
  });
  const report = JSON.parse(
    await readFile(join(input.outputRoot, "soundscape-build-report.json"), "utf8"),
  ) as Record<string, unknown>;
  return { exitCode: result.exitCode, stdout, stderr, report };
}

describe("Soundscape Build production CLI", () => {
  test("validates every catalog contract before a paid request can be planned", async () => {
    const valid = await validateFixture(validFixture());

    const invalidCases: Array<{
      diagnostic: string;
      mutate: (fixture: ValidationFixture) => void;
    }> = [
      {
        diagnostic: "Duplicate catalog cue identifier: cue.test.garden-air",
        mutate: (fixture) => fixture.catalog.entries.push({ ...fixture.catalog.entries[0] }),
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air is missing required field: category",
        mutate: (fixture) => delete fixture.catalog.entries[0]?.category,
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air has invalid durationSeconds",
        mutate: (fixture) => { fixture.catalog.entries[0]!.durationSeconds = 31; },
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air has invalid promptInfluence",
        mutate: (fixture) => {
          (fixture.catalog.entries[0]!.authoring as Record<string, unknown>).promptInfluence = 1.1;
        },
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air exceeds the 450-character prompt limit",
        mutate: (fixture) => {
          (fixture.catalog.entries[0]!.authoring as Record<string, unknown>).prompt = "a".repeat(451);
        },
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air has a contradictory loop policy",
        mutate: (fixture) => { fixture.catalog.entries[0]!.looping = false; },
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air is missing required field: priority",
        mutate: (fixture) => delete fixture.catalog.entries[0]?.priority,
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air has invalid channelPolicy",
        mutate: (fixture) => { fixture.catalog.entries[0]!.channelPolicy = "surround"; },
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air has unresolved sourceMaster: source-master.test.garden-air",
        mutate: (fixture) => { fixture.sourceMedia.sourceMasters = []; },
      },
      {
        diagnostic: "Catalog cue cue.test.garden-air has unresolved runtimeMapping: runtime-cue.test.garden-air",
        mutate: (fixture) => { fixture.runtimeMappings.mappings = []; },
      },
    ];
    const invalid = [];
    for (const invalidCase of invalidCases) {
      const fixture = validFixture();
      invalidCase.mutate(fixture);
      invalid.push({
        diagnostic: invalidCase.diagnostic,
        result: await validateFixture(fixture),
      });
    }

    expect({ valid, invalid }).toEqual({
      valid: {
        exitCode: 0,
        stdout: ["Validated 1 soundscape catalog cue."],
        stderr: [],
      },
      invalid: invalidCases.map(({ diagnostic }) => ({
        diagnostic,
        result: { exitCode: 1, stdout: [], stderr: [diagnostic] },
      })),
    });
  });

  test("bounds serial candidate batches and resumes validated paid work", async () => {
    const revisionRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-revisions-"));
    const auditionedBatches: string[][] = [];
    const revisionRun = await buildFixture({
      fixtureRoot: revisionRoot,
      outputRoot: join(revisionRoot, "artifacts"),
      cue: "cue.test.1",
      approveCandidates: async (candidates) => {
        auditionedBatches.push(candidates.map(({ id }) => id));
        if (auditionedBatches.length < 3) {
          return { approvedCandidate: "none", selectionReason: "No candidate passed QA." };
        }
        return {
          approvedCandidate: "batch-3-candidate-2",
          selectionReason: "The final batch's second candidate passed the MacBook QA check.",
        };
      },
    });

    const resumeRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-resume-"));
    const outputRoot = join(resumeRoot, "artifacts");
    let approvalCalls = 0;
    const interrupted = await buildFixture({
      fixtureRoot: resumeRoot,
      outputRoot,
      cue: "cue.test.1",
      paidRequestLimit: 2,
      approveCandidates: async () => {
        approvalCalls += 1;
        return { approvedCandidate: "candidate-1", selectionReason: "Should not be reached." };
      },
    });
    const resumed = await buildFixture({
      fixtureRoot: resumeRoot,
      outputRoot,
      cue: "cue.test.1",
      approveCandidates: async (candidates) => {
        approvalCalls += 1;
        return {
          approvedCandidate: candidates[0]!.id,
          selectionReason: "Resumed batch passed QA without regenerating completed candidates.",
        };
      },
    });

    const transmittedRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-transmitted-"));
    const transmittedOutput = join(transmittedRoot, "artifacts");
    await buildFixture({
      fixtureRoot: transmittedRoot,
      outputRoot: transmittedOutput,
      cue: "cue.test.1",
      paidRequestLimit: 1,
      approveCandidates: async () => ({
        approvedCandidate: "candidate-1",
        selectionReason: "Should not be reached.",
      }),
    });
    const transmittedStatePath = join(
      transmittedOutput,
      ".soundscape-build",
      "jobs",
      "test-1.json",
    );
    const transmittedState = JSON.parse(
      await readFile(transmittedStatePath, "utf8"),
    ) as Record<string, unknown>;
    await writeFile(transmittedStatePath, JSON.stringify({
      ...transmittedState,
      status: "transmitted",
      candidate: "candidate-2",
      attempt: 1,
    }));
    const blockedTransmitted = await buildFixture({
      fixtureRoot: transmittedRoot,
      outputRoot: transmittedOutput,
      cue: "cue.test.1",
      approveCandidates: async () => ({
        approvedCandidate: "candidate-1",
        selectionReason: "Should not be reached.",
      }),
    });
    const recoveredTransmitted = await buildFixture({
      fixtureRoot: transmittedRoot,
      outputRoot: transmittedOutput,
      cue: "cue.test.1",
      recoverUnknown: true,
      approveCandidates: async (candidates) => ({
        approvedCandidate: candidates[0]!.id,
        selectionReason: "Explicit recovery acknowledged the ambiguous request.",
      }),
    });

    const boundedRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-bounded-"));
    const approveFirst = async (candidates: ReadonlyArray<{ id: string }>) => ({
      approvedCandidate: candidates[0]!.id,
      selectionReason: "Automated planning fixture selected the first valid candidate.",
    });
    const bounded = await buildFixture({
      fixtureRoot: boundedRoot,
      outputRoot: join(boundedRoot, "artifacts"),
      approveCandidates: approveFirst,
    });
    const overrideRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-override-"));
    const overridden = await buildFixture({
      fixtureRoot: overrideRoot,
      outputRoot: join(overrideRoot, "artifacts"),
      paidRequestLimit: 33,
      approveCandidates: approveFirst,
    });

    expect({
      revision: {
        exitCode: revisionRun.exitCode,
        auditionedBatches,
        requestCount: (revisionRun.report.requests as unknown[]).length,
      },
      resume: {
        interruptedExitCode: interrupted.exitCode,
        interruptedDiagnostic: interrupted.stderr,
        interruptedRequestCount: (interrupted.report.requests as unknown[]).length,
        resumedExitCode: resumed.exitCode,
        resumedRequestCount: (resumed.report.requests as unknown[]).length,
        approvalCalls,
      },
      transmittedRecovery: {
        blockedExitCode: blockedTransmitted.exitCode,
        blockedDiagnostic: blockedTransmitted.stderr,
        blockedRequestCount: (blockedTransmitted.report.requests as unknown[]).length,
        recoveredExitCode: recoveredTransmitted.exitCode,
        recoveredRequestCount: (recoveredTransmitted.report.requests as unknown[]).length,
      },
      invocationLimit: {
        boundedExitCode: bounded.exitCode,
        boundedDiagnostic: bounded.stderr,
        boundedRequestCount: (bounded.report.requests as unknown[]).length,
        overriddenExitCode: overridden.exitCode,
        overriddenRequestCount: (overridden.report.requests as unknown[]).length,
      },
    }).toEqual({
      revision: {
        exitCode: 0,
        auditionedBatches: [
          ["candidate-1", "candidate-2", "candidate-3"],
          ["batch-2-candidate-1", "batch-2-candidate-2", "batch-2-candidate-3"],
          ["batch-3-candidate-1", "batch-3-candidate-2", "batch-3-candidate-3"],
        ],
        requestCount: 9,
      },
      resume: {
        interruptedExitCode: 1,
        interruptedDiagnostic: [
          "Paid request limit 2 reached; rerun the same command to resume safely.",
        ],
        interruptedRequestCount: 2,
        resumedExitCode: 0,
        resumedRequestCount: 1,
        approvalCalls: 1,
      },
      transmittedRecovery: {
        blockedExitCode: 1,
        blockedDiagnostic: [
          "cue.test.1 has an unknown paid request; use --recover-unknown cue.test.1 to continue.",
        ],
        blockedRequestCount: 0,
        recoveredExitCode: 0,
        recoveredRequestCount: 2,
      },
      invocationLimit: {
        boundedExitCode: 1,
        boundedDiagnostic: [
          "Paid request limit 30 reached; rerun the same command to resume safely.",
        ],
        boundedRequestCount: 30,
        overriddenExitCode: 0,
        overriddenRequestCount: 33,
      },
    });
  });

  test("retries only explicit responses and requires acknowledgement to recover unknown requests", async () => {
    const runAgainstServer = async (input: {
      root: string;
      responseStatus: (requestNumber: number, response: ServerResponse) => "handled" | "success";
      recoverUnknown?: boolean;
      delays?: number[];
    }) => {
      let generationRequests = 0;
      const server = createServer((request, response) => {
        if (request.url === "/v1/user/subscription") {
          respondWithSubscription(response);
          return;
        }
        generationRequests += 1;
        const result = input.responseStatus(generationRequests, response);
        if (result === "success") {
          response.setHeader("content-type", "application/octet-stream");
          response.end(pcmFixture());
        }
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Fixture server did not bind");
      const paths = await writeFixture(input.root, multiCueFixture(1));
      const stderr: string[] = [];
      const delays = input.delays ?? [];
      try {
        const result = await runSoundscapeBuildCli({
          argv: [
            "build",
            "--catalog",
            paths.catalogPath,
            "--source-media",
            paths.sourceMediaPath,
            "--runtime-mappings",
            paths.runtimeMappingsPath,
            "--output-root",
            join(input.root, "artifacts"),
            "--provider",
            "real",
            "--cue",
            "cue.test.1",
            ...(input.recoverUnknown ? ["--recover-unknown", "cue.test.1"] : []),
          ],
          env: { ELEVENLABS_API_KEY: "retry-fixture-secret" },
          realProviderBaseUrl: `http://127.0.0.1:${address.port}`,
          waitForRetry: async (milliseconds) => { delays.push(milliseconds); },
          random: () => 0.5,
          approveCandidates: async (candidates) => ({
            approvedCandidate: candidates[0]!.id,
            selectionReason: "Provider recovery fixture passed QA.",
          }),
          stdout: () => undefined,
          stderr: (message) => stderr.push(message),
        });
        return { result, stderr, generationRequests, delays };
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => error ? reject(error) : resolve()),
        );
      }
    };

    const retryRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-retry-"));
    const retried = await runAgainstServer({
      root: retryRoot,
      responseStatus: (requestNumber, response) => {
        if (requestNumber === 1) {
          response.statusCode = 429;
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ detail: { status: "rate_limited" } }));
          return "handled";
        }
        if (requestNumber === 2) {
          response.statusCode = 409;
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ detail: { status: "system_busy" } }));
          return "handled";
        }
        if (requestNumber === 3) {
          response.statusCode = 503;
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ detail: { status: "server_error" } }));
          return "handled";
        }
        return "success";
      },
    });

    const exhaustedRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-exhausted-"));
    const exhausted = await runAgainstServer({
      root: exhaustedRoot,
      responseStatus: (_requestNumber, response) => {
        response.statusCode = 500;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ detail: { status: "server_error" } }));
        return "handled";
      },
    });

    const authRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-auth-"));
    const authentication = await runAgainstServer({
      root: authRoot,
      responseStatus: (_requestNumber, response) => {
        response.statusCode = 401;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ detail: { status: "authentication_error" } }));
        return "handled";
      },
    });

    const unknownRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-unknown-"));
    const unknown = await runAgainstServer({
      root: unknownRoot,
      responseStatus: (_requestNumber, response) => {
        response.destroy();
        return "handled";
      },
    });
    const stillUnknown = await runAgainstServer({
      root: unknownRoot,
      responseStatus: () => "success",
    });
    const recovered = await runAgainstServer({
      root: unknownRoot,
      recoverUnknown: true,
      responseStatus: () => "success",
    });

    expect({
      retried: {
        exitCode: retried.result.exitCode,
        requests: retried.generationRequests,
        delays: retried.delays,
      },
      exhausted: {
        exitCode: exhausted.result.exitCode,
        requests: exhausted.generationRequests,
        delays: exhausted.delays,
      },
      authentication: {
        exitCode: authentication.result.exitCode,
        requests: authentication.generationRequests,
        delays: authentication.delays,
      },
      unknown: {
        exitCode: unknown.result.exitCode,
        requests: unknown.generationRequests,
        diagnostic: unknown.stderr,
      },
      stillUnknown: {
        exitCode: stillUnknown.result.exitCode,
        requests: stillUnknown.generationRequests,
        diagnostic: stillUnknown.stderr,
      },
      recovered: {
        exitCode: recovered.result.exitCode,
        requests: recovered.generationRequests,
      },
    }).toEqual({
      retried: { exitCode: 0, requests: 6, delays: [300, 550, 1_050] },
      exhausted: { exitCode: 1, requests: 4, delays: [300, 550, 1_050] },
      authentication: { exitCode: 1, requests: 1, delays: [] },
      unknown: {
        exitCode: 1,
        requests: 1,
        diagnostic: [
          "Paid request for cue.test.1 candidate-1 has unknown outcome; acknowledge it explicitly before recovery.",
        ],
      },
      stillUnknown: {
        exitCode: 1,
        requests: 0,
        diagnostic: [
          "cue.test.1 has an unknown paid request; use --recover-unknown cue.test.1 to continue.",
        ],
      },
      recovered: { exitCode: 0, requests: 3 },
    });
  });

  test("invalidates only changed jobs and never replaces approved or corrupt work implicitly", async () => {
    const root = await mkdtemp(join(tmpdir(), "rosi-soundscape-hashing-"));
    const outputRoot = join(root, "artifacts");
    const fixture = multiCueFixture(2);
    const paths = await writeFixture(root, fixture);
    const run = async (options: { force?: string; limit?: number; cue?: string } = {}) => {
      let approvalCalls = 0;
      const stderr: string[] = [];
      const result = await runSoundscapeBuildCli({
        argv: [
          "build",
          "--catalog",
          paths.catalogPath,
          "--source-media",
          paths.sourceMediaPath,
          "--runtime-mappings",
          paths.runtimeMappingsPath,
          "--output-root",
          outputRoot,
          "--provider",
          "fake",
          "--cue",
          options.cue ?? "all",
          ...(options.force ? ["--force", options.force] : []),
          ...(options.limit ? ["--paid-request-limit", String(options.limit)] : []),
        ],
        env: { ELEVENLABS_API_KEY: "hashing-fixture-secret" },
        approveCandidates: async (candidates) => {
          approvalCalls += 1;
          return {
            approvedCandidate: candidates[0]!.id,
            selectionReason: "Hashing and immutability fixture passed QA.",
          };
        },
        stdout: () => undefined,
        stderr: (message) => stderr.push(message),
      });
      const report = JSON.parse(
        await readFile(join(outputRoot, "soundscape-build-report.json"), "utf8"),
      ) as { requests: unknown[] };
      return { exitCode: result.exitCode, stderr, approvalCalls, requests: report.requests.length };
    };

    const initial = await run();
    const unchanged = await run();
    fixture.catalog.entries[0]!.priority = 60;
    await writeFile(paths.catalogPath, JSON.stringify(fixture.catalog));
    const changedWithoutForce = await run();
    const changedWithExactForce = await run({ force: "cue.test.1" });
    const statePath = join(outputRoot, "catalog-state", "test-1.json");
    const hashBeforeRuntimeMappingChange = (
      JSON.parse(await readFile(statePath, "utf8")) as { jobHash: string }
    ).jobHash;
    fixture.runtimeMappings.mappings[0]!.path = "runtime/test-1-remapped.wav";
    await writeFile(paths.runtimeMappingsPath, JSON.stringify(fixture.runtimeMappings));
    const changedMappingWithoutForce = await run({ cue: "cue.test.1" });
    const changedMappingWithForce = await run({ force: "cue.test.1", cue: "cue.test.1" });
    const hashAfterRuntimeMappingChange = (
      JSON.parse(await readFile(statePath, "utf8")) as { jobHash: string }
    ).jobHash;

    const corruptRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-corrupt-candidate-"));
    const corruptOutput = join(corruptRoot, "artifacts");
    const corruptPaths = await writeFixture(corruptRoot, multiCueFixture(1));
    const runCorrupt = async (limit?: number) => {
      const stderr: string[] = [];
      const result = await runSoundscapeBuildCli({
        argv: [
          "build",
          "--catalog",
          corruptPaths.catalogPath,
          "--source-media",
          corruptPaths.sourceMediaPath,
          "--runtime-mappings",
          corruptPaths.runtimeMappingsPath,
          "--output-root",
          corruptOutput,
          "--provider",
          "fake",
          "--cue",
          "cue.test.1",
          ...(limit ? ["--paid-request-limit", String(limit)] : []),
        ],
        env: { ELEVENLABS_API_KEY: "corrupt-candidate-fixture-secret" },
        approveCandidates: async (candidates) => ({
          approvedCandidate: candidates[0]!.id,
          selectionReason: "Corrupt candidate fixture.",
        }),
        stdout: () => undefined,
        stderr: (message) => stderr.push(message),
      });
      const report = JSON.parse(
        await readFile(join(corruptOutput, "soundscape-build-report.json"), "utf8"),
      ) as { requests: unknown[] };
      return { exitCode: result.exitCode, stderr, requests: report.requests.length };
    };
    await runCorrupt(2);
    const candidateHashDirectories = await readdir(
      join(corruptOutput, ".soundscape-build", "candidates", "test-1"),
    );
    await writeFile(
      join(
        corruptOutput,
        ".soundscape-build",
        "candidates",
        "test-1",
        candidateHashDirectories[0]!,
        "candidate-1.pcm",
      ),
      Buffer.alloc(0),
    );
    const corruptCandidate = await runCorrupt();

    expect({
      initial,
      unchanged,
      changedWithoutForce,
      changedWithExactForce,
      changedMappingWithoutForce,
      changedMappingWithForce,
      runtimeMappingChangesHash:
        hashBeforeRuntimeMappingChange !== hashAfterRuntimeMappingChange,
      corruptCandidate,
    }).toEqual({
      initial: { exitCode: 0, stderr: [], approvalCalls: 2, requests: 6 },
      unchanged: { exitCode: 0, stderr: [], approvalCalls: 0, requests: 0 },
      changedWithoutForce: {
        exitCode: 1,
        stderr: ["Approved cue.test.1 artifacts are corrupt or mismatched"],
        approvalCalls: 0,
        requests: 0,
      },
      changedWithExactForce: { exitCode: 0, stderr: [], approvalCalls: 1, requests: 3 },
      changedMappingWithoutForce: {
        exitCode: 1,
        stderr: ["Approved cue.test.1 artifacts are corrupt or incomplete"],
        approvalCalls: 0,
        requests: 0,
      },
      changedMappingWithForce: { exitCode: 0, stderr: [], approvalCalls: 1, requests: 3 },
      runtimeMappingChangesHash: true,
      corruptCandidate: {
        exitCode: 1,
        stderr: ["Completed candidate candidate-1 for cue.test.1 is corrupt or mismatched"],
        requests: 0,
      },
    });
  });

  test("applies synthetic audio QA and writes deterministic runtime imports", async () => {
    const runAudioBuild = async (input: {
      fixture: ValidationFixture;
      fakeAudio?:
        | "valid"
        | "silent"
        | "short"
        | "bad-loop"
        | "padded"
        | "anti-phase"
        | "duration-drift";
    }) => {
      const root = await mkdtemp(join(tmpdir(), "rosi-soundscape-audio-"));
      const outputRoot = join(root, "artifacts");
      const paths = await writeFixture(root, input.fixture);
      const stderr: string[] = [];
      const result = await runSoundscapeBuildCli({
        argv: [
          "build",
          "--catalog",
          paths.catalogPath,
          "--source-media",
          paths.sourceMediaPath,
          "--runtime-mappings",
          paths.runtimeMappingsPath,
          "--output-root",
          outputRoot,
          "--provider",
          "fake",
          "--fake-audio",
          input.fakeAudio ?? "valid",
          "--cue",
          "cue.test.1",
        ],
        env: { ELEVENLABS_API_KEY: "audio-qa-fixture-secret" },
        approveCandidates: async (candidates) => ({
          approvedCandidate: candidates[0]!.id,
          selectionReason: "Synthetic audio QA fixture passed.",
        }),
        stdout: () => undefined,
        stderr: (message) => stderr.push(message),
      });
      const report = JSON.parse(
        await readFile(join(outputRoot, "soundscape-build-report.json"), "utf8"),
      ) as { requests: unknown[] };
      return { root, outputRoot, paths, result, stderr, requestCount: report.requests.length };
    };

    const oneShot = await runAudioBuild({ fixture: multiCueFixture(1) });
    const oneShotMaster = await readFile(join(oneShot.outputRoot, "masters", "test-1.wav"));
    const oneShotProvenance = JSON.parse(
      await readFile(join(oneShot.outputRoot, "provenance", "test-1.json"), "utf8"),
    ) as { processing: string[]; audioQa: Record<string, unknown>; runtimeDerivativeHash: string };
    const runtimeImport = JSON.parse(
      await readFile(join(oneShot.outputRoot, "runtime-imports", "test-1.json"), "utf8"),
    ) as Record<string, unknown>;
    const runtimePath = join(oneShot.outputRoot, "runtime", "test-1.wav");
    const firstRuntime = await readFile(runtimePath);
    const remaster = async (cue = "cue.test.1") => runSoundscapeBuildCli({
      argv: [
        "remaster",
        "--catalog",
        oneShot.paths.catalogPath,
        "--source-media",
        oneShot.paths.sourceMediaPath,
        "--runtime-mappings",
        oneShot.paths.runtimeMappingsPath,
        "--output-root",
        oneShot.outputRoot,
        "--cue",
        cue,
      ],
      env: {},
      stdout: () => undefined,
      stderr: () => undefined,
    });
    const firstRemaster = await remaster("all");
    const secondRemaster = await remaster();
    const secondRuntime = await readFile(runtimePath);
    const padded = await runAudioBuild({
      fixture: multiCueFixture(1),
      fakeAudio: "padded",
    });
    const antiPhase = await runAudioBuild({
      fixture: multiCueFixture(1),
      fakeAudio: "anti-phase",
    });
    const durationDrift = await runAudioBuild({
      fixture: multiCueFixture(1),
      fakeAudio: "duration-drift",
    });

    const loopFixture = multiCueFixture(1);
    loopFixture.catalog.entries[0]!.looping = true;
    loopFixture.catalog.entries[0]!.channelPolicy = "warm-stereo-loop";
    const loop = await runAudioBuild({ fixture: loopFixture });
    const loopMaster = await readFile(join(loop.outputRoot, "masters", "test-1.wav"));
    const loopProvenance = JSON.parse(
      await readFile(join(loop.outputRoot, "provenance", "test-1.json"), "utf8"),
    ) as { processing: string[]; audioQa: Record<string, unknown> };

    const silent = await runAudioBuild({
      fixture: multiCueFixture(1),
      fakeAudio: "silent",
    });
    const short = await runAudioBuild({
      fixture: multiCueFixture(1),
      fakeAudio: "short",
    });
    const badLoopFixture = multiCueFixture(1);
    badLoopFixture.catalog.entries[0]!.looping = true;
    badLoopFixture.catalog.entries[0]!.channelPolicy = "warm-stereo-loop";
    const badLoop = await runAudioBuild({
      fixture: badLoopFixture,
      fakeAudio: "bad-loop",
    });

    const hash = (value: Buffer) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
    expect({
      oneShot: {
        exitCode: oneShot.result.exitCode,
        riff: oneShotMaster.subarray(0, 4).toString("ascii"),
        channels: oneShotMaster.readUInt16LE(22),
        sampleRate: oneShotMaster.readUInt32LE(24),
        firstSample: oneShotMaster.readInt16LE(44),
        lastSample: oneShotMaster.readInt16LE(oneShotMaster.length - 2),
        processing: oneShotProvenance.processing,
        audioQa: oneShotProvenance.audioQa,
        runtimeImport,
        derivativeHash: oneShotProvenance.runtimeDerivativeHash,
        observedRuntimeHash: hash(firstRuntime),
        remasterResults: [firstRemaster, secondRemaster],
        deterministicRemaster: hash(firstRuntime) === hash(secondRuntime),
      },
      padded: {
        exitCode: padded.result.exitCode,
        stderr: padded.stderr,
        requestCount: padded.requestCount,
      },
      antiPhase: {
        exitCode: antiPhase.result.exitCode,
        stderr: antiPhase.stderr,
        requestCount: antiPhase.requestCount,
      },
      durationDrift: {
        exitCode: durationDrift.result.exitCode,
        stderr: durationDrift.stderr,
        requestCount: durationDrift.requestCount,
      },
      loop: {
        exitCode: loop.result.exitCode,
        channels: loopMaster.readUInt16LE(22),
        processing: loopProvenance.processing,
        audioQa: loopProvenance.audioQa,
      },
      invalid: {
        silent: {
          exitCode: silent.result.exitCode,
          stderr: silent.stderr,
          requestCount: silent.requestCount,
        },
        short: {
          exitCode: short.result.exitCode,
          stderr: short.stderr,
          requestCount: short.requestCount,
        },
        badLoop: {
          exitCode: badLoop.result.exitCode,
          stderr: badLoop.stderr,
          requestCount: badLoop.requestCount,
        },
      },
    }).toEqual({
      oneShot: {
        exitCode: 0,
        riff: "RIFF",
        channels: 1,
        sampleRate: 48_000,
        firstSample: 0,
        lastSample: 0,
        processing: [
          "inspect-pcm-s16le",
          "trim-boundary-silence",
          "downmix-stereo-to-mono",
          "fade-in-10ms",
          "fade-out-20ms",
          "peak-ceiling--6dbfs",
          "wav-wrap-pcm16le",
          "decode-wav-qa",
        ],
        audioQa: {
          decodable: true,
          durationWithinTolerance: true,
          nonSilent: true,
          sampleRate: 48_000,
          channels: 1,
          peakDbfs: expect.any(Number),
          peakCeilingDbfs: -6,
          loopSeamDelta: null,
        },
        runtimeImport: {
          cueId: "cue.test.1",
          runtimeMapping: "runtime-cue.test.1",
          sourceMaster: "source-master.test.1",
          sourcePath: "masters/test-1.wav",
          runtimePath: "runtime/test-1.wav",
          sourceHash: hash(oneShotMaster),
          derivativeHash: hash(firstRuntime),
          import: { sampleRate: 48_000, channels: 1, looping: false },
        },
        derivativeHash: hash(firstRuntime),
        observedRuntimeHash: hash(firstRuntime),
        remasterResults: [{ exitCode: 0 }, { exitCode: 0 }],
        deterministicRemaster: true,
      },
      padded: {
        exitCode: 0,
        stderr: [],
        requestCount: 3,
      },
      antiPhase: {
        exitCode: 0,
        stderr: [],
        requestCount: 3,
      },
      durationDrift: {
        exitCode: 0,
        stderr: [],
        requestCount: 3,
      },
      loop: {
        exitCode: 0,
        channels: 2,
        processing: [
          "inspect-pcm-s16le",
          "preserve-stereo",
          "peak-ceiling--6dbfs",
          "loop-seam-qa",
          "wav-wrap-pcm16le",
          "decode-wav-qa",
        ],
        audioQa: {
          decodable: true,
          durationWithinTolerance: true,
          nonSilent: true,
          sampleRate: 48_000,
          channels: 2,
          peakDbfs: expect.any(Number),
          peakCeilingDbfs: -6,
          loopSeamDelta: expect.any(Number),
        },
      },
      invalid: {
        silent: {
          exitCode: 1,
          stderr: ["No candidate passed QA for cue.test.1 after three batches"],
          requestCount: 9,
        },
        short: {
          exitCode: 1,
          stderr: ["No candidate passed QA for cue.test.1 after three batches"],
          requestCount: 9,
        },
        badLoop: {
          exitCode: 1,
          stderr: ["No candidate passed QA for cue.test.1 after three batches"],
          requestCount: 9,
        },
      },
    });
  });

  test("generates and validates non-secret ElevenLabs project media documentation", async () => {
    const root = await mkdtemp(join(tmpdir(), "rosi-soundscape-media-docs-"));
    const built = await buildFixture({
      fixtureRoot: root,
      outputRoot: join(root, "artifacts"),
      cue: "cue.test.1",
      approveCandidates: async (candidates) => ({
        approvedCandidate: candidates[0]!.id,
        selectionReason: "Media documentation fixture passed MacBook QA.",
      }),
    });
    expect(built.exitCode).toBe(0);
    const mediaDoc = join(root, "media-prompts.md");
    await writeFile(mediaDoc, "# Media generation prompts\n\nExisting project media.\n");
    const runDocs = async (mode: "generate" | "validate") => {
      const stdout: string[] = [];
      const stderr: string[] = [];
      const result = await runSoundscapeBuildCli({
        argv: [
          "media-docs",
          "--output-root",
          join(root, "artifacts"),
          "--media-doc",
          mediaDoc,
          "--mode",
          mode,
        ],
        env: {},
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      });
      return { result, stdout, stderr };
    };

    const generated = await runDocs("generate");
    const generatedText = await readFile(mediaDoc, "utf8");
    const validated = await runDocs("validate");
    await writeFile(mediaDoc, generatedText.replace("ElevenLabs", "Provider omitted"));
    const stale = await runDocs("validate");

    const provenancePath = join(root, "artifacts", "provenance", "test-1.json");
    const provenance = JSON.parse(await readFile(provenancePath, "utf8")) as Record<string, unknown>;
    provenance.apiKey = "docs-fixture-secret";
    await writeFile(provenancePath, JSON.stringify(provenance));
    const secretBearing = await runDocs("generate");

    expect({
      generated,
      documentation: {
        hasManagedMarkers: generatedText.includes("<!-- soundscape-build:start -->") &&
          generatedText.includes("<!-- soundscape-build:end -->"),
        creditsElevenLabs: generatedText.includes("Credit: ElevenLabs"),
        containsPrompt: generatedText.includes("Gentle nonverbal test response 1"),
        containsTreatment: generatedText.includes("trim-boundary-silence"),
        containsSelection: generatedText.includes("Media documentation fixture passed MacBook QA"),
        excludesInGameCredit: generatedText.includes("No in-game provider credit is added"),
      },
      validated,
      stale,
      secretBearing,
    }).toEqual({
      generated: {
        result: { exitCode: 0 },
        stdout: ["Generated Fairytale Soundscape media documentation."],
        stderr: [],
      },
      documentation: {
        hasManagedMarkers: true,
        creditsElevenLabs: true,
        containsPrompt: true,
        containsTreatment: true,
        containsSelection: true,
        excludesInGameCredit: true,
      },
      validated: {
        result: { exitCode: 0 },
        stdout: ["Validated Fairytale Soundscape media documentation."],
        stderr: [],
      },
      stale: {
        result: { exitCode: 1 },
        stdout: [],
        stderr: ["Fairytale Soundscape media documentation is stale or incomplete"],
      },
      secretBearing: {
        result: { exitCode: 1 },
        stdout: [],
        stderr: ["Soundscape provenance contains prohibited secret material"],
      },
    });
  });

  test("accepts every checked-in approved cue and its generated media documentation", async () => {
    const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
    const soundscapeRoot = join(repoRoot, "shared", "edition", "soundscape");
    const outputRoot = join(repoRoot, "shared", "edition", "source-media", "soundscape");
    const stdout: string[] = [];
    const stderr: string[] = [];
    const catalogValidation = await runSoundscapeBuildCli({
      argv: [
        "validate",
        "--catalog",
        join(soundscapeRoot, "catalog.json"),
        "--source-media",
        join(soundscapeRoot, "source-media.json"),
        "--runtime-mappings",
        join(soundscapeRoot, "runtime-mappings.json"),
      ],
      env: {},
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
    });
    const docsValidation = await runSoundscapeBuildCli({
      argv: [
        "media-docs",
        "--output-root",
        outputRoot,
        "--media-doc",
        join(repoRoot, "docs", "media-prompts.md"),
        "--mode",
        "validate",
      ],
      env: {},
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
    });
    const catalog = JSON.parse(
      await readFile(join(soundscapeRoot, "catalog.json"), "utf8"),
    ) as {
      entries: Array<{
        id: string;
        selectionStatus: string;
        sourceMaster: string;
      }>;
    };
    const sourceMedia = JSON.parse(
      await readFile(join(soundscapeRoot, "source-media.json"), "utf8"),
    ) as {
      sourceMasters: Array<{
        id: string;
        provenancePath?: string;
      }>;
    };
    const sourceMasters = new Map(sourceMedia.sourceMasters.map((sourceMaster) => [
      sourceMaster.id,
      sourceMaster,
    ]));
    const productionCues = catalog.entries
      .filter((cue) => cue.selectionStatus === "approved")
      .map((cue) => {
        const sourceMaster = sourceMasters.get(cue.sourceMaster);
        if (!sourceMaster?.provenancePath) {
          throw new Error(`Approved cue ${cue.id} has no generated provenance path`);
        }
        return [basename(sourceMaster.provenancePath, ".json"), cue.id] as const;
      });
    const provenanceEvidence = await Promise.all(productionCues.map(async ([slug, cueId]) => {
      const provenance = JSON.parse(
        await readFile(join(outputRoot, "provenance", `${slug}.json`), "utf8"),
      ) as {
        cueId: string;
        selectedOutputHash: string;
        runtimeDerivativeHash: string;
        adapter: string;
        model: string;
        approvedCandidate: string;
        selectionReason: string;
        commercialPlanStatus: { activePaid: boolean };
        audioQa: { decodable: boolean; nonSilent: boolean; sampleRate: number };
      };
      const master = await readFile(join(outputRoot, "masters", `${slug}.wav`));
      const runtime = await readFile(join(outputRoot, "runtime", `${slug}.wav`));
      return {
        cueId: provenance.cueId,
        expectedCueId: cueId,
        adapter: provenance.adapter,
        model: provenance.model,
        activePaid: provenance.commercialPlanStatus.activePaid,
        approvedCandidate: provenance.approvedCandidate,
        selectionReason: provenance.selectionReason,
        audioQa: provenance.audioQa,
        masterHashMatches: provenance.selectedOutputHash === `sha256:${createHash("sha256").update(master).digest("hex")}`,
        runtimeHashMatches: provenance.runtimeDerivativeHash === `sha256:${createHash("sha256").update(runtime).digest("hex")}`,
      };
    }));

    expect({
      catalogValidation,
      docsValidation,
      stdout,
      stderr,
      provenanceEvidence,
    }).toEqual({
      catalogValidation: { exitCode: 0 },
      docsValidation: { exitCode: 0 },
      stdout: [
        "Validated 29 soundscape catalog cues.",
        "Validated Fairytale Soundscape media documentation.",
      ],
      stderr: [],
      provenanceEvidence: productionCues.map(([, cueId]) => ({
        cueId,
        expectedCueId: cueId,
        adapter: "real",
        model: "eleven_text_to_sound_v2",
        activePaid: true,
        approvedCandidate: expect.stringMatching(/candidate-/),
        selectionReason: expect.stringMatching(/\S/),
        audioQa: expect.objectContaining({
          decodable: true,
          nonSilent: true,
          sampleRate: 48_000,
        }),
        masterHashMatches: true,
        runtimeHashMatches: true,
      })),
    });
  });
});
