export const CUE_PROMPTS: Record<string, string> = {
  "pastoral-lilt":
    "Joyful whimsical instrumental soundtrack for a gentle childrens picture-book flying game, about two minutes, bright fairytale Sicily, acoustic woodwinds, soft flute, gentle nylon-string guitar, warm cello and violin, lyrical swaying 6/8 pastoral lilt, peaceful, safe and comforting for a four-year-old, no vocals, no darkness, seamless-feeling loop",
  "playful-bounce":
    "Playful lighthearted instrumental soundtrack for a gentle childrens picture-book flying game, about two minutes, bright fairytale Sicily, wooden marimba, celesta, glockenspiel, pizzicato strings, soft bassoon, buoyant bouncy rhythm, curious and friendly, gentle on small speakers, calm enough for a four-year-old, no vocals, no darkness, seamless-feeling loop",
  "soaring-flight":
    "Epic soaring instrumental soundtrack for a gentle childrens picture-book flying game, about two minutes, bright fairytale Sicily, sweeping acoustic strings, warm French horn accents, shimmering harp glissandos, airy woodwinds, expansive uplifting melody that feels vast over sparkling sea and mountains yet completely gentle and safe for a four-year-old, no harsh brass crashes, no heavy percussion, no vocals, no darkness, seamless-feeling loop",
  "celebration-theme":
    "Festive joyful celebration theme soundtrack for arriving at Princess Zelies first-birthday party at the Birthday Castle, about two minutes, bright fairytale Sicily, celebratory bells, celesta, bright gentle brass in picture-book register, joyful dancing strings, acoustic percussion, happy birthday party atmosphere, welcoming and triumphant for a four-year-old, no vocals, no darkness",
};

export interface MurekaCandidate {
  id: string;
  blindedLabel: string;
  url: string;
  durationMs: number;
}

export interface MurekaGenerationResult {
  cueId: string;
  prompt: string;
  model: string;
  candidates: MurekaCandidate[];
}

export interface MurekaClientOptions {
  apiKey?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

const BLINDED_LABELS = [
  "Candidate Alpha",
  "Candidate Bravo",
  "Candidate Charlie",
  "Candidate Delta",
  "Candidate Echo",
];

export class MurekaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(options: MurekaClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.MUREKA_API_KEY || "";
    this.baseUrl = options.baseUrl || "https://api.mureka.ai";
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.pollIntervalMs = options.pollIntervalMs ?? 5000;
    this.timeoutMs = options.timeoutMs ?? 180000;
  }

  async generateCandidates(
    cueId: string,
    prompt: string,
    targetCount: number = 3,
  ): Promise<MurekaGenerationResult> {
    if (!this.apiKey) {
      throw new Error("MUREKA_API_KEY is required for soundtrack generation");
    }

    const collectedChoices: Array<{ id: string; url: string; duration: number }> = [];
    const model = "mureka-9";

    while (collectedChoices.length < targetCount) {
      const submitRes = await this.fetchFn(`${this.baseUrl}/v1/instrumental/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
        }),
      });

      if (!submitRes.ok) {
        const errorText = await submitRes.text();
        throw new Error(`Mureka submission failed (${submitRes.status}): ${errorText}`);
      }

      const submitData: any = await submitRes.json();
      const taskId = submitData.id;
      if (!taskId) {
        throw new Error(`Mureka returned no task ID: ${JSON.stringify(submitData)}`);
      }

      // Poll until task completes
      const startTime = Date.now();
      let succeeded = false;

      while (Date.now() - startTime < this.timeoutMs) {
        const queryRes = await this.fetchFn(`${this.baseUrl}/v1/instrumental/query/${taskId}`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        });

        if (!queryRes.ok) {
          const queryErr = await queryRes.text();
          throw new Error(`Mureka query failed (${queryRes.status}): ${queryErr}`);
        }

        const queryData: any = await queryRes.json();
        const status = queryData.status;

        if (status === "succeeded") {
          const choices = queryData.choices || [];
          for (const choice of choices) {
            collectedChoices.push({
              id: choice.id || `choice-${collectedChoices.length + 1}`,
              url: choice.url || choice.wav_url || choice.flac_url,
              duration: choice.duration || 120000,
            });
          }
          succeeded = true;
          break;
        } else if (status === "failed" || status === "cancelled" || status === "timeout") {
          throw new Error(`Mureka generation task failed with status "${status}"`);
        }

        await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
      }

      if (!succeeded) {
        throw new Error(`Mureka generation task ${taskId} timed out after ${this.timeoutMs}ms`);
      }
    }

    const selectedChoices = collectedChoices.slice(0, targetCount);
    const candidates: MurekaCandidate[] = selectedChoices.map((choice, index) => ({
      id: choice.id,
      blindedLabel: BLINDED_LABELS[index] || `Candidate ${index + 1}`,
      url: choice.url,
      durationMs: choice.duration,
    }));

    return {
      cueId,
      prompt,
      model,
      candidates,
    };
  }
}
