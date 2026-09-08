import Phaser from "phaser";
import { registerSW } from "virtual:pwa-register";

import "./style.css";
import { OPENING_STORYBOOK_MOMENTS_AFTER_COVER, STOP_STORIES, type StopStory } from "./game/content";
import { getPlaceLayers } from "./domain/scenery";
import { GAME_SIZE, RosieGameScene } from "./game/RosieGameScene";
import { GameAudio } from "./game/sound";
import { createRunnerState } from "./domain/gallop-and-flutter";
import { createJourney, resetJourney, SCATTERED_STAR_STOPS } from "./domain/journey";
import {
  cancelGrownUpHold,
  closeGrownUpCorner,
  createGrownUpCornerState,
  startGrownUpHold,
  triggerTwoFingerTap,
  updateGrownUpHold,
  type GrownUpCornerState,
} from "./domain/grown-up-corner";
import {
  advanceToAlbum,
  createFinaleState,
  returnToCelebration,
  type FinaleState,
} from "./domain/finale";

export interface RosieRunnerInterface {
  getState: () => import("./domain/gallop-and-flutter").RunnerState;
  getJourney: () => import("./domain/journey").Journey;
  seekToEnd: () => void;
  isReady?: () => boolean;
  isPaused?: () => boolean;
  hasPuppet?: () => boolean;
  hasSpriteSheet?: () => boolean;
  getCurrentAnimation?: () => string | undefined;
  triggerStumble?: () => void;
  getObstacles?: () => readonly import("./domain/gallop-and-flutter").PlayfulObstacle[];
  getSpringboards?: () => readonly import("./domain/gallop-and-flutter").Springboard[];
  getSparkles?: () => readonly import("./domain/gallop-and-flutter").StarSparkle[];
  getCollectedSparklesCount?: () => number;
  getSparkleStreak?: () => number;
  getMaxSparkleStreak?: () => number;
  getArchway?: (stopId?: import("./domain/journey").StarStop) => import("./domain/gallop-and-flutter").RainbowArchway | undefined;
  isGuestWaving?: (stopId?: import("./domain/journey").StarStop) => boolean;
  isGuestCutout?: (stopId?: import("./domain/journey").StarStop) => boolean;
  getAcquiredStamps?: () => readonly import("./domain/journey").StarStop[];
  getCurrentStopIndex?: () => number;
  hasPlaceIllustration?: (stopId: import("./domain/journey").StarStop) => boolean;
  getPlaceIllustrationDisplaySize?: () => { width: number; height: number } | undefined;
  getPlaceLayers?: (
    stopId?: import("./domain/journey").StarStop
  ) =>
    | readonly import("./domain/scenery").SceneryLayer[]
    | Record<import("./domain/journey").StarStop, readonly import("./domain/scenery").SceneryLayer[]>;
  getScenePlaceObjects?: () => {
    place: import("./domain/journey").StarStop;
    obstacles: readonly import("./domain/gallop-and-flutter").PlayfulObstacle[];
    springboards: readonly import("./domain/gallop-and-flutter").Springboard[];
    sparkles: readonly import("./domain/gallop-and-flutter").StarSparkle[];
    archway?: import("./domain/gallop-and-flutter").RainbowArchway;
    guest?: import("./domain/journey").FamilyGuest;
    displayedSize?: { width: number; height: number };
    layers?: readonly import("./domain/scenery").SceneryLayer[];
    activeLayers?: readonly { depth: import("./domain/scenery").SceneryLayerDepth; depthFactor: number; x: number }[];
  } | undefined;
  getActiveSceneryLayers?: () => readonly { depth: import("./domain/scenery").SceneryLayerDepth; depthFactor: number; x: number }[];
  getGrownUpCornerState?: () => GrownUpCornerState;
  getFinaleState?: () => FinaleState;
  resetJourney?: () => import("./domain/journey").Journey;
  flyAgain?: () => void;
  getActiveFlightTrack?: () => import("./domain/soundtrack-rotation").FlightSoundtrack;
  isAudioCelebrating?: () => boolean;

