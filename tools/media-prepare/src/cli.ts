import { prepareMedia } from "./prepare";

export interface MediaPrepareCliContext {
  argv: string[];
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
}

export interface MediaPrepareCliResult {
  exitCode: number;
}

export async function runMediaPrepareCli(
  context: MediaPrepareCliContext,
): Promise<MediaPrepareCliResult> {
  const stdout = context.stdout ?? ((msg: string) => process.stdout.write(`${msg}\n`));
  const stderr = context.stderr ?? ((msg: string) => process.stderr.write(`${msg}\n`));

  let mediaManifestPath = "";
  let sourceRoot = "";
  let outputDir = "";
  let manifestOutputPath = "";
  let webAssetPrefix = "/assets/derivatives/";

  const args = context.argv;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--media-manifest" && i + 1 < args.length) {
      mediaManifestPath = args[++i]!;
    } else if (arg === "--source-root" && i + 1 < args.length) {
      sourceRoot = args[++i]!;
    } else if (arg === "--output-dir" && i + 1 < args.length) {
      outputDir = args[++i]!;
    } else if (arg === "--manifest-output" && i + 1 < args.length) {
      manifestOutputPath = args[++i]!;
    } else if (arg === "--web-asset-prefix" && i + 1 < args.length) {
      webAssetPrefix = args[++i]!;
    } else if (arg === "--help" || arg === "-h") {
      stdout("Usage: rosie-media-prepare [options]");
      stdout("");
      stdout("Options:");
      stdout("  --media-manifest <path>    Path to input media manifest (e.g. shared/edition/media.json)");
      stdout("  --source-root <path>       Root directory for relative source media paths");
      stdout("  --output-dir <path>        Output directory for generated WebP derivatives");
      stdout("  --manifest-output <path>   Output path for generated derivative manifest JSON");
      stdout("  --web-asset-prefix <url>   Web URL prefix for derivative assets (default: /assets/derivatives/)");
      return { exitCode: 0 };
    }
  }

  if (!mediaManifestPath || !sourceRoot || !outputDir || !manifestOutputPath) {
    stderr("Error: Missing required arguments (--media-manifest, --source-root, --output-dir, --manifest-output)");
    return { exitCode: 1 };
  }

  try {
    const manifest = await prepareMedia({
      mediaManifestPath,
      sourceRoot,
      outputDir,
      manifestOutputPath,
      webAssetPrefix,
    });
    stdout(`Prepared ${manifest.derivatives.length} derivative(s) in ${outputDir}`);
    return { exitCode: 0 };
  } catch (error) {
    stderr(`Error preparing media: ${error instanceof Error ? error.message : String(error)}`);
    return { exitCode: 1 };
  }
}
