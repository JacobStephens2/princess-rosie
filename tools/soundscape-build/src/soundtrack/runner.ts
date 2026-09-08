import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CUE_PROMPTS, MurekaClient, MurekaCandidate } from "./mureka";
import { evaluateCandidatesWithGemini, CandidateEvaluationReport } from "./evaluate";
import {
  masterAudioTrack,
  verifyAudioDsp,
  FLIGHT_MASTER_TARGET_LUFS,
  PEAK_CEILING_DBFS,
  DspVerificationResult,
} from "./dsp";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const outputAudioDir = join(repoRoot, "apps/web/public/assets/audio");
const cacheDir = join(repoRoot, ".soundtrack-cache");

export interface CueRunResult {
  cueId: string;
  title: string;
  prompt: string;
  candidates: Array<{
    id: string;
    blindedLabel: string;
    url: string;
    localCandidatePath: string;
    dsp: DspVerificationResult;
  }>;
  evaluation: CandidateEvaluationReport;
  selectedCandidate: string;
  selectionReason: string;
  productionMasterPath: string;
  productionDsp: DspVerificationResult;
}

export const CUE_METADATA: Record<string, { title: string; filename: string; style: string; description: string }> = {
  "pastoral-lilt": {
    title: "Pastoral Lilt",
    filename: "pastoral-lilt.mp3",
    style: "pastoral",
    description:
      "Gentle pastoral 6/8 lilt across Fairytale Sicily with soft acoustic woodwinds, flute, nylon-string guitar, warm cello/violin, safe and comforting for a 4-year-old, no vocals, no darkness, seamless loop.",
  },
  "playful-bounce": {
    title: "Playful Marimba and Celesta",
    filename: "playful-bounce.mp3",
    style: "playful",
    description:
      "Playful lighthearted flight music with wooden marimba, celesta, glockenspiel, pizzicato strings, soft bassoon, buoyant bouncy rhythm, curious and friendly on small speakers, calm enough for a 4-year-old, no vocals, no darkness, seamless loop.",
  },
  "soaring-flight": {
    title: "Epic Soaring Flight",
    filename: "soaring-flight.mp3",
    style: "soaring",
    description:
      "Epic soaring flight music with sweeping acoustic strings, warm French horn accents, shimmering harp glissandos, airy woodwinds, expansive uplifting melody over sea and mountains, safe and gentle for a 4-year-old, no harsh brass crashes, no heavy percussion, no vocals, no darkness, seamless loop.",
  },
  "celebration-theme": {
    title: "Birthday Castle Celebration Theme",
    filename: "celebration-theme.mp3",
    style: "celebration",
    description:
      "Festive joyful celebration theme for arriving at Princess Zélie's first-birthday party at the Birthday Castle, celebratory bells, celesta, bright gentle brass in picture-book register, joyful dancing strings, acoustic percussion, happy birthday party atmosphere, welcoming and triumphant for a 4-year-old, no vocals, no darkness.",
  },
};

