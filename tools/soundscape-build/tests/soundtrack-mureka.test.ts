import { describe, expect, test } from "vitest";
import {
  CUE_PROMPTS,
  MurekaClient,
} from "../src/soundtrack/mureka";

describe("Mureka Generation & Polling Seam", () => {
  test("defines approved prompt templates for all 4 production cues", () => {
    expect(CUE_PROMPTS).toHaveProperty("pastoral-lilt");
    expect(CUE_PROMPTS).toHaveProperty("playful-bounce");
    expect(CUE_PROMPTS).toHaveProperty("soaring-flight");
    expect(CUE_PROMPTS).toHaveProperty("celebration-theme");

    for (const [, prompt] of Object.entries(CUE_PROMPTS)) {
      expect(prompt).toContain("fairytale Sicily");
      expect(prompt).toContain("no vocals");
      expect(prompt).toContain("no darkness");
      expect(prompt.length).toBeGreaterThan(50);
    }
  });

  test("MurekaClient generates and polls candidates with blinded labels", async () => {
    // Mock fetch for deterministic testing of Mureka polling loop
    let submitCalled = false;
    let queryCallCount = 0;

    const mockFetch = async (url: string | URL | Request, _init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/v1/instrumental/generate")) {
        submitCalled = true;
        return new Response(
          JSON.stringify({
            id: "mock-task-123",
            status: "preparing",
            model: "mureka-9",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/v1/instrumental/query/mock-task-123")) {
        queryCallCount++;
        if (queryCallCount < 2) {
          return new Response(
            JSON.stringify({
              id: "mock-task-123",
              status: "running",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            id: "mock-task-123",
            status: "succeeded",
            model: "mureka-9",
            choices: [
              {
                id: "choice-1",
                url: "https://cdn.mureka.ai/mock-1.mp3",
                duration: 120000,
              },
              {
                id: "choice-2",
                url: "https://cdn.mureka.ai/mock-2.mp3",
                duration: 130000,
              },
              {
                id: "choice-3",
                url: "https://cdn.mureka.ai/mock-3.mp3",
                duration: 125000,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Unhandled mock fetch URL: ${urlStr}`);
    };

    const client = new MurekaClient({
      apiKey: "test-key",
      fetchFn: mockFetch as any,
      pollIntervalMs: 10,
      timeoutMs: 5000,
    });

    const result = await client.generateCandidates("pastoral-lilt", CUE_PROMPTS["pastoral-lilt"]!, 3);

    expect(submitCalled).toBe(true);
    expect(queryCallCount).toBeGreaterThanOrEqual(2);
    expect(result.cueId).toBe("pastoral-lilt");
    expect(result.model).toBe("mureka-9");
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates[0]?.blindedLabel).toBe("Candidate Alpha");
    expect(result.candidates[1]?.blindedLabel).toBe("Candidate Bravo");
    expect(result.candidates[2]?.blindedLabel).toBe("Candidate Charlie");
  });
});
