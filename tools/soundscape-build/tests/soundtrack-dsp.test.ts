import { describe, expect, test } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyAudioDsp, FLIGHT_MASTER_TARGET_LUFS, PEAK_CEILING_DBFS } from "../src/soundtrack/dsp";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const birthdayFlightPath = join(repoRoot, "apps/web/public/assets/audio/birthday-flight.mp3");

describe("Soundtrack DSP Verification Seam", () => {
  test("verifies existing flight master passes all DSP criteria", async () => {
    const result = await verifyAudioDsp(birthdayFlightPath, {
      targetLufs: FLIGHT_MASTER_TARGET_LUFS,
      lufsTolerance: 1.5,
      peakCeilingDb: PEAK_CEILING_DBFS,
      requireStereo: true,
      requireSampleRate: 44100,
    });

    expect(result.decoding).toBe(true);
    expect(result.channels).toBe(2);
    expect(result.sampleRate).toBe(44100);
    expect(result.peakDb).toBeLessThanOrEqual(PEAK_CEILING_DBFS);
    expect(Math.abs(result.integratedLoudness - FLIGHT_MASTER_TARGET_LUFS)).toBeLessThanOrEqual(1.5);
    expect(result.loudnessMatched).toBe(true);
    expect(result.passed).toBe(true);
  });

  test("rejects invalid or placeholder files", async () => {
    const { tmpdir } = await import("node:os");
    const { mkdtemp, symlink, rm } = await import("node:fs/promises");
    const tmp = await mkdtemp(join(tmpdir(), "symlink-test-"));
    const tmpSymlink = join(tmp, "test-symlink.mp3");

    try {
      await symlink(birthdayFlightPath, tmpSymlink);
      const symlinkResult = await verifyAudioDsp(tmpSymlink, { rejectSymlinks: true });
      expect(symlinkResult.passed).toBe(false);
      expect(symlinkResult.failureReasons[0]).toContain("symbolic link placeholder");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }

    const nonExistentResult = await verifyAudioDsp("/non/existent/path.mp3");
    expect(nonExistentResult.passed).toBe(false);
  });

  test("masterAudioTrack normalizes loudness and enforces peak ceiling", async () => {
    const { masterAudioTrack } = await import("../src/soundtrack/dsp");
    const { tmpdir } = await import("node:os");
    const { mkdtemp, rm } = await import("node:fs/promises");
    const tmp = await mkdtemp(join(tmpdir(), "soundtrack-dsp-test-"));
    const outputPath = join(tmp, "mastered-test.mp3");

    try {
      await masterAudioTrack(birthdayFlightPath, outputPath, {
        targetLufs: -21.9,
        peakCeilingDb: -6.0,
      });

      const result = await verifyAudioDsp(outputPath, {
        targetLufs: -21.9,
        lufsTolerance: 1.5,
        peakCeilingDb: -6.0,
        requireStereo: true,
        requireSampleRate: 44100,
      });

      expect(result.passed).toBe(true);
      expect(result.channels).toBe(2);
      expect(result.sampleRate).toBe(44100);
      expect(result.peakDb).toBeLessThanOrEqual(-6.0);
      expect(Math.abs(result.integratedLoudness - (-21.9))).toBeLessThanOrEqual(1.5);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }, 20000);
});
