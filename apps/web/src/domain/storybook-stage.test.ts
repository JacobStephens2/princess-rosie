import { describe, expect, test } from "vitest";
import { layoutStorybookStage, shouldApplyStageLayout } from "./storybook-stage";

describe("Storybook Stage layout", () => {
  test("a 360×800 tall display is a portrait window that maps the 720-high world onto the visible height and crops left and right", () => {
    const stage = layoutStorybookStage({ width: 360, height: 800 });

    expect(stage.mode).toBe("portrait-window");
    expect(stage.width).toBe(360);
    expect(stage.height).toBe(800);
    expect(stage.cameraZoom).toBeCloseTo(800 / 720);
    expect(stage.visibleWorldWidth).toBe(324);
    expect(stage.visibleWorldWidth).toBeLessThan(1280);
    expect(stage.followOffsetX).toBeLessThan(0);
  });

  test("a 1280×720 display keeps a 16:9 Stage of the full world with Stella left of center", () => {
    const stage = layoutStorybookStage({ width: 1280, height: 720 });

    expect(stage.mode).toBe("wide-16-9");
    expect(stage.width).toBe(1280);
    expect(stage.height).toBe(720);
    expect(stage.cameraZoom).toBe(1);
    expect(stage.visibleWorldWidth).toBe(1280);
    expect(stage.followOffsetX).toBe(-340);
  });

  test("an iPad 1024×768 display fits a 16:9 Stage without cropping the world", () => {
    const stage = layoutStorybookStage({ width: 1024, height: 768 });

    expect(stage.mode).toBe("wide-16-9");
    expect(stage.width).toBe(1024);
    expect(stage.height).toBe(576);
    expect(stage.cameraZoom).toBeCloseTo(576 / 720);
    expect(stage.visibleWorldWidth).toBeCloseTo(1280);
    expect(stage.followOffsetX).toBeCloseTo(-340);
  });

  test("a sideways phone 844×390 display keeps a 16:9 Stage", () => {
    const stage = layoutStorybookStage({ width: 844, height: 390 });

    expect(stage.mode).toBe("wide-16-9");
    expect(stage.height).toBe(390);
    expect(stage.width / stage.height).toBeCloseTo(16 / 9, 2);
    expect(stage.visibleWorldWidth).toBeCloseTo(1280, 0);
  });

  test("an address-bar resize during Gallop and Flutter does not change the locked portrait window", () => {
    const locked = layoutStorybookStage({ width: 360, height: 800 });
    const next = layoutStorybookStage({ width: 360, height: 700 });

    expect(shouldApplyStageLayout({ locked, next, flightActive: true })).toBe(false);
    expect(next.cameraZoom).not.toBeCloseTo(locked.cameraZoom);
  });

  test("rotating to landscape during Gallop and Flutter switches to a 16:9 Stage", () => {
    const locked = layoutStorybookStage({ width: 360, height: 800 });
    const next = layoutStorybookStage({ width: 800, height: 360 });

    expect(shouldApplyStageLayout({ locked, next, flightActive: true })).toBe(true);
    expect(next.mode).toBe("wide-16-9");
  });

  test("paused screens and flight start apply the current visible display", () => {
    const locked = layoutStorybookStage({ width: 360, height: 800 });
    const next = layoutStorybookStage({ width: 360, height: 700 });

    expect(shouldApplyStageLayout({ locked, next, flightActive: false })).toBe(true);
    expect(shouldApplyStageLayout({ locked: undefined, next, flightActive: true })).toBe(true);
  });
});
