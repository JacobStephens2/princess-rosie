import { STAR_STOPS, type StarStop } from "./journey";
import { DEFAULT_RUNNER_CONFIG } from "./gallop-and-flutter";
import derivativeManifest from "../../public/assets/derivative-manifest.json";

export type SceneryLayerDepth = "far" | "middle" | "near";

export interface SetPiece {
  assetId: string;
  positionAlongCourse: number;
  groundAnchor: number;
}

export interface SceneryLayer {
  depth: SceneryLayerDepth;
  depthFactor: number;
  setPieces: readonly SetPiece[];
  paintingAssetId?: string;
}

export interface PlaceScenery {
  place: StarStop;
  layers: readonly SceneryLayer[];
}

/**
 * Calculates the layer offset for a Scenery Layer given runner position and depth factor.
 *
 * Depth factor zero returns 0 (fixed backdrop, e.g. the approved reference painting).
 * Depth factor one moves 1:1 with runner position.
 * Fractional depth factors move proportionally (e.g. 0.2 for far layer, 0.5 for middle layer).
 */
export function calculateSceneryLayerOffset(
  runnerPosition: number,
  depthFactor: number
): number {
  return runnerPosition * depthFactor;
}

const PLACE_PAINTINGS: Record<StarStop, string> = {
  garden: "flight.rose-garden-background",
  lacewood: "lacewood.background",
  abbey: "abbey.background",
  clouds: "cloister.background",
  peak: "pellegrino-peak.background",
  sea: "sapphire-sea.background",
  castle: "celebration.castle-approach",
};

function createPlaceScenery(place: StarStop): PlaceScenery {
  const farLayer: SceneryLayer = {
    depth: "far",
    depthFactor: 0,
    paintingAssetId: PLACE_PAINTINGS[place],
    setPieces: [],
  };

  const middleLayer: SceneryLayer = {
    depth: "middle",
    depthFactor: 0.5,
    setPieces: [],
  };

  const nearLayer: SceneryLayer = {
    depth: "near",
    depthFactor: 1.0,
    setPieces: [],
  };

  return {
    place,
    layers: [farLayer, middleLayer, nearLayer],
  };
}

export const ROSE_GARDEN_SCENERY: PlaceScenery = {
  place: "garden",
  layers: [
    {
      depth: "far",
      depthFactor: 0.2,
      paintingAssetId: "garden.far-layer",
      setPieces: [],
    },
    {
      depth: "middle",
      depthFactor: 0.5,
      setPieces: [
        { assetId: "shared.cloud-bank", positionAlongCourse: 500, groundAnchor: 0.25 },
        { assetId: "garden.balustrade-run", positionAlongCourse: 1100, groundAnchor: 0.788 },
        { assetId: "garden.column-ribbon", positionAlongCourse: 1700, groundAnchor: 0.78 },
        { assetId: "shared.cypress-tree", positionAlongCourse: 2300, groundAnchor: 0.78 },
        { assetId: "garden.arch-cluster", positionAlongCourse: 2890, groundAnchor: 0.78 },
      ],
    },
    {
      depth: "near",
      depthFactor: 1.0,
      setPieces: [
        { assetId: "garden.border-strip", positionAlongCourse: 800, groundAnchor: 0.95 },
        { assetId: "garden.rose-bush-cluster", positionAlongCourse: 2200, groundAnchor: 0.92 },
        { assetId: "garden.terrace-edge", positionAlongCourse: 3600, groundAnchor: 0.98 },
      ],
    },
  ],
};

export const LACEWOOD_SCENERY: PlaceScenery = {
  place: "lacewood",
  layers: [
    {
      depth: "far",
      depthFactor: 0.2,
      paintingAssetId: "lacewood.far-layer",
      setPieces: [],
    },
    {
      depth: "middle",
      depthFactor: 0.5,
      setPieces: [
        { assetId: "shared.cloud-bank", positionAlongCourse: 450, groundAnchor: 0.25 },
        { assetId: "shared.cypress-tree", positionAlongCourse: 1050, groundAnchor: 0.78 },
        { assetId: "lacewood.pillar-lantern-row", positionAlongCourse: 1600, groundAnchor: 0.788 },
        { assetId: "shared.garden-lantern", positionAlongCourse: 2050, groundAnchor: 0.78 },
        { assetId: "lacewood.lace-ribbon-tree", positionAlongCourse: 2500, groundAnchor: 0.78 },
        { assetId: "lacewood.lace-pavilion", positionAlongCourse: 2890, groundAnchor: 0.78 },
      ],
    },
    {
      depth: "near",
      depthFactor: 1.0,
      setPieces: [
        { assetId: "lacewood.stone-tile-ground", positionAlongCourse: 800, groundAnchor: 0.95 },
        { assetId: "lacewood.rose-woodland-border", positionAlongCourse: 2200, groundAnchor: 0.92 },
        { assetId: "lacewood.canopy-arch", positionAlongCourse: 3600, groundAnchor: 0.78 },
      ],
    },
  ],
};