  isAudioCrossfading?: () => boolean;
  getAudioPlaylistState?: () => import("./domain/soundtrack-rotation").SoundtrackPlaylistState;
  isAudioEnabled?: () => boolean;
}


declare global {
  interface Window {
    __ROSIE_RUNNER__?: RosieRunnerInterface;
  }
}

const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
};

const storybook = getElement<HTMLElement>("storybook");
const gameShell = getElement<HTMLElement>("game-shell");
const ending = getElement<HTMLElement>("ending");
const storyTitle = getElement<HTMLElement>("story-title");
const storyCopy = getElement<HTMLElement>("story-copy");
const eyebrow = getElement<HTMLElement>("eyebrow");
const storyNext = getElement<HTMLButtonElement>("story-next");
const pageDots = getElement<HTMLElement>("page-dots");
const moment = getElement<HTMLElement>("moment");
const momentPlace = getElement<HTMLElement>("moment-place");
const momentCopy = getElement<HTMLElement>("moment-copy");
const momentIcon = getElement<HTMLElement>("moment-icon");
const momentNext = getElement<HTMLButtonElement>("moment-next");
const cloudRest = getElement<HTMLElement>("cloud-rest");
const restNext = getElement<HTMLButtonElement>("rest-next");
const grownUpButton = getElement<HTMLButtonElement>("grown-up-corner-button");
const grownUpMeter = document.getElementById("grown-up-meter") as SVGCircleElement | null;
const grownUpDialog = getElement<HTMLElement>("grown-up-dialog");
const grownUpSoundToggle = getElement<HTMLButtonElement>("grown-up-sound-toggle");
const grownUpSoundLabel = getElement<HTMLElement>("grown-up-sound-label");
const grownUpRestartButton = getElement<HTMLButtonElement>("grown-up-restart-button");
const grownUpResumeButton = getElement<HTMLButtonElement>("grown-up-resume-button");
const flyAgainButton = getElement<HTMLButtonElement>("fly-again-button");
const celebrationCue = getElement<HTMLButtonElement>("celebration-cue");
const celebrationAlbumModal = getElement<HTMLElement>("celebration-album-modal");
const celebrationModalBackdrop = getElement<HTMLElement>("celebration-modal-backdrop");
const albumBackButton = getElement<HTMLButtonElement>("album-back-button");
const celebrationAlbumGrid = getElement<HTMLElement>("celebration-album-grid");
const albumPreviewIcon = getElement<HTMLElement>("album-preview-icon");
const albumPreviewTitle = getElement<HTMLElement>("album-preview-title");
const albumPreviewGuest = getElement<HTMLElement>("album-preview-guest");
const albumPreviewDesc = getElement<HTMLElement>("album-preview-desc");
const soundButtons = [getElement<HTMLButtonElement>("sound-toggle"), grownUpSoundToggle];
const storyArtworks = Array.from(storybook.querySelectorAll<HTMLImageElement>(".storybook__art"));
const sound = new GameAudio();

let finaleState: FinaleState = createFinaleState();

let grownUpCornerState: GrownUpCornerState = createGrownUpCornerState();
let holdRafId: number | undefined;
let lastHoldTime = 0;
const HOLD_RING_CIRCUMFERENCE = 94.25;

let openingMomentIndex = 0;
let visibleStoryArtworkIndex = 0;
let scene: RosieGameScene | undefined;
let phaserGame: Phaser.Game | undefined;
let finalStarWaiting = false;

const storyArtworkLoads = new Map<string, Promise<boolean>>();

function getStoryArtwork(index: number): HTMLImageElement {
  const artwork = storyArtworks[index];
  if (!artwork) throw new Error(`Missing story artwork layer ${index}`);
  return artwork;
}

function preloadStoryArtwork(src: string): Promise<boolean> {
  const existing = storyArtworkLoads.get(src);
  if (existing) return existing;

  const load = new Promise<boolean>((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(true), { once: true });
    image.addEventListener("error", () => resolve(false), { once: true });
    image.src = src;
  });
  storyArtworkLoads.set(src, load);
  return load;
}

