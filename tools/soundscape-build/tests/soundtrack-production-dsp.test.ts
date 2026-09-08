import { describe, expect, test } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyAudioDsp, FLIGHT_MASTER_TARGET_LUFS, PEAK_CEILING_DBFS } from "../src/soundtrack/dsp";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const audioDir = join(repoRoot, "apps/web/public/assets/audio");

const PRODUCTION_TRACKS = [
  "birthday-flight.mp3",
  "pastoral-lilt.mp3",
  "playful-bounce.mp3",
  "soaring-flight.mp3",
  "celebration-theme.mp3",
];

describe("Production Soundtrack DSP Automated Verification", () => {
  test.each(PRODUCTION_TRACKS)(
    "verifies %s meets all DSP criteria (stereo, 44.1kHz, peak <= -6 dBFS, loudness matched, clean loop seam)",
    async (filename) => {
      const fullPath = join(audioDir, filename);

      const dspResult = await verifyAudioDsp(fullPath, {
        targetLufs: FLIGHT_MASTER_TARGET_LUFS,
        lufsTolerance: 1.5,
        peakCeilingDb: PEAK_CEILING_DBFS,
        requireStereo: true,
        requireSampleRate: 44100,
        rejectSymlinks: true,
        checkLoopSeam: true,
      });

      expect(dspResult.passed, `DSP verification failed for ${filename}: ${dspResult.failureReasons.join("; ")}`).toBe(true);
      expect(dspResult.decoding).toBe(true);
      expect(dspResult.channels).toBe(2);
      expect(dspResult.sampleRate).toBe(44100);
      expect(dspResult.peakDb).toBeLessThanOrEqual(PEAK_CEILING_DBFS);
      expect(dspResult.loudnessMatched).toBe(true);
      expect(dspResult.clippingFree).toBe(true);
    },
    30000,
  );
});
