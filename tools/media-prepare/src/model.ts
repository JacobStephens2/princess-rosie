export type MediaRole =
  | "illustration"
  | "illustration-layer"
  | "character-layer"
  | "sprite"
  | "treatment"
  | string;

export interface MediaManifestEntry {
  id: string;
  role: MediaRole;
  path: string;
}

export interface MediaManifest {
  media: MediaManifestEntry[];
}

export interface DerivativeEntry {
  id: string;
  role: MediaRole;
  path: string;
  width: number;
  height: number;
}

export interface DerivativeManifest {
  derivatives: DerivativeEntry[];
}

export interface PrepareOptions {
  mediaManifestPath: string;
  sourceRoot: string;
  outputDir: string;
  manifestOutputPath: string;
  webAssetPrefix?: string;
}
