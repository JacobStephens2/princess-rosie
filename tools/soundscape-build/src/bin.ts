import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { runSoundscapeBuildCli } from "./cli";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const productionOutputRoot = join(
  repositoryRoot,
  "shared",
  "edition",
  "source-media",
  "soundscape",
);
const [command = "", ...suppliedOptions] = process.argv.slice(2);
const options = [...suppliedOptions];

function provideDefault(option: string, value: string): void {
  if (!options.includes(option)) options.push(option, value);
}

provideDefault(
  "--catalog",
  join(repositoryRoot, "shared", "edition", "soundscape", "catalog.json"),
);
provideDefault(
  "--output-root",
  productionOutputRoot,
);
provideDefault(
  "--source-media",
  join(repositoryRoot, "shared", "edition", "soundscape", "source-media.json"),
);
provideDefault(
  "--runtime-mappings",
  join(repositoryRoot, "shared", "edition", "soundscape", "runtime-mappings.json"),
);
provideDefault(
  "--media-doc",
  join(repositoryRoot, "docs", "media-prompts.md"),
);
provideDefault("--provider", "real");

const result = await runSoundscapeBuildCli({
  argv: [command, ...options],
  env: process.env,
  stdout: (message) => process.stdout.write(`${message}\n`),
  stderr: (message) => process.stderr.write(`${message}\n`),
  protectedProductionOutputRoot: productionOutputRoot,
  approveCandidates: async (candidates) => {
    const previewDirectory = await mkdtemp(join(tmpdir(), "rosi-soundscape-candidates-"));
    try {
      process.stdout.write("Generated temporary candidate previews:\n");
      for (const { id, previewWav } of candidates) {
        const previewPath = join(previewDirectory, `${id}.wav`);
        await writeFile(previewPath, previewWav);
        process.stdout.write(`${id}: ${previewPath}\n`);
      }
      const prompts = createInterface({ input: process.stdin, output: process.stdout });
      try {
        const approvedCandidate = await prompts.question(
          "Approve one listed candidate, or enter none to request another batch: ",
        );
        const selectionReason = await prompts.question("Selection reason: ");
        return { approvedCandidate: approvedCandidate.trim(), selectionReason: selectionReason.trim() };
      } finally {
        prompts.close();
      }
    } finally {
      await rm(previewDirectory, { recursive: true, force: true });
    }
  },
});
process.exitCode = result.exitCode;
