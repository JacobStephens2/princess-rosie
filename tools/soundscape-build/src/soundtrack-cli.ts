import { runSoundtrackGenerationAndEvaluation } from "./soundtrack/runner";

async function main() {
  const args = process.argv.slice(2);
  let cueIdArg: string | undefined;
  let skipCached = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cue" && args[i + 1]) {
      cueIdArg = args[i + 1];
      i++;
    } else if (args[i] === "--skip-cached") {
      skipCached = true;
    }
  }

  const cueIds = cueIdArg ? [cueIdArg] : undefined;
  console.log("Starting soundtrack pipeline for cues:", cueIds || "all 4 cues");
  const results = await runSoundtrackGenerationAndEvaluation({
    cueIds,
    skipGenerationIfCached: skipCached,
  });

  console.log("\nPipeline complete. Results summary:");
  for (const [cueId, res] of Object.entries(results)) {
    console.log(`- ${res.title} (${cueId}): Winner ${res.selectedCandidate}`);
    console.log(`  Reason: ${res.selectionReason}`);
    console.log(`  Rankings: ${res.evaluation.rankings.join(" > ")}`);
    console.log(`  Loudness: ${res.productionDsp.integratedLoudness} LUFS, Peak: ${res.productionDsp.peakDb} dBFS`);
  }
}

main().catch((err) => {
  console.error("Soundtrack pipeline failed:", err);
  process.exit(1);
});