async function transitionStoryArtwork(src: string, position: string, expectedMomentIndex: number): Promise<void> {
  if (!await preloadStoryArtwork(src) || openingMomentIndex !== expectedMomentIndex) return;

  const nextArtworkIndex = visibleStoryArtworkIndex === 0 ? 1 : 0;
  const nextArtwork = getStoryArtwork(nextArtworkIndex);
  nextArtwork.src = src;
  nextArtwork.style.objectPosition = position;
  try {
    await nextArtwork.decode();
  } catch {
    return;
  }
  if (openingMomentIndex !== expectedMomentIndex) return;

  getStoryArtwork(visibleStoryArtworkIndex).classList.remove("is-visible");
  nextArtwork.classList.add("is-visible");
  visibleStoryArtworkIndex = nextArtworkIndex;
}

function renderDots(): void {
  pageDots.replaceChildren(...Array.from({ length: OPENING_STORYBOOK_MOMENTS_AFTER_COVER.length + 1 }, (_, index) => {
    const dot = document.createElement("span");
    if (index === openingMomentIndex) dot.className = "active";
    return dot;
  }));
  pageDots.setAttribute("aria-label", `Story page ${openingMomentIndex + 1} of ${OPENING_STORYBOOK_MOMENTS_AFTER_COVER.length + 1}`);
}

function renderOpeningStorybookMoment(): void {
  renderDots();
  if (openingMomentIndex === 0) return;
  const momentContent = OPENING_STORYBOOK_MOMENTS_AFTER_COVER[openingMomentIndex - 1];
  if (!momentContent) return;
  eyebrow.textContent = momentContent.eyebrow;
  storyTitle.textContent = momentContent.title;
  storyCopy.textContent = momentContent.copy;
  void transitionStoryArtwork(momentContent.image, momentContent.imagePosition, openingMomentIndex);
  const buttonText = storyNext.querySelector("span");
  if (buttonText) buttonText.textContent = openingMomentIndex === OPENING_STORYBOOK_MOMENTS_AFTER_COVER.length ? "Fly with Rosie" : "Turn the page";
}

function advanceStory(): void {
  void sound.start();
  sound.play("button");
  if (openingMomentIndex < OPENING_STORYBOOK_MOMENTS_AFTER_COVER.length) {
    openingMomentIndex += 1;
    renderOpeningStorybookMoment();
    return;
  }
  startGame();
}


function startGame(): void {
  storybook.hidden = true;
  ending.hidden = true;
  gameShell.hidden = false;
  updateStars(0);
  updateConstellationMeter(0);
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = undefined;
  }
  const gameContainer = document.getElementById("game");
  if (gameContainer) gameContainer.replaceChildren();
  scene = new RosieGameScene({
    onBirthdayStar: showBirthdayStar,
    onStarGatherChime: () => sound.play("star"),
    onStorybookStampAwarded: (stop) => {
      sound.play("stamp");
      if (stop.id === "castle") {
        sound.play("chime");
      }
    },
    onStumble: () => sound.play("stumble"),
    onNearMiss: () => sound.play("near-miss"),
    onSpringboard: () => sound.play("chime"),
    onSparkleGathered: (_sparkle, streak, totalCount) => {
      sound.playSparkle(streak - 1);
      updateConstellationMeter(totalCount);
    },
    onCloudRest: showCloudRest,
    onCelebration: showEnding,
  });
  phaserGame = new Phaser.Game({
    type: import.meta.env.VITE_PHASER_CANVAS === "1" ? Phaser.CANVAS : Phaser.AUTO,
    parent: "game",
    width: GAME_SIZE.width,
    height: GAME_SIZE.height,
    backgroundColor: "#8bd8f1",
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_SIZE.width, height: GAME_SIZE.height },
    render: { antialias: true, roundPixels: false },
    scene: [scene],
  });
}

