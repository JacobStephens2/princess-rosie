import { describe, expect, it } from "vitest";
import {
  GROWN_UP_HOLD_DURATION_MS,
  cancelGrownUpHold,
  closeGrownUpCorner,
  createGrownUpCornerState,
  startGrownUpHold,
  triggerTwoFingerTap,
  updateGrownUpHold,
} from "./grown-up-corner";

describe("Grown-up Corner domain state", () => {
  it("initializes closed with no active hold", () => {
    const state = createGrownUpCornerState();
    expect(state.isOpen).toBe(false);
    expect(state.isHolding).toBe(false);
    expect(state.holdProgress).toBe(0);
    expect(state.holdDurationMs).toBe(0);
  });

  it("requires a 2000ms (2-second) hold threshold", () => {
    expect(GROWN_UP_HOLD_DURATION_MS).toBe(2000);
  });

  it("does not open on brief press releases (accidental taps)", () => {
    let state = createGrownUpCornerState();
    state = startGrownUpHold(state);
    expect(state.isHolding).toBe(true);

    // After 500ms (brief tap)
    const update = updateGrownUpHold(state, 500);
    state = update.state;
    expect(update.triggered).toBe(false);
    expect(state.isOpen).toBe(false);
    expect(state.holdProgress).toBeCloseTo(0.25);

    // Cancelled / released before 2s
    state = cancelGrownUpHold(state);
    expect(state.isHolding).toBe(false);
    expect(state.isOpen).toBe(false);
    expect(state.holdProgress).toBe(0);
    expect(state.holdDurationMs).toBe(0);
  });

  it("reveals controls when sustained hold reaches 2000ms", () => {
    let state = createGrownUpCornerState();
    state = startGrownUpHold(state);

    // 1000ms in (halfway)
    let update = updateGrownUpHold(state, 1000);
    state = update.state;
    expect(update.triggered).toBe(false);
    expect(state.isOpen).toBe(false);
    expect(state.holdProgress).toBe(0.5);

    // Another 1000ms (completes 2000ms)
    update = updateGrownUpHold(state, 1000);
    state = update.state;
    expect(update.triggered).toBe(true);
    expect(state.isOpen).toBe(true);
    expect(state.isHolding).toBe(false);
    expect(state.holdProgress).toBe(1);
  });

  it("reveals controls immediately upon secondary two-finger tap", () => {
    let state = createGrownUpCornerState();
    state = triggerTwoFingerTap(state);
    expect(state.isOpen).toBe(true);
    expect(state.isHolding).toBe(false);
    expect(state.holdProgress).toBe(1);
  });

  it("resets and closes when dismissed", () => {
    let state = createGrownUpCornerState();
    state = triggerTwoFingerTap(state);
    expect(state.isOpen).toBe(true);

    state = closeGrownUpCorner(state);
    expect(state.isOpen).toBe(false);
    expect(state.isHolding).toBe(false);
    expect(state.holdProgress).toBe(0);
    expect(state.holdDurationMs).toBe(0);
  });
});
