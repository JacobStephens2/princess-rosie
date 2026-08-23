import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { runSoundscapeBuildCli } from "../src/cli";

const catalogPath = fileURLToPath(
  new URL("../../../shared/edition/soundscape/catalog.json", import.meta.url),
);
const binPath = fileURLToPath(new URL("../src/bin.ts", import.meta.url));
const execFileAsync = promisify(execFile);

function respondWithActiveSubscription(response: ServerResponse): void {
  response.setHeader("content-type", "application/json");
  response.end(
    JSON.stringify({
      tier: "starter",
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
      status: "active",
      open_invoices: [],
      has_open_invoices: false,
    }),
  );
}

describe("Soundscape Build confirmation command", () => {
  test("offers all streamed candidates for approval before retaining only the selection", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const offered: Array<{ id: string; riff: string; sampleRate: number }> = [];

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
      ],
      env: { ELEVENLABS_API_KEY: "approval-fixture-secret" },
      approveCandidates: async (candidates) => {
        offered.push(
          ...candidates.map(({ id, previewWav }) => ({
            id,
            riff: previewWav.subarray(0, 4).toString("ascii"),
            sampleRate: previewWav.readUInt32LE(24),
          })),
        );
        return {
          approvedCandidate: "candidate-3",
          selectionReason: "Candidate three has the softest clean transient in the audition.",
        };
      },
      stdout: () => undefined,
      stderr: () => undefined,
    });
    const provenance = JSON.parse(
      await readFile(join(outputRoot, "provenance", "story-confirmation.json"), "utf8"),
    ) as { approvedCandidate: string; selectionReason: string };

    expect({ result, offered, provenance }).toEqual({
      result: { exitCode: 0 },
      offered: [1, 2, 3].map((candidate) => ({
        id: `candidate-${candidate}`,
        riff: "RIFF",
        sampleRate: 48_000,
      })),
      provenance: expect.objectContaining({
        approvedCandidate: "candidate-3",
        selectionReason: "Candidate three has the softest clean transient in the audition.",
      }),
    });
  });

  test("runs the complete fake authoring flow from one local command", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        binPath,
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "One-command authoring fixture.",
      ],
      {
        env: {
          ...process.env,
          ELEVENLABS_API_KEY: "command-fixture-secret",
          NODE_NO_WARNINGS: "1",
        },
      },
    );

    const master = await readFile(join(outputRoot, "masters", "story-confirmation.wav"));
    expect({ stdout, stderr, riff: master.subarray(0, 4).toString("ascii") }).toEqual({
      stdout: "Approved story confirmation master and provenance.\n",
      stderr: "",
      riff: "RIFF",
    });
  });

  test("builds and approves a confirmation master without exposing its environment credential", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const stdout: string[] = [];
    const stderr: string[] = [];
    const secret = "test-elevenlabs-secret";

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
        "--approve",
        "candidate-2",
        "--selection-reason",
        "Gentle nonverbal response with a soft transient and clean decay.",
      ],
      env: { ELEVENLABS_API_KEY: secret },
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
    });

    const master = await readFile(
      join(outputRoot, "masters", "story-confirmation.wav"),
    );
    const provenance = JSON.parse(
      await readFile(
        join(outputRoot, "provenance", "story-confirmation.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    const report = JSON.parse(
      await readFile(join(outputRoot, "soundscape-build-report.json"), "utf8"),
    ) as { requests: Array<{ format: string }> };
    const observableText = JSON.stringify({ stdout, stderr, provenance, report });

    expect({
      exitCode: result.exitCode,
      riff: master.subarray(0, 4).toString("ascii"),
      wave: master.subarray(8, 12).toString("ascii"),
      channels: master.readUInt16LE(22),
      requests: report.requests.map(({ format }) => format),
      provenance,
      leakedCredential: observableText.includes(secret),
    }).toEqual({
      exitCode: 0,
      riff: "RIFF",
      wave: "WAVE",
      channels: 1,
      requests: ["pcm_48000", "pcm_48000", "pcm_48000"],
      provenance: {
        schemaVersion: 3,
        cueId: "cue.story.confirmation",
        sourceMasterId: "source-master.story.confirmation",
        provider: "ElevenLabs",
        adapter: "fake",
        sdkVersion: "2.64.0",
        model: "eleven_text_to_sound_v2",
        parameters: {
          prompt: expect.stringContaining("gentle nonverbal storybook confirmation"),
          durationSeconds: 0.6,
          promptInfluence: 0.3,
          loop: false,
          sourceFormat: "pcm_48000",
        },
        generationTimestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        requestId: "fake-request-2",
        traceId: "fake-trace-2",
        providerReportedUsage: { characterCost: expect.any(String) },
        sourceHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        selectedOutputHash: `sha256:${createHash("sha256").update(master).digest("hex")}`,
        channelLayout: {
          sourceChannels: 2,
          masterChannels: 1,
          sampleRate: 48_000,
          sampleFormat: "signed-16-bit-little-endian",
        },
        processing: [
          "inspect-pcm-s16le",
          "downmix-stereo-to-mono",
          "fade-in-10ms",
          "fade-out-20ms",
          "peak-ceiling--6dbfs",
          "wav-wrap-pcm16le",
        ],
        formatProbe: {
          requestedFormat: "pcm_48000",
          outcome: "accepted",
          establishedChannelLayout: {
            candidate: "candidate-1",
            sourceChannels: 2,
            sampleRate: 48_000,
            sampleFormat: "signed-16-bit-little-endian",
          },
        },
        commercialPlanStatus: { tier: "fixture", status: "active", activePaid: false },
        approvedCandidate: "candidate-2",
        selectionReason: "Gentle nonverbal response with a soft transient and clean decay.",
      },
      leakedCredential: false,
    });
  });

  test.each([
    ["bare key", "file-elevenlabs-secret\n"],
    ["assignment", "ELEVENLABS_API_KEY=file-elevenlabs-secret\n"],
  ])("loads a credential from a %s file", async (_label, keyFileContents) => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const keyFile = join(outputRoot, "elevenlabs.key");
    await writeFile(keyFile, keyFileContents, { mode: 0o600 });
    const stderr: string[] = [];

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        join(outputRoot, "artifacts"),
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "Synthetic credential parsing fixture.",
      ],
      env: { ELEVENLABS_API_KEY_FILE: keyFile },
      stdout: () => undefined,
      stderr: (message) => stderr.push(message),
    });

    expect({ exitCode: result.exitCode, stderr }).toEqual({ exitCode: 0, stderr: [] });
  });

  test("prefers the direct environment credential without reading the configured key file", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "Direct environment credential precedence fixture.",
      ],
      env: {
        ELEVENLABS_API_KEY: "direct-elevenlabs-secret",
        ELEVENLABS_API_KEY_FILE: join(outputRoot, "does-not-exist"),
      },
      stdout: () => undefined,
      stderr: () => undefined,
    });

    expect(result.exitCode).toBe(0);
  });

  test("rejects command-line credential values without repeating them", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const stderr: string[] = [];
    const forbiddenSecret = "forbidden-command-line-secret";

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "Command-line credential rejection fixture.",
        "--api-key",
        forbiddenSecret,
      ],
      env: {},
      stdout: () => undefined,
      stderr: (message) => stderr.push(message),
    });

    expect({
      exitCode: result.exitCode,
      diagnostic: stderr.join("\n"),
      leakedCredential: stderr.join("\n").includes(forbiddenSecret),
    }).toEqual({
      exitCode: 1,
      diagnostic: "ElevenLabs credentials must not be supplied as command arguments",
      leakedCredential: false,
    });
  });

  test("keeps an approved master immutable unless its exact cue is forced", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const baseArgs = [
      "confirmation",
      "--catalog",
      catalogPath,
      "--output-root",
      outputRoot,
      "--provider",
      "fake",
      "--selection-reason",
      "Approval immutability fixture.",
    ];
    const run = (extraArgs: string[], stderr: string[]) =>
      runSoundscapeBuildCli({
        argv: [...baseArgs, ...extraArgs],
        env: { ELEVENLABS_API_KEY: "immutability-fixture-secret" },
        stdout: () => undefined,
        stderr: (message) => stderr.push(message),
      });

    const initialErrors: string[] = [];
    const initial = await run(["--approve", "candidate-1"], initialErrors);
    const refusedErrors: string[] = [];
    const refused = await run(["--approve", "candidate-2"], refusedErrors);
    const afterRefusal = JSON.parse(
      await readFile(join(outputRoot, "provenance", "story-confirmation.json"), "utf8"),
    ) as { approvedCandidate: string };
    const forcedErrors: string[] = [];
    const forced = await run(
      ["--approve", "candidate-2", "--force", "cue.story.confirmation"],
      forcedErrors,
    );
    const afterForce = JSON.parse(
      await readFile(join(outputRoot, "provenance", "story-confirmation.json"), "utf8"),
    ) as { approvedCandidate: string };

    expect({
      initial: { exitCode: initial.exitCode, errors: initialErrors },
      refused: { exitCode: refused.exitCode, errors: refusedErrors },
      afterRefusal: afterRefusal.approvedCandidate,
      forced: { exitCode: forced.exitCode, errors: forcedErrors },
      afterForce: afterForce.approvedCandidate,
    }).toEqual({
      initial: { exitCode: 0, errors: [] },
      refused: {
        exitCode: 1,
        errors: [
          "Approved cue.story.confirmation is immutable; use --force cue.story.confirmation to replace it",
        ],
      },
      afterRefusal: "candidate-1",
      forced: { exitCode: 0, errors: [] },
      afterForce: "candidate-2",
    });
  });

  test("refuses to publish fake media into the protected production output root", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const stderr: string[] = [];

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "Fake production-output guard fixture.",
      ],
      env: { ELEVENLABS_API_KEY: "fake-production-guard-secret" },
      protectedProductionOutputRoot: outputRoot,
      stdout: () => undefined,
      stderr: (message) => stderr.push(message),
    });

    expect({ result, stderr }).toEqual({
      result: { exitCode: 1 },
      stderr: ["Fake Soundscape Build media cannot be written to the production output root"],
    });
  });

  test("refuses a fake output-root symlink targeting the protected production root", async () => {
    const testRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const productionOutputRoot = join(testRoot, "production");
    const linkedOutputRoot = join(testRoot, "linked-production");
    await mkdir(productionOutputRoot);
    await symlink(productionOutputRoot, linkedOutputRoot);
    const stderr: string[] = [];

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        linkedOutputRoot,
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "Fake symlink guard fixture.",
      ],
      env: { ELEVENLABS_API_KEY: "fake-symlink-guard-secret" },
      protectedProductionOutputRoot: productionOutputRoot,
      stdout: () => undefined,
      stderr: (message) => stderr.push(message),
    });

    expect({ result, stderr }).toEqual({
      result: { exitCode: 1 },
      stderr: ["Fake Soundscape Build media cannot be written to the production output root"],
    });
  });

  test("does not leave a partial approval when durable publication fails", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const stderr: string[] = [];

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
      ],
      env: { ELEVENLABS_API_KEY: "transaction-fixture-secret" },
      approveCandidates: async () => {
        await mkdir(join(outputRoot, "soundscape-build-report.json"));
        return {
          approvedCandidate: "candidate-1",
          selectionReason: "Transactional publication fixture.",
        };
      },
      stdout: () => undefined,
      stderr: (message) => stderr.push(message),
    });

    await expect(
      readFile(join(outputRoot, "masters", "story-confirmation.wav")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      readFile(join(outputRoot, "provenance", "story-confirmation.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect({ result, diagnosticCount: stderr.length }).toEqual({
      result: { exitCode: 1 },
      diagnosticCount: 1,
    });
  });

  test("rejects an unsafe confirmation candidate count before generation", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const unsafeCatalogPath = join(outputRoot, "catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as {
      entries: Array<{ id: string; authoring?: { candidateCount: number } }>;
    };
    const confirmation = catalog.entries.find(({ id }) => id === "cue.story.confirmation");
    if (!confirmation?.authoring) throw new Error("Fixture confirmation cue is missing authoring");
    confirmation.authoring.candidateCount = 31;
    await writeFile(unsafeCatalogPath, JSON.stringify(catalog));
    const stderr: string[] = [];

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        unsafeCatalogPath,
        "--output-root",
        join(outputRoot, "artifacts"),
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "Unsafe catalog fixture.",
      ],
      env: { ELEVENLABS_API_KEY: "unsafe-catalog-fixture-secret" },
      stdout: () => undefined,
      stderr: (message) => stderr.push(message),
    });

    expect({ result, stderr }).toEqual({
      result: { exitCode: 1 },
      stderr: ["The confirmation tracer requires exactly three candidates"],
    });
  });

  test.each([
    ["missing", {}, ""],
    [
      "malformed",
      { ELEVENLABS_API_KEY_FILE: "KEY_FILE" },
      "ELEVENLABS_API_KEY=malformed-secret\nunexpected=value\n",
    ],
  ])("fails safely when credentials are %s", async (_label, envTemplate, keyFileContents) => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const keyFile = join(outputRoot, "elevenlabs.key");
    if (keyFileContents) await writeFile(keyFile, keyFileContents, { mode: 0o600 });
    const env = Object.fromEntries(
      Object.entries(envTemplate).map(([name, value]) => [name, value === "KEY_FILE" ? keyFile : value]),
    );
    const stderr: string[] = [];

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        join(outputRoot, "artifacts"),
        "--provider",
        "fake",
        "--approve",
        "candidate-1",
        "--selection-reason",
        "Failure fixture.",
      ],
      env,
      stdout: () => undefined,
      stderr: (message) => stderr.push(message),
    });

    expect({
      exitCode: result.exitCode,
      diagnostic: stderr.join("\n"),
      leakedCredential: stderr.join("\n").includes("malformed-secret"),
    }).toEqual({
      exitCode: 1,
      diagnostic: "ElevenLabs credentials are not configured",
      leakedCredential: false,
    });
  });

  test("documents a rejected 48 kHz probe and intentionally falls back to three serial 24 kHz candidates", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));

    const result = await runSoundscapeBuildCli({
      argv: [
        "confirmation",
        "--catalog",
        catalogPath,
        "--output-root",
        outputRoot,
        "--provider",
        "fake",
        "--fake-48khz",
        "reject",
        "--approve",
        "candidate-3",
        "--selection-reason",
        "The third fixture has the gentlest clean decay.",
      ],
      env: { ELEVENLABS_API_KEY: "fallback-fixture-secret" },
      stdout: () => undefined,
      stderr: () => undefined,
    });

    const report = JSON.parse(
      await readFile(join(outputRoot, "soundscape-build-report.json"), "utf8"),
    ) as {
      requests: Array<{
        candidate: string;
        format: string;
        outcome: string;
        text: string;
        model: string;
        durationSeconds: number;
        promptInfluence: number;
        loop: boolean;
      }>;
    };
    const provenance = JSON.parse(
      await readFile(join(outputRoot, "provenance", "story-confirmation.json"), "utf8"),
    ) as {
      parameters: { sourceFormat: string };
      formatProbe: unknown;
      channelLayout: unknown;
    };
    const master = await readFile(join(outputRoot, "masters", "story-confirmation.wav"));

    expect({
      exitCode: result.exitCode,
      requests: report.requests,
      sourceFormat: provenance.parameters.sourceFormat,
      formatProbe: provenance.formatProbe,
      channelLayout: provenance.channelLayout,
      wavSampleRate: master.readUInt32LE(24),
    }).toEqual({
      exitCode: 0,
      requests: [
        {
          candidate: "format-probe",
          format: "pcm_48000",
          outcome: "rejected",
          text: expect.stringContaining("gentle nonverbal storybook confirmation"),
          model: "eleven_text_to_sound_v2",
          durationSeconds: 0.6,
          promptInfluence: 0.3,
          loop: false,
        },
        ...[1, 2, 3].map((candidate) => ({
          candidate: `candidate-${candidate}`,
          format: "pcm_24000",
          outcome: "succeeded",
          text: expect.stringContaining("gentle nonverbal storybook confirmation"),
          model: "eleven_text_to_sound_v2",
          durationSeconds: 0.6,
          promptInfluence: 0.3,
          loop: false,
        })),
      ],
      sourceFormat: "pcm_24000",
      formatProbe: {
        requestedFormat: "pcm_48000",
        outcome: "rejected",
        statusCode: 422,
        fallbackFormat: "pcm_24000",
        establishedChannelLayout: {
          candidate: "candidate-1",
          sourceChannels: 2,
          sampleRate: 24_000,
          sampleFormat: "signed-16-bit-little-endian",
        },
      },
      channelLayout: {
        sourceChannels: 2,
        masterChannels: 1,
        sampleRate: 24_000,
        sampleFormat: "signed-16-bit-little-endian",
      },
      wavSampleRate: 24_000,
    });
  });

  test("constructs the official SDK request with generation retries disabled", async () => {
    let generationRequests = 0;
    let observedRequest: {
      apiKey?: string;
      outputFormat?: string;
      body?: unknown;
    } = {};
    const server = createServer((request, response) => {
      if (request.url === "/v1/user/subscription") {
        respondWithActiveSubscription(response);
        return;
      }

      generationRequests += 1;
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        const url = new URL(request.url ?? "/", "http://localhost");
        observedRequest = {
          apiKey: request.headers["xi-api-key"] as string | undefined,
          outputFormat: url.searchParams.get("output_format") ?? undefined,
          body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
        };
        response.statusCode = 500;
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            detail: { status: "server_error", message: "sdk-fixture-secret must be redacted" },
          }),
        );
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind");
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const stderr: string[] = [];

    try {
      const result = await runSoundscapeBuildCli({
        argv: [
          "confirmation",
          "--catalog",
          catalogPath,
          "--output-root",
          outputRoot,
          "--provider",
          "real",
          "--approve",
          "candidate-1",
          "--selection-reason",
          "SDK request fixture.",
        ],
        env: {
          ELEVENLABS_API_KEY: "sdk-fixture-secret",
        },
        realProviderBaseUrl: `http://127.0.0.1:${address.port}`,
        stdout: () => undefined,
        stderr: (message) => stderr.push(message),
      });

      expect({
        exitCode: result.exitCode,
        generationRequests,
        observedRequest,
        leakedCredential: stderr.join("\n").includes("sdk-fixture-secret"),
      }).toEqual({
        exitCode: 1,
        generationRequests: 1,
        observedRequest: {
          apiKey: "sdk-fixture-secret",
          outputFormat: "pcm_48000",
          body: {
            text: expect.stringContaining("gentle nonverbal storybook confirmation"),
            model_id: "eleven_text_to_sound_v2",
            duration_seconds: 0.6,
            prompt_influence: 0.3,
            loop: false,
          },
        },
        leakedCredential: false,
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  test("recognizes the SDK format rejection and completes the real-adapter fallback batch", async () => {
    const formats: string[] = [];
    const server = createServer((request, response) => {
      if (request.url === "/v1/user/subscription") {
        respondWithActiveSubscription(response);
        return;
      }

      const url = new URL(request.url ?? "/", "http://localhost");
      const format = url.searchParams.get("output_format") ?? "";
      formats.push(format);
      if (format === "pcm_48000") {
        response.statusCode = 422;
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            detail: {
              status: "invalid_output_format",
              message: "48 kHz PCM is unavailable for this fixture plan",
            },
          }),
        );
        return;
      }

      const sampleRate = 24_000;
      const frameCount = Math.round(sampleRate * 0.6);
      const pcm = Buffer.alloc(frameCount * 4);
      for (let frame = 0; frame < frameCount; frame += 1) {
        const sample = Math.round(
          Math.sin((2 * Math.PI * 660 * frame) / sampleRate) * 6_000,
        );
        pcm.writeInt16LE(sample, frame * 4);
        pcm.writeInt16LE(sample, frame * 4 + 2);
      }
      response.setHeader("content-type", "application/octet-stream");
      response.setHeader("request-id", `sdk-fallback-${formats.length}`);
      response.setHeader("x-trace-id", `sdk-trace-${formats.length}`);
      response.setHeader("character-cost", "17");
      response.end(pcm);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind");
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));
    const stderr: string[] = [];

    try {
      const result = await runSoundscapeBuildCli({
        argv: [
          "confirmation",
          "--catalog",
          catalogPath,
          "--output-root",
          outputRoot,
          "--provider",
          "real",
          "--approve",
          "candidate-2",
          "--selection-reason",
          "Official SDK fallback fixture.",
        ],
        env: {
          ELEVENLABS_API_KEY: "sdk-fallback-secret",
        },
        realProviderBaseUrl: `http://127.0.0.1:${address.port}`,
        stdout: () => undefined,
        stderr: (message) => stderr.push(message),
      });
      const provenance = JSON.parse(
        await readFile(join(outputRoot, "provenance", "story-confirmation.json"), "utf8"),
      ) as { requestId: string; traceId: string; providerReportedUsage: unknown };

      expect({ result, stderr, formats, provenance }).toEqual({
        result: { exitCode: 0 },
        stderr: [],
        formats: ["pcm_48000", "pcm_24000", "pcm_24000", "pcm_24000"],
        provenance: expect.objectContaining({
          requestId: "sdk-fallback-3",
          traceId: "sdk-trace-3",
          providerReportedUsage: { characterCost: "17" },
        }),
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  test("does not treat an unrelated SDK 422 as a format rejection", async () => {
    const formats: string[] = [];
    const server = createServer((request, response) => {
      if (request.url === "/v1/user/subscription") {
        respondWithActiveSubscription(response);
        return;
      }

      const url = new URL(request.url ?? "/", "http://localhost");
      formats.push(url.searchParams.get("output_format") ?? "");
      response.statusCode = 422;
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          detail: {
            status: "invalid_prompt",
            message: "The prompt does not meet this fixture's validation rules",
          },
        }),
      );
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind");
    const outputRoot = await mkdtemp(join(tmpdir(), "rosi-soundscape-build-"));

    try {
      const result = await runSoundscapeBuildCli({
        argv: [
          "confirmation",
          "--catalog",
          catalogPath,
          "--output-root",
          outputRoot,
          "--provider",
          "real",
          "--approve",
          "candidate-1",
          "--selection-reason",
          "Unrelated 422 fixture.",
        ],
        env: { ELEVENLABS_API_KEY: "unrelated-422-secret" },
        realProviderBaseUrl: `http://127.0.0.1:${address.port}`,
        stdout: () => undefined,
        stderr: () => undefined,
      });

      expect({ result, formats }).toEqual({
        result: { exitCode: 1 },
        formats: ["pcm_48000"],
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