function showBirthdayStar(stop: StopStory, count: number, isFinal: boolean): void {
  updateStars(count);
  finalStarWaiting = isFinal;
  momentPlace.textContent = stop.place;
  momentCopy.textContent = stop.moment;
  momentIcon.textContent = stop.icon;

  const momentPath = document.getElementById("moment-path");
  if (momentPath) {
    momentPath.hidden = stop.id === "castle";
  }

  const stampIcon = document.getElementById("moment-stamp-icon");
  if (stampIcon) stampIcon.textContent = stop.stamp.icon;
  const stampTitle = document.getElementById("moment-stamp-title");
  if (stampTitle) stampTitle.textContent = stop.stamp.title;
  const stampGuest = document.getElementById("moment-stamp-guest");
  if (stampGuest) stampGuest.textContent = `Presented by ${stop.guest}`;

  const stampCard = document.getElementById("moment-stamp");
  if (stampCard) {
    stampCard.setAttribute("data-stamp", stop.id);
    stampCard.setAttribute("aria-label", `${stop.stamp.title} awarded by ${stop.guest}`);
  }

  momentNext.innerHTML = isFinal ? "To the celebration <b aria-hidden=\"true\">★</b>" : "Keep flying <b aria-hidden=\"true\">→</b>";
  moment.hidden = false;
  window.setTimeout(() => momentNext.focus(), 80);
}

function continueFromMoment(): void {
  sound.play("button");
  scene?.continueAfterBirthdayStar();
  moment.hidden = true;
  if (!finalStarWaiting) getElement<HTMLElement>("game").focus();
}

function showCloudRest(): void {
  sound.play("rest");
  cloudRest.hidden = false;
  window.setTimeout(() => restNext.focus(), 80);
}

function continueFromCloudRest(): void {
  sound.play("button");
  cloudRest.hidden = true;
  scene?.continueAfterCloudRest();
}

function updateStars(count: number): void {
  const tracker = getElement<HTMLElement>("star-tracker");
  const scatteredStars = tracker.querySelectorAll<HTMLElement>(".star:not(.star--castle)");
  scatteredStars.forEach((star, index) => star.classList.toggle("is-lit", index < count));
  const castleStar = tracker.querySelector<HTMLElement>(".star--castle");
  if (castleStar) castleStar.classList.add("is-lit");
  tracker.setAttribute("aria-label", `${count} of ${SCATTERED_STAR_STOPS.length} scattered Stars recovered · Castle Star safe`);
}

function updateConstellationMeter(count: number): void {
  const meter = document.getElementById("constellation-meter");
  if (!meter) return;
  meter.setAttribute("data-sparkles", String(count));
  meter.setAttribute("aria-label", `Constellation light meter: ${count} Star Sparkles gathered`);
  if (count > 0) {
    meter.classList.add("has-light");
    meter.classList.remove("is-sparkling");
    void meter.offsetWidth;
    meter.classList.add("is-sparkling");
  } else {
    meter.classList.remove("has-light", "is-sparkling");
  }
  const nodes = meter.querySelectorAll<HTMLElement>(".constellation-node");
  const litCount = count === 0 ? 0 : ((count - 1) % nodes.length) + 1;
  nodes.forEach((node, index) => {
    node.classList.toggle("is-lit", index < litCount);
  });
}

function updateAlbumPreview(stop: StopStory): void {
  albumPreviewIcon.textContent = stop.stamp.icon;
  albumPreviewTitle.textContent = stop.stamp.title;
  albumPreviewGuest.textContent = `Presented by ${stop.guest}`;
  albumPreviewDesc.textContent = stop.stamp.description;
}