export async function runSoundtrackGenerationAndEvaluation(options: {
  cueIds?: string[];
  murekaClient?: MurekaClient;
  skipGenerationIfCached?: boolean;
}): Promise<Record<string, CueRunResult>> {
  const cueIds = options.cueIds || Object.keys(CUE_METADATA);
  const mureka = options.murekaClient || new MurekaClient();
  const results: Record<string, CueRunResult> = {};

  await mkdir(cacheDir, { recursive: true });
  await mkdir(outputAudioDir, { recursive: true });

  for (const cueId of cueIds) {
    const meta = CUE_METADATA[cueId];
    if (!meta) throw new Error(`Unknown cueId: ${cueId}`);

    const prompt = CUE_PROMPTS[cueId] || "";
    const cueCacheDir = join(cacheDir, cueId);
    await mkdir(cueCacheDir, { recursive: true });

    console.log(`\n========================================`);
    console.log(`Processing Cue: ${meta.title} (${cueId})`);
    console.log(`========================================`);

    // 1. Generate or load candidates
    let candidatesData: MurekaCandidate[] = [];
    const candidatesMetaFile = join(cueCacheDir, "candidates.json");

    if (options.skipGenerationIfCached && existsSync(candidatesMetaFile)) {
      console.log(`Loading cached candidates from ${candidatesMetaFile}`);
      candidatesData = JSON.parse(await readFile(candidatesMetaFile, "utf-8"));
    } else {
      console.log(`Generating 3 candidates via Mureka API (mureka-9)...`);
      const genResult = await mureka.generateCandidates(cueId, prompt, 3);
      candidatesData = genResult.candidates;
      await writeFile(candidatesMetaFile, JSON.stringify(candidatesData, null, 2));
    }

    // 2. Download candidates and run candidate DSP checks
    const candidateBuffers: Array<{ label: string; audioBuffer: Buffer; mimeType: string }> = [];
    const candidateInfos: CueRunResult["candidates"] = [];

    for (const candidate of candidatesData) {
      const localAudioPath = join(cueCacheDir, `${candidate.blindedLabel.replace(/\s+/g, "_")}.mp3`);
      let audioBuf: Buffer;

      if (existsSync(localAudioPath)) {
        audioBuf = await readFile(localAudioPath);
      } else {
        console.log(`Downloading ${candidate.blindedLabel} from ${candidate.url}...`);
        const res = await fetch(candidate.url);
        if (!res.ok) throw new Error(`Failed to download audio from ${candidate.url}: ${res.status}`);
        audioBuf = Buffer.from(await res.arrayBuffer());
        await writeFile(localAudioPath, audioBuf);
      }

      candidateBuffers.push({
        label: candidate.blindedLabel,
        audioBuffer: audioBuf,
        mimeType: "audio/mp3",
      });

      console.log(`Screening ${candidate.blindedLabel} against waveform checks...`);
      const dsp = await verifyAudioDsp(localAudioPath, {
        targetLufs: FLIGHT_MASTER_TARGET_LUFS,
        lufsTolerance: 8.0, // Initial candidate check allows raw generation tolerance prior to mastering
        peakCeilingDb: 0.0,
        requireStereo: true,
      });

      candidateInfos.push({
        id: candidate.id,
        blindedLabel: candidate.blindedLabel,
        url: candidate.url,
        localCandidatePath: localAudioPath,
        dsp,
      });
    }

    // 3. Blinded perceptual evaluation with Gemini 3.8 Flash
    console.log(`Evaluating candidate set blindly via native audio with Gemini 3.8 Flash...`);
    const evalReportFile = join(cueCacheDir, "evaluation.json");
    let evaluation: CandidateEvaluationReport;

    if (options.skipGenerationIfCached && existsSync(evalReportFile)) {
      console.log(`Loading cached evaluation from ${evalReportFile}`);
      evaluation = JSON.parse(await readFile(evalReportFile, "utf-8"));
    } else {
      evaluation = await evaluateCandidatesWithGemini(
        candidateBuffers,
        meta.title,
        meta.description,
      );
      await writeFile(evalReportFile, JSON.stringify(evaluation, null, 2));
    }

    console.log(`Gemini Rankings: ${evaluation.rankings.join(" > ")}`);
    console.log(`Selected Candidate: ${evaluation.selectedCandidate}`);
    console.log(`Reason: ${evaluation.selectionReason}`);

    // 4. Select winner and master to production MP3
    const winnerCandidate = candidateInfos.find(
      (c) => c.blindedLabel.toLowerCase() === evaluation.selectedCandidate.toLowerCase(),
    ) || candidateInfos[0];

    if (!winnerCandidate) {
      throw new Error(`No winner candidate found for ${cueId}`);
    }

    const productionMasterPath = join(outputAudioDir, meta.filename);
    console.log(`Mastering winning candidate (${winnerCandidate.blindedLabel}) to ${productionMasterPath}...`);

    await masterAudioTrack(winnerCandidate.localCandidatePath, productionMasterPath, {
      targetLufs: FLIGHT_MASTER_TARGET_LUFS,
      peakCeilingDb: PEAK_CEILING_DBFS,
      sampleRate: 44100,
      bitrate: "128k",
    });

    // 5. Verify production master against strict DSP criteria
    console.log(`Verifying production master with deterministic DSP checks...`);
    const productionDsp = await verifyAudioDsp(productionMasterPath, {
      targetLufs: FLIGHT_MASTER_TARGET_LUFS,
      lufsTolerance: 1.5,
      peakCeilingDb: PEAK_CEILING_DBFS,
      requireStereo: true,
      requireSampleRate: 44100,
      rejectSymlinks: true,
    });

    if (!productionDsp.passed) {
      throw new Error(
        `Production master for ${cueId} failed DSP verification: ${productionDsp.failureReasons.join("; ")}`,
      );
    }
    console.log(`✓ ${meta.title} DSP verification passed! (LUFS: ${productionDsp.integratedLoudness} dB, Peak: ${productionDsp.peakDb} dBFS)`);

    results[cueId] = {
      cueId,
      title: meta.title,
      prompt,
      candidates: candidateInfos,
      evaluation,
      selectedCandidate: winnerCandidate.blindedLabel,
      selectionReason: evaluation.selectionReason,
      productionMasterPath,
      productionDsp,
    };
  }

  return results;
}
