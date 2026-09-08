export type FinaleBeat = "celebration-view" | "album-view";

export interface FinaleState {
  readonly beat: FinaleBeat;
}

export function createFinaleState(): FinaleState {
  return {
    beat: "celebration-view",
  };
}

export function advanceToAlbum(state: FinaleState): FinaleState {
  if (state.beat === "album-view") return state;
  return {
    beat: "album-view",
  };
}

export function returnToCelebration(state: FinaleState): FinaleState {
  if (state.beat === "celebration-view") return state;
  return {
    beat: "celebration-view",
  };
}
