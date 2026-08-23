/**
 * PROTOTYPE — THROWAWAY CODE. DO NOT SHIP.
 *
 * Answers the ADR-0009 visual question: does Rosalia's Rose Garden read as
 * clearly prettier when the Flight Presentation is composed from a full-Stage
 * Place Illustration plus the approved Princess Rosie-and-Stella cutout,
 * instead of the primitive procedural scenery and primitive character drawing?
 *
 * Scope is deliberately narrow (ADR-0009): flight launch -> Rosalia's Rose
 * Garden -> its first Birthday Star Moment. Later places keep their existing
 * procedural presentation so the journey still runs past the first star.
 *
 * Hard constraints honoured here:
 *  - The independently authored Arcade body stays on the player CONTAINER and
 *    is never derived from the cutout's 1536x1024 transparent canvas. This
 *    module only ever adds a child image inside that container.
 *  - The Place Illustration is a full-Stage, camera-fixed painting that changes
 *    beneath Birthday Star Moments. It is never stretched into a scrolling
 *    panorama, and it is always scaled uniformly (never non-uniformly).
 *
 * Media are the committed, owner-approved canonical bytes from
 * feature/godot-production-edition (see shared/edition/source-media/flight/).
 */
import Phaser from "phaser";

export const PROTOTYPE_TEXTURES = {
  illustration: "prototype-rose-garden-illustration",
  cutout: "prototype-rosie-stella-cutout",
} as const;

const ILLUSTRATION_URL = "/assets/prototype/rose-garden-illustration.png";
const CUTOUT_URL = "/assets/prototype/rosie-stella-cutout.png";

/** Measured from the canonical PNG's alpha channel (stable for alpha >= 32). */
const CUTOUT_CANVAS = { width: 1536, height: 1024 } as const;
const CUTOUT_SILHOUETTE = { x: 168, y: 109, width: 872, height: 823 } as const;
/**
 * Where Stella's torso sits inside the canvas, eyeballed from the artwork.
 * Used to line the cutout up with the pre-existing Arcade body rather than
 * moving the body to suit the art.
 */
const CUTOUT_TORSO_CENTRE = { x: 785, y: 557 } as const;

export type FlightVariant = "before" | "after";

export interface PrototypeOptions {
  variant: FlightVariant;
  /** On-screen width of the cutout's full silhouette box, in Stage pixels. */
  characterWidth: number;
  /** 0 = perfectly still painting, 1 = scrolls with the world. */
  parallax: number;
  /** Restrained engine-native motion on the whole cutout. */
  motion: boolean;
  /** Show the Arcade body so the owner can judge Playful Bump fairness. */
  debugBodies: boolean;
}

const DEFAULTS: PrototypeOptions = {
  variant: "after",
  characterWidth: 300,
  parallax: 0.05,
  motion: true,
  debugBodies: false,
};

export function readPrototypeOptions(search: string = window.location.search): PrototypeOptions {
  const params = new URLSearchParams(search);
  const number = (key: string, fallback: number): number => {
    const raw = params.get(key);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? value : fallback;
  };
  const flag = (key: string, fallback: boolean): boolean => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    return raw !== "0" && raw !== "false";
  };
  return {
    variant: params.get("flight") === "before" ? "before" : DEFAULTS.variant,
    characterWidth: number("character", DEFAULTS.characterWidth),
    parallax: number("parallax", DEFAULTS.parallax),
    motion: flag("motion", DEFAULTS.motion),
    debugBodies: flag("bodies", DEFAULTS.debugBodies),
  };
}

export function preloadPrototypeMedia(scene: Phaser.Scene): void {
  scene.load.image(PROTOTYPE_TEXTURES.illustration, ILLUSTRATION_URL);
  scene.load.image(PROTOTYPE_TEXTURES.cutout, CUTOUT_URL);
}

/**
 * The full-Stage Place Illustration. Uniform cover scale plus a small overscan
 * so the very slow drift never exposes an edge — seamless, unstretched.
 */
