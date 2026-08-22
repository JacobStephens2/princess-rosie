import { readFile } from "node:fs/promises";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { GenerateRequest } from "./model";

export type Environment = Record<string, string | undefined>;

export interface GenerationResponse {
  stream: ReadableStream<Uint8Array>;
  requestId?: string;
  traceId?: string;
  usage?: Record<string, string>;
}

export interface Provider {
  subscription(): Promise<{ tier: string; status: string }>;
  generate(request: GenerateRequest): Promise<GenerationResponse>;
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

export function providerStatusCode(error: unknown): number | undefined {
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

export function isDocumentedFormatRejection(error: unknown): boolean {
  if (providerStatusCode(error) !== 422) return false;
  try {
    return JSON.stringify(providerErrorBody(error)).toLowerCase().includes("invalid_output_format");
  } catch {
    return false;
  }
}

export function isExplicitRetryableResponse(error: unknown): boolean {
  const statusCode = providerStatusCode(error);
  if (statusCode === 429 || (statusCode !== undefined && statusCode >= 500)) return true;
  if (statusCode === undefined) return false;
  try {
    return JSON.stringify(providerErrorBody(error)).toLowerCase().includes("system_busy");
  } catch {
    return false;
  }
}

export async function resolveCredential(env: Environment): Promise<string> {
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

export function createFakeProvider(
  _credential: string,
  options: {
    reject48Khz: boolean;
    audio?: "valid" | "silent" | "short" | "bad-loop";
  },
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
      const frameCount = Math.round(
        sampleRate * request.durationSeconds * (options.audio === "short" ? 0.8 : 1),
      );
      const pcm = Buffer.alloc(frameCount * 2 * 2);
      const frequency = 520 + requestNumber * 70;
      for (let frame = 0; frame < frameCount; frame += 1) {
        const envelope = Math.sin((Math.PI * frame) / frameCount) ** 2;
        const sample = options.audio === "silent"
          ? 0
          : Math.round(
            Math.sin((2 * Math.PI * frequency * frame) / sampleRate) * envelope * 7_500,
          );
        pcm.writeInt16LE(sample, frame * 4);
        pcm.writeInt16LE(Math.round(sample * 0.92), frame * 4 + 2);
      }
      if (options.audio === "bad-loop" && frameCount > 1) {
        pcm.writeInt16LE(12_000, 0);
        pcm.writeInt16LE(12_000, 2);
        pcm.writeInt16LE(-12_000, pcm.length - 4);
        pcm.writeInt16LE(-12_000, pcm.length - 2);
      }
      const split = Math.max(2, Math.floor(pcm.length / 3) & ~1);
      const chunks = [
        pcm.subarray(0, split),
        pcm.subarray(split, split * 2),
        pcm.subarray(split * 2),
      ];
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

export function createRealProvider(
  credential: string,
  baseUrl: string | undefined,
): Provider {
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

export async function readStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}