export const GOLDEN_BELL_ABBEY_SCENERY: PlaceScenery = {
  place: "abbey",
  layers: [
    {
      depth: "far",
      depthFactor: 0.2,
      paintingAssetId: "abbey.far-layer",
      setPieces: [],
    },
    {
      depth: "middle",
      depthFactor: 0.5,
      setPieces: [
        { assetId: "shared.cloud-bank", positionAlongCourse: 450, groundAnchor: 0.25 },
        { assetId: "shared.cypress-tree", positionAlongCourse: 1000, groundAnchor: 0.78 },
        { assetId: "abbey.rose-window-wall", positionAlongCourse: 1550, groundAnchor: 0.788 },
        { assetId: "shared.stone-fountain", positionAlongCourse: 2000, groundAnchor: 0.78 },
        { assetId: "abbey.bell-tower-belfry", positionAlongCourse: 2450, groundAnchor: 0.78 },
        { assetId: "abbey.cloister-arcade", positionAlongCourse: 2890, groundAnchor: 0.78 },
      ],
    },
    {
      depth: "near",
      depthFactor: 1.0,
      setPieces: [
        { assetId: "abbey.stone-terrace-ground", positionAlongCourse: 800, groundAnchor: 0.95 },
        { assetId: "abbey.lavender-herb-border", positionAlongCourse: 2200, groundAnchor: 0.92 },
        { assetId: "abbey.vaulted-arch-canopy", positionAlongCourse: 3600, groundAnchor: 0.78 },
      ],
    },
  ],
};

export const AUTHORED_PLACE_SCENERY: Record<StarStop, PlaceScenery> = {
  garden: ROSE_GARDEN_SCENERY,
  lacewood: LACEWOOD_SCENERY,
  abbey: GOLDEN_BELL_ABBEY_SCENERY,
  clouds: createPlaceScenery("clouds"),
  peak: createPlaceScenery("peak"),
  sea: createPlaceScenery("sea"),
  castle: createPlaceScenery("castle"),
};

export function getPlaceScenery(place: StarStop): PlaceScenery {
  const scenery = AUTHORED_PLACE_SCENERY[place];
  if (!scenery) {
    throw new Error(`No scenery declared for place: ${place}`);
  }
  return scenery;
}

export function getAllPlaceLayers(): Record<StarStop, readonly SceneryLayer[]> {
  const result = {} as Record<StarStop, readonly SceneryLayer[]>;
  for (const stop of STAR_STOPS) {
    result[stop] = getPlaceScenery(stop).layers;
  }
  return result;
}

export function getPlaceLayers(place: StarStop): readonly SceneryLayer[];
export function getPlaceLayers(): Record<StarStop, readonly SceneryLayer[]>;
export function getPlaceLayers(
  place?: StarStop
): readonly SceneryLayer[] | Record<StarStop, readonly SceneryLayer[]> {
  if (place !== undefined) {
    return getPlaceScenery(place).layers;
  }
  return getAllPlaceLayers();
}

export interface ValidationOptions {
  manifest?: { derivatives: readonly { id: string }[] };
  courseLength?: number;
}

export function validatePlaceScenery(
  scenery: PlaceScenery,
  options?: ValidationOptions
): boolean {
  if (!scenery || !Array.isArray(scenery.layers) || scenery.layers.length !== 3) {
    throw new Error(
      `Place "${scenery?.place}" must declare three Scenery Layers: far, middle, and near in order.`
    );
  }

  const [far, middle, near] = scenery.layers;
  if (far?.depth !== "far" || middle?.depth !== "middle" || near?.depth !== "near") {
    throw new Error(
      `Place "${scenery.place}" must declare three Scenery Layers: far, middle, and near in order.`
    );
  }

  const manifest = options?.manifest ?? derivativeManifest;
  const knownAssetIds = new Set(manifest.derivatives.map((entry) => entry.id));
  const courseLength = options?.courseLength ?? DEFAULT_RUNNER_CONFIG.courseLength;

  for (const layer of scenery.layers) {
    if (
      typeof layer.depthFactor !== "number" ||
      Number.isNaN(layer.depthFactor) ||
      layer.depthFactor < 0
    ) {
      throw new Error(
        `Place "${scenery.place}" layer "${layer.depth}" has invalid depth factor: ${layer.depthFactor}.`
      );
    }

    if (layer.paintingAssetId !== undefined) {
      if (!knownAssetIds.has(layer.paintingAssetId)) {
        throw new Error(
          `Place "${scenery.place}" layer "${layer.depth}" has unknown asset id: "${layer.paintingAssetId}".`
        );
      }
    }

    if (!Array.isArray(layer.setPieces)) {
      throw new Error(
        `Place "${scenery.place}" layer "${layer.depth}" must declare a setPieces list.`
      );
    }

    for (const piece of layer.setPieces) {
      if (!knownAssetIds.has(piece.assetId)) {
        throw new Error(
          `Place "${scenery.place}" layer "${layer.depth}" Set Piece has unknown asset id: "${piece.assetId}".`
        );
      }

      const position = piece.positionAlongCourse;
      if (
        typeof position !== "number" ||
        Number.isNaN(position) ||
        position < 0 ||
        position > courseLength
      ) {
        throw new Error(
          `Place "${scenery.place}" layer "${layer.depth}" Set Piece "${piece.assetId}" position ${position} is outside course bounds [0, ${courseLength}].`
        );
      }

      if (typeof piece.groundAnchor !== "number" || Number.isNaN(piece.groundAnchor)) {
        throw new Error(
          `Place "${scenery.place}" layer "${layer.depth}" Set Piece "${piece.assetId}" has invalid ground anchor: ${piece.groundAnchor}.`
        );
      }
    }
  }

  return true;
}

export function validateAllPlaceScenery(options?: ValidationOptions): boolean {
  for (const stop of STAR_STOPS) {
    validatePlaceScenery(AUTHORED_PLACE_SCENERY[stop], options);
  }
  return true;
}

