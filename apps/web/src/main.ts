import Phaser from "phaser";
import { registerSW } from "virtual:pwa-register";

import "./style.css";
import { OPENING_STORYBOOK_MOMENTS_AFTER_COVER, STOP_STORIES, type StopStory } from "./game/content";
import { GAME_SIZE, RosieGameScene } from "./game/RosieGameScene";
import { GameAudio } from "./game/sound";
import { createRunnerState } from "./domain/gallop-and-flutter";
import { createJourney } from "./domain/journey";

export interface RosieRunnerInterface {
  getState: () => import("./domain/gallop-and-flutter").RunnerState;
  getJourney: () => import("./domain/journey").Journey;
  seekToEnd: () => void;
  isReady?: () => boolean;
  hasSpriteSheet?: () => boolean;
  getCurrentAnimation?: () => string | undefined;
  triggerStumble?: () => void;
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
const touchControl = getElement<HTMLButtonElement>("touch-control");
const soundButtons = [getElement<HTMLButtonElement>("sound-toggle"), getElement<HTMLButtonElement>("game-sound-toggle")];
const storyArtworks = Array.from(storybook.querySelectorAll<HTMLImageElement>(".storybook__art"));
const sound = new GameAudio();

let openingMomentIndex = 0;
let visibleStoryArtworkIndex = 0;
let scene: RosieGameScene | undefined;
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

async function advanceStory(): Promise<void> {
  await sound.start();
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
  scene = new RosieGameScene({
    onBirthdayStar: showBirthdayStar,
    onBump: () => sound.play("bump"),
    onCloudRest: showCloudRest,
    onCelebration: showEnding,
  });
  new Phaser.Game({
    type: Phaser.AUTO,
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
  sound.play("star");
  updateStars(count);
  finalStarWaiting = isFinal;
  momentPlace.textContent = stop.place;
  momentCopy.textContent = stop.moment;
  momentIcon.textContent = stop.icon;
  momentNext.innerHTML = isFinal ? "To the celebration <b aria-hidden=\"true\">★</b>" : "Keep flying <b aria-hidden=\"true\">→</b>";
  moment.hidden = false;
  window.setTimeout(() => momentNext.focus(), 80);
}

function continueFromMoment(): void {
  sound.play("button");
  moment.hidden = true;
  scene?.continueAfterBirthdayStar();
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
  tracker.querySelectorAll(".star").forEach((star, index) => star.classList.toggle("is-lit", index < count));
  tracker.setAttribute("aria-label", `${count} of ${STOP_STORIES.length} Birthday Stars`);
}

function showEnding(): void {
  gameShell.hidden = true;
  ending.hidden = false;
  sound.play("celebrate");
  burstConfetti(260);
  window.setTimeout(() => getElement<HTMLButtonElement>("dance-button").focus(), 100);
}

function danceAgain(): void {
  sound.play("celebrate");
  ending.classList.remove("is-dancing");
  requestAnimationFrame(() => ending.classList.add("is-dancing"));
  window.setTimeout(() => ending.classList.remove("is-dancing"), 3000);
  burstConfetti(180);
}

function toggleSound(): void {
  sound.setEnabled(!sound.isEnabled());
  soundButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(sound.isEnabled()));
    button.setAttribute("aria-label", sound.isEnabled() ? "Turn sound off" : "Turn sound on");
    button.textContent = sound.isEnabled() ? "♪" : "×";
  });
  if (sound.isEnabled()) void sound.start();
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

storyNext.addEventListener("click", () => void advanceStory());
momentNext.addEventListener("click", continueFromMoment);
restNext.addEventListener("click", continueFromCloudRest);
soundButtons.forEach((button) => button.addEventListener("click", toggleSound));
getElement<HTMLButtonElement>("dance-button").addEventListener("click", danceAgain);
getElement<HTMLButtonElement>("replay-button").addEventListener("click", () => window.location.reload());

const setTouch = (held: boolean): void => scene?.setTouchHeld(held);
touchControl.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  touchControl.setPointerCapture(event.pointerId);
  scene?.jumpInput();
  setTouch(true);
});
touchControl.addEventListener("pointerup", () => setTouch(false));
touchControl.addEventListener("pointercancel", () => setTouch(false));

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat) return;
  if (!moment.hidden) { event.preventDefault(); continueFromMoment(); }
  else if (!cloudRest.hidden) { event.preventDefault(); continueFromCloudRest(); }
  else if (!ending.hidden) { event.preventDefault(); danceAgain(); }
});

window.__ROSIE_RUNNER__ = {
  getState: () => scene?.getRunnerState() ?? createRunnerState(),
  getJourney: () => scene?.getJourney() ?? createJourney(),
  seekToEnd: () => scene?.seekToEnd(),
  isReady: () => scene?.isReady() ?? false,
  hasSpriteSheet: () => scene?.hasSpriteSheet() ?? false,
  getCurrentAnimation: () => scene?.getCurrentAnimation(),
  triggerStumble: () => scene?.triggerStumble(),
};

renderDots();
OPENING_STORYBOOK_MOMENTS_AFTER_COVER.forEach((momentContent) => void preloadStoryArtwork(momentContent.image));
registerSW({ immediate: true });
