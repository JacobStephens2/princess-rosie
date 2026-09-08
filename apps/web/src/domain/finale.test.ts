import { describe, expect, it } from "vitest";
import { advanceToAlbum, createFinaleState, returnToCelebration } from "./finale";

describe("finale state machine", () => {
  it("initializes with celebration-view (Beat 1)", () => {
    const state = createFinaleState();
    expect(state.beat).toBe("celebration-view");
  });

  it("advances from celebration-view (Beat 1) to album-view (Beat 2)", () => {
    const state = createFinaleState();
    const nextState = advanceToAlbum(state);
    expect(nextState.beat).toBe("album-view");
  });

  it("is idempotent when advancing from album-view", () => {
    const state = advanceToAlbum(createFinaleState());
    const nextState = advanceToAlbum(state);
    expect(nextState.beat).toBe("album-view");
  });

  it("returns from album-view (Beat 2) back to celebration-view (Beat 1)", () => {
    const state = advanceToAlbum(createFinaleState());
    const returnedState = returnToCelebration(state);
    expect(returnedState.beat).toBe("celebration-view");
  });

  it("is idempotent when returning to celebration-view", () => {
    const state = createFinaleState();
    const returnedState = returnToCelebration(state);
    expect(returnedState.beat).toBe("celebration-view");
  });
});