export function addPlaceIllustration(
  scene: Phaser.Scene,
  options: PrototypeOptions,
  stage: { width: number; height: number },
): Phaser.GameObjects.Image {
  const source = scene.textures.get(PROTOTYPE_TEXTURES.illustration).getSourceImage();
  const cover = Math.max(stage.width / source.width, stage.height / source.height);
  const overscan = 1 + Math.max(options.parallax, 0) * 2.4;
  const illustration = scene.add
    .image(stage.width / 2, stage.height / 2, PROTOTYPE_TEXTURES.illustration)
    .setOrigin(.5)
    .setScale(cover * overscan)
    .setScrollFactor(options.parallax, 0)
    .setDepth(-40);

  if (options.motion) {
    // Restrained: a barely perceptible breath, not a pan.
    scene.tweens.add({
      targets: illustration,
      scale: cover * overscan * 1.012,
      duration: 9000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
  return illustration;
}

/**
 * Adds the approved cutout INSIDE the caller's player container.
 * The container's Arcade body is untouched by design.
 */
export function addCharacterCutout(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Container,
  options: PrototypeOptions,
  /** Centre of the independently authored Arcade body, in container space. */
  bodyCentre: { x: number; y: number },
): Phaser.GameObjects.Image {
  const scale = options.characterWidth / CUTOUT_SILHOUETTE.width;
  const cutout = scene.add
    .image(bodyCentre.x, bodyCentre.y, PROTOTYPE_TEXTURES.cutout)
    .setOrigin(CUTOUT_TORSO_CENTRE.x / CUTOUT_CANVAS.width, CUTOUT_TORSO_CENTRE.y / CUTOUT_CANVAS.height)
    .setScale(scale);
  player.add(cutout);

  if (options.motion) {
    // Whole-cutout motion only — no purpose-made animation layers (ADR-0009).
    scene.tweens.add({
      targets: cutout,
      y: bodyCentre.y - 7,
      duration: 1150,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
  return cutout;
}

/** Floating prototype bar. Reloads with the chosen search params. */
export function mountPrototypeBar(options: PrototypeOptions): void {
  const apply = (changes: Partial<PrototypeOptions>): void => {
    const next = { ...options, ...changes };
    const params = new URLSearchParams();
    params.set("flight", next.variant);
    params.set("character", String(Math.round(next.characterWidth)));
    params.set("parallax", String(next.parallax));
    params.set("motion", next.motion ? "1" : "0");
    params.set("bodies", next.debugBodies ? "1" : "0");
    window.location.search = params.toString();
  };

  const bar = document.createElement("div");
  bar.id = "prototype-bar";
  bar.innerHTML = `
    <strong>PROTOTYPE</strong>
    <span class="group">
      <button data-variant="before"${options.variant === "before" ? " class='on'" : ""}>Before</button>
      <button data-variant="after"${options.variant === "after" ? " class='on'" : ""}>After</button>
    </span>
    <label>Character <input id="p-character" type="range" min="180" max="460" step="10" value="${options.characterWidth}"><b>${Math.round(options.characterWidth)}px</b></label>
    <label>Drift <input id="p-parallax" type="range" min="0" max="0.3" step="0.01" value="${options.parallax}"><b>${options.parallax}</b></label>
    <button data-toggle="motion"${options.motion ? " class='on'" : ""}>Motion</button>
    <button data-toggle="bodies"${options.debugBodies ? " class='on'" : ""}>Bounds</button>
    <span class="state"></span>
  `;
  document.body.append(bar);

  bar.querySelectorAll<HTMLButtonElement>("button[data-variant]").forEach((button) => {
    button.addEventListener("click", () => apply({ variant: button.dataset.variant as FlightVariant }));
  });
  bar.querySelector<HTMLButtonElement>("button[data-toggle='motion']")
    ?.addEventListener("click", () => apply({ motion: !options.motion }));
  bar.querySelector<HTMLButtonElement>("button[data-toggle='bodies']")
    ?.addEventListener("click", () => apply({ debugBodies: !options.debugBodies }));
  bar.querySelector<HTMLInputElement>("#p-character")
    ?.addEventListener("change", (event) => apply({ characterWidth: Number((event.target as HTMLInputElement).value) }));
  bar.querySelector<HTMLInputElement>("#p-parallax")
    ?.addEventListener("change", (event) => apply({ parallax: Number((event.target as HTMLInputElement).value) }));

  // Surface the full prototype state, per prototype discipline.
  const state = bar.querySelector<HTMLElement>(".state");
  if (state) state.textContent = JSON.stringify(options);
}