function renderCelebrationAlbum(): void {
  const acquired = scene?.getAcquiredStamps() ?? [];
  const earnedStops = STOP_STORIES.filter((stop) => acquired.length === 0 || acquired.includes(stop.id));
  celebrationAlbumGrid.replaceChildren(
    ...earnedStops.map((stop, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "album-stamp-item";
      button.setAttribute("data-stamp-id", stop.id);
      button.setAttribute("aria-label", `${stop.stamp.title} awarded by ${stop.guest}`);
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      if (index === 0) {
        button.classList.add("is-active");
        updateAlbumPreview(stop);
      }

      const icon = document.createElement("span");
      icon.className = "album-stamp-item__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = stop.stamp.icon;

      const guest = document.createElement("span");
      guest.className = "album-stamp-item__guest";
      guest.textContent = stop.guest;

      button.append(icon, guest);
      button.addEventListener("click", () => {
        sound.play("stamp");
        celebrationAlbumGrid.querySelectorAll(".album-stamp-item").forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-selected", "false");
        });
        button.classList.add("is-active");
        button.setAttribute("aria-selected", "true");
        updateAlbumPreview(stop);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          button.click();
        }
      });
      return button;
    })
  );
}

function renderCelebrationConstellation(): void {
  const constellation = document.getElementById("celebration-constellation");
  if (!constellation) return;
  const castleStar = constellation.querySelector<HTMLElement>(".constellation-star--castle");
  if (castleStar) castleStar.classList.add("is-lit");

  const stars = constellation.querySelectorAll<HTMLElement>(".constellation-star:not(.constellation-star--castle)");
  stars.forEach((star, index) => {
    star.classList.remove("is-lit", "is-joining");
    window.setTimeout(() => {
      star.classList.add("is-lit", "is-joining");
      sound.playSparkle(index % 5);
    }, 100 + index * 100);
  });
}

function updateFinaleUi(): void {
  ending.setAttribute("data-beat", finaleState.beat);
  if (finaleState.beat === "celebration-view") {
    celebrationAlbumModal.hidden = true;
    celebrationCue.hidden = false;
    window.setTimeout(() => celebrationCue.focus(), 60);
  } else {
    celebrationAlbumModal.hidden = false;
    celebrationCue.hidden = true;
    window.setTimeout(() => albumBackButton.focus(), 80);
  }
}

function openCelebrationAlbum(): void {
  if (finaleState.beat === "album-view") return;
  sound.play("button");
  celebrationAlbumModal.classList.remove("is-dismissing");
  finaleState = advanceToAlbum(finaleState);
  updateFinaleUi();
}

function dismissAlbumToCelebration(): void {
  if (finaleState.beat === "celebration-view" || celebrationAlbumModal.classList.contains("is-dismissing")) return;
  sound.play("button");
  celebrationAlbumModal.classList.add("is-dismissing");
  window.setTimeout(() => {
    celebrationAlbumModal.classList.remove("is-dismissing");
    finaleState = returnToCelebration(finaleState);
    updateFinaleUi();
  }, 180);
}

function flyAgain(): void {
  sound.play("button");
  celebrationAlbumModal.classList.remove("is-dismissing");
  finaleState = createFinaleState();
  void sound.advanceToNextJourney();
  if (scene) {
    scene.resetJourney();
  }
  ending.hidden = true;
  moment.hidden = true;
  cloudRest.hidden = true;
  gameShell.hidden = false;
  updateStars(0);
  updateConstellationMeter(0);
  startGame();
}

function showEnding(): void {
  gameShell.hidden = true;
  ending.hidden = false;
  celebrationAlbumModal.classList.remove("is-dismissing");
  finaleState = createFinaleState();
  updateFinaleUi();
  sound.play("celebrate");
  void sound.crossfadeToCelebration();
  burstConfetti(260);
  renderCelebrationConstellation();
  renderCelebrationAlbum();
}


function toggleSound(): void {
  sound.setEnabled(!sound.isEnabled());
  updateSoundUi();
  if (sound.isEnabled()) void sound.start();
}

function updateSoundUi(): void {
  const isEnabled = sound.isEnabled();
  soundButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(isEnabled));
    button.setAttribute("aria-label", isEnabled ? "Turn sound off" : "Turn sound on");
  });
  const coverSound = getElement<HTMLButtonElement>("sound-toggle");
  coverSound.textContent = isEnabled ? "♪" : "×";
  grownUpSoundLabel.textContent = isEnabled ? "Sound is on" : "Sound is muted";
  const grownUpIcon = grownUpSoundToggle.querySelector("b");
  if (grownUpIcon) grownUpIcon.textContent = isEnabled ? "♪" : "×";
}

