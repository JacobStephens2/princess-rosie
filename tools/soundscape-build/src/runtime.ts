import { sha256 } from "./artifacts";
import type { AudioQa } from "./audio";
import { cueSlug } from "./catalog";
import type { CatalogCue } from "./model";

export function createRuntimeArtifact(
  cue: CatalogCue,
  master: Buffer,
  audioQa: AudioQa,
  runtimePath: string,
): {
  derivative: Buffer;
  runtimeImport: Record<string, unknown>;
} {
  const derivative = Buffer.from(master);
  return {
    derivative,
    runtimeImport: {
      cueId: cue.id,
      runtimeMapping: cue.runtimeMapping,
      sourceMaster: cue.sourceMaster,
      sourcePath: `masters/${cueSlug(cue.id)}.wav`,
      runtimePath,
      sourceHash: sha256(master),
      derivativeHash: sha256(derivative),
      import: {
        sampleRate: audioQa.sampleRate,
        channels: audioQa.channels,
        looping: cue.looping,
      },
    },
  };
}
