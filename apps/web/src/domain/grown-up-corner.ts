export const GROWN_UP_HOLD_DURATION_MS = 2000;

export interface GrownUpCornerState {
  readonly isOpen: boolean;
  readonly isHolding: boolean;
  readonly holdProgress: number;
  readonly holdDurationMs: number;
}

export function createGrownUpCornerState(): GrownUpCornerState {
  return {
    isOpen: false,
    isHolding: false,
    holdProgress: 0,
    holdDurationMs: 0,
  };
}

export function startGrownUpHold(state: GrownUpCornerState): GrownUpCornerState {
  if (state.isOpen) return state;
  return {
    ...state,
    isHolding: true,
    holdProgress: 0,
    holdDurationMs: 0,
  };
}

export interface GrownUpHoldUpdate {
  readonly state: GrownUpCornerState;
  readonly triggered: boolean;
}

export function updateGrownUpHold(state: GrownUpCornerState, deltaMs: number): GrownUpHoldUpdate {
  if (!state.isHolding || state.isOpen) {
    return { state, triggered: false };
  }

  const newDuration = state.holdDurationMs + deltaMs;
  if (newDuration >= GROWN_UP_HOLD_DURATION_MS) {
    return {
      state: {
        isOpen: true,
        isHolding: false,
        holdProgress: 1,
        holdDurationMs: GROWN_UP_HOLD_DURATION_MS,
      },
      triggered: true,
    };
  }

  return {
    state: {
      ...state,
      holdDurationMs: newDuration,
      holdProgress: Math.min(1, newDuration / GROWN_UP_HOLD_DURATION_MS),
    },
    triggered: false,
  };
}

export function cancelGrownUpHold(state: GrownUpCornerState): GrownUpCornerState {
  if (state.isOpen) return state;
  return {
    ...state,
    isHolding: false,
    holdProgress: 0,
    holdDurationMs: 0,
  };
}

export function triggerTwoFingerTap(state: GrownUpCornerState): GrownUpCornerState {
  return {
    ...state,
    isOpen: true,
    isHolding: false,
    holdProgress: 1,
    holdDurationMs: GROWN_UP_HOLD_DURATION_MS,
  };
}

export function closeGrownUpCorner(state: GrownUpCornerState): GrownUpCornerState {
  return {
    ...state,
    isOpen: false,
    isHolding: false,
    holdProgress: 0,
    holdDurationMs: 0,
  };
}