function burstConfetti(count: number): void {
  const canvas = getElement<HTMLCanvasElement>("confetti");
  const context = canvas.getContext("2d");
  if (!context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  context.scale(ratio, ratio);
  const colors = ["#e94f9b", "#ffd45a", "#8e71cf", "#60c5e6", "#6dcc8e", "#fff3f8"];
  const kinds = ["confetti", "confetti", "confetti", "rose", "spark"] as const;
  const pieces = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight * .4,
    vx: (Math.random() - .5) * 4,
    vy: 2.5 + Math.random() * 5,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - .5) * .25,
    size: 5 + Math.random() * 9,
    color: colors[Math.floor(Math.random() * colors.length)] ?? "#ffd45a",
    kind: kinds[Math.floor(Math.random() * kinds.length)] ?? "confetti",
  }));
  const fireworks = Array.from({ length: 7 }, (_, index) => ({
    x: window.innerWidth * (.1 + Math.random() * .8),
    y: window.innerHeight * (.08 + Math.random() * .38),
    delay: 220 + index * 520,
    color: colors[index % colors.length] ?? "#ffd45a",
  }));
  const started = performance.now();
  const frame = (now: number): void => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const elapsed = now - started;
    fireworks.forEach((firework) => {
      const progress = (elapsed - firework.delay) / 900;
      if (progress < 0 || progress > 1) return;
      const radius = 12 + progress * 82;
      context.save();
      context.globalAlpha = 1 - progress;
      context.strokeStyle = firework.color;
      context.lineWidth = 3;
      context.translate(firework.x, firework.y);
      context.beginPath();
      for (let ray = 0; ray < 14; ray += 1) {
        const angle = ray * Math.PI * 2 / 14;
        context.moveTo(Math.cos(angle) * radius * .42, Math.sin(angle) * radius * .42);
        context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      context.stroke();
      context.restore();
    });
    pieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += .035;
      piece.rotation += piece.spin;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      if (piece.kind === "rose") {
        context.beginPath();
        for (let petal = 0; petal < 5; petal += 1) {
          const angle = petal * Math.PI * 2 / 5;
          context.moveTo(Math.cos(angle) * piece.size * .25, Math.sin(angle) * piece.size * .25);
          context.arc(Math.cos(angle) * piece.size * .38, Math.sin(angle) * piece.size * .38, piece.size * .28, 0, Math.PI * 2);
        }
        context.fill();
      } else if (piece.kind === "spark") {
        context.strokeStyle = piece.color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-piece.size, 0); context.lineTo(piece.size, 0);
        context.moveTo(0, -piece.size); context.lineTo(0, piece.size);
        context.stroke();
      } else {
        context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .65);
      }
      context.restore();
    });
    if (now - started < 7000) requestAnimationFrame(frame);
    else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
  requestAnimationFrame(frame);
}

function updateHoldMeter(): void {
  if (grownUpMeter) {
    grownUpMeter.style.strokeDashoffset = String(HOLD_RING_CIRCUMFERENCE * (1 - grownUpCornerState.holdProgress));
  }
}

function stopHoldLoop(): void {
  if (holdRafId !== undefined) {
    cancelAnimationFrame(holdRafId);
    holdRafId = undefined;
  }
}

function openGrownUpCorner(): void {
  stopHoldLoop();
  grownUpButton.classList.remove("is-holding");
  grownUpButton.setAttribute("aria-expanded", "true");
  grownUpDialog.hidden = false;
  scene?.pause();
  updateSoundUi();
  window.setTimeout(() => grownUpResumeButton.focus(), 80);
}

