import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import type { DerivativeEntry, DerivativeManifest, MediaManifest, PrepareOptions } from "./model";

export const MAX_TEXTURE_WIDTH = 4095;
export const STAGE_HEIGHT = 720;

export function calculateTargetDimensions(
  entry: { id: string; role: string },
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  let width: number;
  let height: number;

  switch (entry.role) {
    case "illustration":
    case "illustration-layer":
    case "set-piece": {
      height = STAGE_HEIGHT;
      width = Math.round((sourceWidth * height) / sourceHeight);
      break;
    }
    case "cutout": {
      const maxDim = entry.id.includes("archway") ? 512 : 256;
      const scale = Math.min(maxDim / sourceWidth, maxDim / sourceHeight, 1);
      width = Math.round(sourceWidth * scale);
      height = Math.round(sourceHeight * scale);
      break;
    }
    case "sprite": {
      const maxDim = 128;
      const scale = Math.min(maxDim / sourceWidth, maxDim / sourceHeight, 1);
      width = Math.round(sourceWidth * scale);
      height = Math.round(sourceHeight * scale);
      break;
    }
    case "treatment": {
      const maxWidth = 768;
      const maxHeight = 512;
      const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
      width = Math.round(sourceWidth * scale);
      height = Math.round(sourceHeight * scale);
      break;
    }
    case "character-layer": {
      if (entry.id.startsWith("flight.rosie-stella")) {
        height = 256;
        width = Math.round((sourceWidth * height) / sourceHeight);
      } else {
        height = 504;
        width = Math.round((sourceWidth * height) / sourceHeight);
      }
      break;
    }
    default: {
      height = STAGE_HEIGHT;
      width = Math.round((sourceWidth * height) / sourceHeight);
      break;
    }
  }

  if (width > MAX_TEXTURE_WIDTH) {
    width = MAX_TEXTURE_WIDTH;
    height = Math.round((sourceHeight * width) / sourceWidth);
  }

  return { width, height };
}

export async function prepareMedia(options: PrepareOptions): Promise<DerivativeManifest> {
  const manifestRaw = await readFile(options.mediaManifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw) as MediaManifest;

  if (!Array.isArray(manifest.media)) {
    throw new Error(`Invalid media manifest at ${options.mediaManifestPath}: expected "media" array`);
  }

  await mkdir(options.outputDir, { recursive: true });
  await mkdir(dirname(options.manifestOutputPath), { recursive: true });

  const webAssetPrefix = options.webAssetPrefix ?? "/assets/derivatives/";
  const derivatives: DerivativeEntry[] = [];

  for (const entry of manifest.media) {
    const sourceFilePath = join(options.sourceRoot, entry.path);
    let image: sharp.Sharp;
    let metadata: sharp.Metadata;
    try {
      const fileStat = await stat(sourceFilePath);
      if (!fileStat.isFile()) {
        throw new Error(`Media source "${entry.id}" at ${sourceFilePath} is not a regular file`);
      }
      image = sharp(sourceFilePath);
      metadata = await image.metadata();
    } catch {
      throw new Error(`Media source for "${entry.id}" is missing or unreadable: ${sourceFilePath}`);
    }

    const sourceWidth = metadata.width ?? 0;
    const sourceHeight = metadata.height ?? 0;

    if (sourceWidth === 0 || sourceHeight === 0) {
      throw new Error(`Media source "${entry.id}" has invalid dimensions: ${sourceWidth}x${sourceHeight}`);
    }

    const targetDims = calculateTargetDimensions(entry, sourceWidth, sourceHeight);

    const outputFileName = `${entry.id}.webp`;
    const outputFilePath = join(options.outputDir, outputFileName);
    const webPath = `${webAssetPrefix.replace(/\/?$/, "/")}${outputFileName}`;

    const outputBuffer = await image
      .resize(targetDims.width, targetDims.height)
      .webp({ quality: 90, effort: 4 })
      .toBuffer();

    let existingBuffer: Buffer | null = null;
    try {
      existingBuffer = await readFile(outputFilePath);
    } catch {
      // File does not exist yet
    }

    if (!existingBuffer || !existingBuffer.equals(outputBuffer)) {
      await writeFile(outputFilePath, outputBuffer);
    }

    derivatives.push({
      id: entry.id,
      role: entry.role,
      path: webPath,
      width: targetDims.width,
      height: targetDims.height,
    });
  }

  const result: DerivativeManifest = {
    derivatives,
  };

  const formattedManifest = JSON.stringify(result, null, 2);
  let existingManifestRaw: string | null = null;
  try {
    existingManifestRaw = await readFile(options.manifestOutputPath, "utf8");
  } catch {
    // Manifest does not exist yet
  }

  if (existingManifestRaw !== formattedManifest) {
    await writeFile(options.manifestOutputPath, formattedManifest, "utf8");
  }

  return result;
}
