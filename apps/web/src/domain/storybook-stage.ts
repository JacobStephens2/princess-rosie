export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;
/** Stella's x in the 16:9 camera view: center 640 plus the existing follow offset -340. */
const STELLA_VIEW_X = 300;

export type StorybookStageMode = "portrait-window" | "wide-16-9";

export interface VisibleDisplay {
  width: number;
  height: number;
}

export interface StorybookStageLayout {
  mode: StorybookStageMode;
  width: number;
  height: number;
  cameraZoom: number;
  visibleWorldWidth: number;
  followOffsetX: number;
}

export function layoutStorybookStage(display: VisibleDisplay): StorybookStageLayout {
  const mode: StorybookStageMode = display.height > display.width ? "portrait-window" : "wide-16-9";
  const size = mode === "portrait-window"
    ? { width: display.width, height: display.height }
    : fitWide16By9(display);
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);
  const cameraZoom = height / WORLD_HEIGHT;
  const visibleWorldWidth = width / cameraZoom;
  return {
    mode,
    width,
    height,
    cameraZoom,
    visibleWorldWidth,
    followOffsetX: visibleWorldWidth * (STELLA_VIEW_X / WORLD_WIDTH - 0.5),
  };
}

function fitWide16By9(display: VisibleDisplay): { width: number; height: number } {
  const heightFromWidth = display.width * 9 / 16;
  if (heightFromWidth <= display.height) {
    return { width: display.width, height: heightFromWidth };
  }
  return { width: display.height * 16 / 9, height: display.height };
}

export function shouldApplyStageLayout(options: {
  locked: StorybookStageLayout | undefined;
  next: StorybookStageLayout;
  flightActive: boolean;
}): boolean {
  if (!options.flightActive || options.locked === undefined) return true;
  return options.locked.mode !== options.next.mode;
}