function closeGrownUpCornerDialog(): void {
  stopHoldLoop();
  grownUpCornerState = closeGrownUpCorner(grownUpCornerState);
  grownUpButton.classList.remove("is-holding");
  grownUpButton.setAttribute("aria-expanded", "false");
  grownUpDialog.hidden = true;
  updateHoldMeter();
  scene?.resume();
}

function startHoldLoop(): void {
  stopHoldLoop();
  lastHoldTime = performance.now();
  const tick = (now: number): void => {
    if (!grownUpCornerState.isHolding) return;
    const delta = now - lastHoldTime;
    lastHoldTime = now;
    const update = updateGrownUpHold(grownUpCornerState, delta);
    grownUpCornerState = update.state;
    updateHoldMeter();
    if (update.triggered) {
      openGrownUpCorner();
    } else {
      holdRafId = requestAnimationFrame(tick);
    }
  };
  holdRafId = requestAnimationFrame(tick);
}

function onGrownUpPointerDown(event: PointerEvent): void {
  event.preventDefault();
  event.stopPropagation();
  try {
    grownUpButton.setPointerCapture(event.pointerId);
  } catch {
    // Ignore pointer capture errors
  }
  grownUpCornerState = startGrownUpHold(grownUpCornerState);
  grownUpButton.classList.add("is-holding");
  startHoldLoop();
}

function onGrownUpPointerUp(event?: PointerEvent): void {
  if (event) {
    try {
      if (grownUpButton.hasPointerCapture(event.pointerId)) {
        grownUpButton.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore
    }
  }
  stopHoldLoop();
  grownUpButton.classList.remove("is-holding");
  grownUpCornerState = cancelGrownUpHold(grownUpCornerState);
  updateHoldMeter();
}

function restartJourney(): void {
  sound.play("button");
  closeGrownUpCornerDialog();
  celebrationAlbumModal.classList.remove("is-dismissing");
  finaleState = createFinaleState();
  gameShell.hidden = true;
  moment.hidden = true;
  cloudRest.hidden = true;
  ending.hidden = true;
  storybook.hidden = false;
  openingMomentIndex = 0;
  renderOpeningStorybookMoment();
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = undefined;
  }
  scene = undefined;
}

storyNext.addEventListener("click", () => void advanceStory());
momentNext.addEventListener("click", continueFromMoment);
restNext.addEventListener("click", continueFromCloudRest);
soundButtons.forEach((button) => button.addEventListener("click", toggleSound));
flyAgainButton.addEventListener("click", flyAgain);
celebrationCue.addEventListener("click", (event) => {
  event.stopPropagation();
  openCelebrationAlbum();
});
albumBackButton.addEventListener("click", (event) => {
  event.stopPropagation();
  dismissAlbumToCelebration();
});
celebrationModalBackdrop.addEventListener("click", (event) => {
  event.stopPropagation();
  dismissAlbumToCelebration();
});
ending.addEventListener("click", () => {
  if (finaleState.beat === "celebration-view") {
    openCelebrationAlbum();
  }
});

grownUpButton.addEventListener("pointerdown", onGrownUpPointerDown);
grownUpButton.addEventListener("pointerup", onGrownUpPointerUp);
grownUpButton.addEventListener("pointercancel", onGrownUpPointerUp);
grownUpButton.addEventListener("pointerleave", (e) => {
  if (!grownUpButton.hasPointerCapture(e.pointerId)) {
    onGrownUpPointerUp(e);
  }
});
grownUpButton.addEventListener("touchstart", (event) => {
  if (event.targetTouches.length >= 2) {
    event.preventDefault();
    event.stopPropagation();
    grownUpCornerState = triggerTwoFingerTap(grownUpCornerState);
    updateHoldMeter();
    openGrownUpCorner();
  }
}, { passive: false });
grownUpButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
});

grownUpResumeButton.addEventListener("click", () => {
  sound.play("button");
  closeGrownUpCornerDialog();
});
grownUpRestartButton.addEventListener("click", restartJourney);

