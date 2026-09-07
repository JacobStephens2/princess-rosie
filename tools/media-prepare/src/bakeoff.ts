export interface EntrantAssets {
  provider: string;
  farLayerWidth: number;
  farLayerHeight: number;
  archClusterWidth: number;
  archClusterHeight: number;
  roseBushWidth: number;
  roseBushHeight: number;
}

export interface ElementPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FramePlacements {
  frameWidth: number;
  frameHeight: number;
  farLayer: ElementPlacement;
  archCluster: ElementPlacement;
  roseBush: ElementPlacement;
}

export interface ContactSheetFrame {
  provider: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContactSheetLayout {
  sheetWidth: number;
  sheetHeight: number;
  frames: readonly ContactSheetFrame[];
}

export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;
export const STORYBOOK_GROUND_Y = 560;

/**
 * Calculates placements for far layer, arch-cluster Set Piece, and rose bush obstacle
 * inside a 1280x720 Stage frame.
 */
export function calculateFramePlacements(assets: EntrantAssets): FramePlacements {
  const frameWidth = STAGE_WIDTH;
  const frameHeight = STAGE_HEIGHT;

  // Far layer fills/covers the 1280x720 frame
  const farLayer: ElementPlacement = {
    x: 0,
    y: 0,
    width: frameWidth,
    height: frameHeight,
  };

  // Arch cluster spans Stage width, maintaining aspect ratio
  const archRatio = assets.archClusterHeight / assets.archClusterWidth;
  const archHeight = Math.round(frameWidth * archRatio);
  const archCluster: ElementPlacement = {
    x: 0,
    y: Math.max(0, STORYBOOK_GROUND_Y - archHeight),
    width: frameWidth,
    height: archHeight,
  };

  // Rose bush obstacle on Storybook Ground (height 140px, bottom at y=560)
  const obstacleHeight = 140;
  const obstacleRatio = assets.roseBushWidth / assets.roseBushHeight;
  const obstacleWidth = Math.round(obstacleHeight * obstacleRatio);
  const roseBush: ElementPlacement = {
    x: Math.round(frameWidth * 0.65), // positioned comfortably along ground
    y: STORYBOOK_GROUND_Y - obstacleHeight,
    width: obstacleWidth,
    height: obstacleHeight,
  };

  return {
    frameWidth,
    frameHeight,
    farLayer,
    archCluster,
    roseBush,
  };
}

/**
 * Calculates side-by-side Stage-size layout for the contact sheet.
 */
export function calculateContactSheetLayout(
  providers: readonly string[]
): ContactSheetLayout {
  const frames: ContactSheetFrame[] = providers.map((provider, index) => ({
    provider,
    x: index * STAGE_WIDTH,
    y: 0,
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  }));

  return {
    sheetWidth: providers.length * STAGE_WIDTH,
    sheetHeight: STAGE_HEIGHT,
    frames,
  };
}

export type BakeoffRole = "arch-cluster" | "rose-bush" | "far-layer";

export interface BakeoffGenerationParams {
  provider: string;
  model: string;
  role: BakeoffRole;
  size: string;
  prompt: string;
  costUsd: number;
  outputPath: string;
  sha256?: string;
}

export interface BakeoffGenerationRecord {
  id: string;
  provider: string;
  model: string;
  role: BakeoffRole;
  size: string;
  prompt: string;
  costUsd: number;
  outputPath: string;
  sha256?: string;
  selection: {
    status: "candidate";
    reason: string;
  };
}

export interface ProvenanceManifestDoc {
  manifestVersion: "1.0.0";
  updatedAt: string;
  purpose: string;
  totalSpendUsd: number;
  assets: readonly BakeoffGenerationRecord[];
}

export function recordBakeoffGeneration(
  params: BakeoffGenerationParams
): BakeoffGenerationRecord {
  if (!params.provider || !params.model || !params.size || !params.prompt) {
    throw new Error("Missing required generation recording fields");
  }

  const id = `bake-off.${params.provider}.${params.role}`;

  return {
    id,
    provider: params.provider,
    model: params.model,
    role: params.role,
    size: params.size,
    prompt: params.prompt,
    costUsd: params.costUsd,
    outputPath: params.outputPath,
    sha256: params.sha256,
    selection: {
      status: "candidate",
      reason: `Entrant ${params.provider} candidate for ${params.role} in issue #131 provider bake-off.`,
    },
  };
}

export function calculateTotalSpend(
  generations: readonly { costUsd: number }[]
): number {
  const sum = generations.reduce((acc, curr) => acc + curr.costUsd, 0);
  return Math.round(sum * 10000) / 10000;
}

export function buildProvenanceManifest(
  generations: readonly BakeoffGenerationRecord[],
  updatedAt: string = new Date().toISOString().slice(0, 10)
): ProvenanceManifestDoc {
  return {
    manifestVersion: "1.0.0",
    updatedAt,
    purpose: "Provider bake-off candidate assets for issue #131.",
    totalSpendUsd: calculateTotalSpend(generations),
    assets: generations.map((g) => ({
      ...g,
      selection: {
        status: "candidate",
        reason: g.selection.reason,
      },
    })),
  };
}

