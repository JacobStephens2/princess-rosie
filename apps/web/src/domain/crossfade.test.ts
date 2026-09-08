import { describe, expect, test } from "vitest";
import { calculateEqualPowerGains, CrossfadeController } from "./crossfade";


describe("Equal-power crossfade gain calculations", () => {
  test("calculates unity outgoing gain and zero incoming gain at start (p = 0)", () => {
    const { outgoingGain, incomingGain } = calculateEqualPowerGains(0);
    expect(outgoingGain).toBeCloseTo(1.0, 4);
    expect(incomingGain).toBeCloseTo(0.0, 4);
  });

  test("calculates equal gains preserving total acoustic power at midpoint (p = 0.5)", () => {
    const { outgoingGain, incomingGain } = calculateEqualPowerGains(0.5);
    expect(outgoingGain).toBeCloseTo(Math.SQRT1_2, 4); // ~0.7071
    expect(incomingGain).toBeCloseTo(Math.SQRT1_2, 4);

    // Sum of squares (acoustic power) is 1.0
    const totalPower = outgoingGain ** 2 + incomingGain ** 2;
    expect(totalPower).toBeCloseTo(1.0, 4);
  });

  test("calculates zero outgoing gain and full incoming gain at completion (p = 1)", () => {
    const { outgoingGain, incomingGain } = calculateEqualPowerGains(1);
    expect(outgoingGain).toBeCloseTo(0.0, 4);
    expect(incomingGain).toBeCloseTo(1.0, 4);
  });

  test("preserves acoustic power across arbitrary progress points between 0 and 1", () => {
    for (let p = 0; p <= 1.0; p += 0.1) {
      const { outgoingGain, incomingGain } = calculateEqualPowerGains(p);
      const totalPower = outgoingGain ** 2 + incomingGain ** 2;
      expect(totalPower).toBeCloseTo(1.0, 4);
    }
  });

  test("clamps progress below 0 and above 1", () => {
    const below = calculateEqualPowerGains(-0.5);
    expect(below.outgoingGain).toBeCloseTo(1.0, 4);
    expect(below.incomingGain).toBeCloseTo(0.0, 4);

    const above = calculateEqualPowerGains(1.5);
    expect(above.outgoingGain).toBeCloseTo(0.0, 4);
    expect(above.incomingGain).toBeCloseTo(1.0, 4);
  });

  test("scales gains with optional maxVolume", () => {
    const { outgoingGain, incomingGain } = calculateEqualPowerGains(0.5, 0.46);
    expect(outgoingGain).toBeCloseTo(0.46 * Math.SQRT1_2, 4);
    expect(incomingGain).toBeCloseTo(0.46 * Math.SQRT1_2, 4);
  });
});

describe("CrossfadeController channel transitions and mute behavior", () => {
  class MockChannel {
    volume = 1;
    muted = false;
    stopped = false;
    playing = false;

    setVolume(v: number) { this.volume = v; }
    setMuted(m: boolean) { this.muted = m; }
    stop() { this.stopped = true; this.playing = false; }
    play() { this.playing = true; }
  }

  test("modulates channel volumes over 1.5s equal-power curve and cleans up outgoing channel", () => {
    const outgoing = new MockChannel();
    const incoming = new MockChannel();
    outgoing.volume = 0.46;

    const controller = new CrossfadeController(outgoing, { baseVolume: 0.46, durationMs: 1500 });
    controller.startCrossfade(incoming);

    expect(controller.isCrossfading()).toBe(true);
    expect(incoming.playing).toBe(true);
    expect(incoming.volume).toBeCloseTo(0, 4);
    expect(outgoing.volume).toBeCloseTo(0.46, 4);

    // Halfway through: 750ms (p = 0.5)
    controller.update(750);
    expect(outgoing.volume).toBeCloseTo(0.46 * Math.SQRT1_2, 3);
    expect(incoming.volume).toBeCloseTo(0.46 * Math.SQRT1_2, 3);
    expect(outgoing.stopped).toBe(false);

    // Complete: another 750ms (p = 1.0)
    const finished = controller.update(750);
    expect(finished).toBe(true);
    expect(controller.isCrossfading()).toBe(false);
    expect(outgoing.volume).toBeCloseTo(0, 4);
    expect(incoming.volume).toBeCloseTo(0.46, 4);
    expect(outgoing.stopped).toBe(true);
  });

  test("reliably mutes and unmutes both active and transitioning channels without leaking sound", () => {
    const outgoing = new MockChannel();
    const incoming = new MockChannel();

    const controller = new CrossfadeController(outgoing, { baseVolume: 0.46, durationMs: 1500 });
    controller.startCrossfade(incoming);

    // At midpoint
    controller.update(750);

    // Grown-up Corner mutes sound
    controller.setMuted(true);
    expect(outgoing.muted).toBe(true);
    expect(incoming.muted).toBe(true);
    expect(outgoing.volume).toBe(0);
    expect(incoming.volume).toBe(0);

    // Unmute restores gains according to current progress without leaking full volume
    controller.setMuted(false);
    expect(outgoing.muted).toBe(false);
    expect(incoming.muted).toBe(false);
    expect(outgoing.volume).toBeCloseTo(0.46 * Math.SQRT1_2, 3);
    expect(incoming.volume).toBeCloseTo(0.46 * Math.SQRT1_2, 3);
  });
});