const activeStagePointers = new Set<number>();
gameShell.addEventListener("pointerdown", (event) => {
  if ((event.target as HTMLElement).closest("button, .moment, .grown-up-dialog")) return;
  activeStagePointers.add(event.pointerId);
  const canvas = gameShell.querySelector("canvas");
  if (event.target !== canvas) {
    scene?.jumpInput();
  }
  scene?.setTouchHeld(true);
});

window.addEventListener("pointerup", (event) => {
  activeStagePointers.delete(event.pointerId);
  if (activeStagePointers.size === 0) {
    scene?.setTouchHeld(false);
  }
});

window.addEventListener("pointercancel", (event) => {
  activeStagePointers.delete(event.pointerId);
  if (activeStagePointers.size === 0) {
    scene?.setTouchHeld(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat) return;
  if (!grownUpDialog.hidden) return;
  if (!moment.hidden) { event.preventDefault(); continueFromMoment(); }
  else if (!cloudRest.hidden) { event.preventDefault(); continueFromCloudRest(); }
  else if (!ending.hidden) {
    if (finaleState.beat === "celebration-view") {
      event.preventDefault();
      openCelebrationAlbum();
    }
  }
});

window.__ROSIE_RUNNER__ = {
  getState: () => scene?.getRunnerState() ?? createRunnerState(),
  getJourney: () => scene?.getJourney() ?? createJourney(),
  seekToEnd: () => scene?.seekToEnd(),
  isReady: () => scene?.isReady() ?? false,
  isPaused: () => scene?.isPaused() ?? false,
  hasPuppet: () => scene?.hasPuppet() ?? false,
  hasSpriteSheet: () => scene?.hasSpriteSheet() ?? false,
  getCurrentAnimation: () => scene?.getCurrentAnimation(),
  triggerStumble: () => scene?.triggerStumble(),
  getObstacles: () => scene?.getObstacles() ?? [],
  getSpringboards: () => scene?.getSpringboards() ?? [],
  getSparkles: () => scene?.getSparkles() ?? [],
  getCollectedSparklesCount: () => scene?.getCollectedSparklesCount() ?? 0,
  getSparkleStreak: () => scene?.getSparkleStreak() ?? 0,
  getMaxSparkleStreak: () => scene?.getMaxSparkleStreak() ?? 0,
  getArchway: (stopId) => scene?.getArchway(stopId),
  isGuestWaving: (stopId) => scene?.isGuestWaving(stopId) ?? false,
  isGuestCutout: (stopId) => scene?.isGuestCutout(stopId) ?? false,
  getAcquiredStamps: () => scene?.getAcquiredStamps() ?? [],
  getCurrentStopIndex: () => scene?.getCurrentStopIndex() ?? 0,
  hasPlaceIllustration: (stopId) => scene?.hasPlaceIllustration(stopId) ?? false,
  getPlaceIllustrationDisplaySize: () => scene?.getPlaceIllustrationDisplaySize(),
  getPlaceLayers: (stopId) =>
    stopId !== undefined
      ? scene?.getPlaceLayers(stopId) ?? getPlaceLayers(stopId)
      : scene?.getPlaceLayers() ?? getPlaceLayers(),
  getScenePlaceObjects: () => scene?.getScenePlaceObjects(),
  getActiveSceneryLayers: () => scene?.getActiveSceneryLayers() ?? [],
  getGrownUpCornerState: () => grownUpCornerState,
  getFinaleState: () => finaleState,
  resetJourney: () => scene?.resetJourney() ?? resetJourney(),
  flyAgain: () => flyAgain(),
  getActiveFlightTrack: () => sound.getActiveFlightTrack(),
  isAudioCelebrating: () => sound.isCelebrationActive(),

  isAudioCrossfading: () => sound.isCrossfading(),
  getAudioPlaylistState: () => sound.getPlaylistState(),
  isAudioEnabled: () => sound.isEnabled(),
};


renderDots();
OPENING_STORYBOOK_MOMENTS_AFTER_COVER.forEach((momentContent) => void preloadStoryArtwork(momentContent.image));
registerSW({ immediate: true });
