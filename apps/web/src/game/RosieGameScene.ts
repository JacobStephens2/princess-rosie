import Phaser from "phaser";

import {
  acquireStorybookStamp,
  collectBirthdayStar,
  createJourney,
  resetJourney,
  resumeJourney,
  STAR_STOPS,
  type Journey,
  type StarStop,
} from "../domain/journey";
import {
  createRunnerState,
  handleJumpInput,
  updateRunner,
  triggerPlayfulStumble,
  checkObstacleEncounters,
  checkSpringboardEncounters,
  checkSparkleEncounters,
  DEFAULT_RUNNER_CONFIG,
  AUTHORED_OBSTACLES,
  AUTHORED_SPRINGBOARDS,
  AUTHORED_SPARKLES,
  AUTHORED_RAINBOW_ARCHWAYS,
  checkArchwayArrival,
  getPlaceObstacles,
  getPlaceSpringboards,
  getPlaceSparkles,
  getPlaceFamilyGuest,
  type RunnerState,
  type PlayfulObstacle,
  type Springboard,
  type StarSparkle,
  type RainbowArchway,
} from "../domain/gallop-and-flutter";
import {
  STOP_STORIES,
  FAMILY_GUESTS,
  resolveDerivativePath,
  getFamilyGuestTextureKey,
  getFamilyGuestDerivativePath,
  getBirthdayStarDerivativePath,
  getRainbowPathDerivativePath,
  type FamilyGuest,
  type StopStory,
} from "./content";
import {
  calculateSceneryLayerOffset,
  getPlaceLayers,
  getAllPlaceLayers,
  type SceneryLayer,
  type SceneryLayerDepth,
} from "../domain/scenery";
import { WingPuppet, WING_PUPPET_TEXTURES } from "./WingPuppet";

const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;
const PLACE_COURSE_WIDTH = DEFAULT_RUNNER_CONFIG.courseLength + 1100;

const GUEST_ORIGIN_Y: Record<FamilyGuest, number> = {
  Mom: 448 / 504,
  Dad: 450 / 504,
  Pop: 458 / 504,
  Gram: 462 / 504,
  Aunt: 467 / 504,
  Uncle: 470 / 504,
  Beasley: 405 / 504,
};

const SCENERY_LAYER_DEPTHS: Record<SceneryLayerDepth, number> = {
  far: -30,
  middle: -20,
  near: -10,
};

interface ActiveSceneryLayer {
  layer: SceneryLayer;
  container: Phaser.GameObjects.Container;
  image?: Phaser.GameObjects.Image;
  pieceImages: Phaser.GameObjects.Image[];
}

type LandscapeDrawer = (graphics: Phaser.GameObjects.Graphics, start: number) => void;

function drawRollingHills(graphics: Phaser.GameObjects.Graphics, start: number): void {
  for (let hillX = start + 520; hillX < start + PLACE_COURSE_WIDTH; hillX += 900) {
    graphics.fillEllipse(hillX, 690, 1200, 330);
  }
}

const LANDSCAPE_DRAWERS: Partial<Record<StarStop, LandscapeDrawer>> = {
  clouds: (graphics, start) => {
    for (let cloudBaseX = start + 850; cloudBaseX < start + PLACE_COURSE_WIDTH; cloudBaseX += 1400) {
      graphics.fillStyle(0xf4fbff, .95).fillEllipse(cloudBaseX, 670, 1850, 220);
    }
    const archCount = Math.floor(PLACE_COURSE_WIDTH / 280);
    for (let arch = 0; arch < archCount; arch += 1) {
      graphics.lineStyle(20, 0xfff1db, .72).strokeCircle(start + 220 + arch * 280, 400, 125);
    }
  },
  peak: (graphics, start) => {
    drawRollingHills(graphics, start);
    for (let peakX = start; peakX < start + PLACE_COURSE_WIDTH; peakX += 1700) {
      graphics.fillStyle(0x6d7f70, 1).fillTriangle(peakX, 650, peakX + 920, 120, peakX + 1700, 650);
    }
    graphics.fillStyle(0xf5e3ed, 1);
    const flowerCount = Math.floor(PLACE_COURSE_WIDTH / 77);
    for (let flower = 0; flower < flowerCount; flower += 1) graphics.fillCircle(start + 90 + flower * 77, 590 - (flower % 5) * 28, 10);
  },
  sea: (graphics, start) => {
    graphics.fillRect(start, 520, PLACE_COURSE_WIDTH, 200);
    graphics.lineStyle(9, 0xa7efff, .55);
    const waveCount = Math.floor(PLACE_COURSE_WIDTH / 210);
    for (let wave = 0; wave < waveCount; wave += 1) graphics.strokeCircle(start + 90 + wave * 210, 555 + (wave % 2) * 45, 100);
  },
  castle: (graphics, start) => {
    drawRollingHills(graphics, start);
  },
};

export interface GameCallbacks {
  onBirthdayStar: (stop: StopStory, count: number, isFinal: boolean) => void;
  onStarGatherChime?: () => void;
  onStorybookStampAwarded?: (stop: StopStory) => void;
  onStumble: () => void;
  onNearMiss?: (obstacle: PlayfulObstacle) => void;
  onSpringboard?: (springboard: Springboard) => void;
  onSparkleGathered?: (sparkle: StarSparkle, streak: number, totalCount: number) => void;
  onCloudRest: () => void;
  onCelebration: () => void;
}

export class RosieGameScene extends Phaser.Scene {
  private readonly callbacks: GameCallbacks;
  private journey: Journey = createJourney();
  private runnerState: RunnerState = createRunnerState({ x: 200, y: DEFAULT_RUNNER_CONFIG.groundY });
  private player!: WingPuppet;
  private spaceKey: Phaser.Input.Keyboard.Key | undefined;
  private upKey: Phaser.Input.Keyboard.Key | undefined;
  private touchHeld = false;
  private frozen = false;
  private nextStop = 0;
  private readonly guests = new Map<StarStop, Phaser.GameObjects.Container>();
  private readonly archways = new Map<StarStop, RainbowArchway>();
  private readonly archwayContainers = new Map<StarStop, Phaser.GameObjects.Container>();
  private currentObstacles: PlayfulObstacle[] = [];
  private readonly currentObstacleContainers = new Map<string, Phaser.GameObjects.Container>();
  private currentSpringboards: Springboard[] = [];
  private readonly currentSpringboardContainers = new Map<string, Phaser.GameObjects.Container>();
  private currentSparkles: StarSparkle[] = [];
  private readonly currentSparkleContainers = new Map<string, Phaser.GameObjects.Container>();
  private currentPlaceIllustration?: Phaser.GameObjects.Image;
  private activeSceneryLayers: ActiveSceneryLayer[] = [];
  private currentPlaceText?: Phaser.GameObjects.Text;
  private currentArchwayContainer?: Phaser.GameObjects.Container;
  private currentGuestContainer?: Phaser.GameObjects.Container;
  private currentStar?: Phaser.GameObjects.Image;
  private currentStarGlow?: Phaser.GameObjects.Arc;
  private currentRainbowPath?: Phaser.GameObjects.Image;
  private currentBackgroundGraphics?: Phaser.GameObjects.Graphics;
  private totalSparklesCollected = 0;
  private maxSparkleStreak = 0;
  private sparkleTrail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private reunionInProgress = false;
  private ready = false;

  constructor(callbacks: GameCallbacks) {
    super("rosie-adventure");
    this.callbacks = callbacks;
  }

  preload(): void {
    this.load.image(
      WING_PUPPET_TEXTURES.backWing,
      resolveDerivativePath("flight.rosie-stella-back-wing")
    );
    this.load.image(
      WING_PUPPET_TEXTURES.body,
      resolveDerivativePath("flight.rosie-stella-body")
    );
    this.load.image(
      WING_PUPPET_TEXTURES.frontWing,
      resolveDerivativePath("flight.rosie-stella-front-wing")
    );
    STOP_STORIES.forEach((stop) => {
      const layers = stop.layers ?? getPlaceLayers(stop.id);
      const farLayer = layers.find((l) => l.depth === "far");
      const paintingId = farLayer?.paintingAssetId;
      if (paintingId) {
        const path = resolveDerivativePath(paintingId);
        this.load.image(`place-illustration-${stop.id}`, path);
        this.load.image(paintingId, path);
      } else if (stop.placeIllustration) {
        this.load.image(`place-illustration-${stop.id}`, stop.placeIllustration);
      }

      layers.forEach((layer) => {
        layer.setPieces?.forEach((piece) => {
          this.load.image(piece.assetId, resolveDerivativePath(piece.assetId));
        });
      });
    });

    FAMILY_GUESTS.forEach((guest) => {
      this.load.image(getFamilyGuestTextureKey(guest), getFamilyGuestDerivativePath(guest));
    });
    this.load.image("birthday-star", getBirthdayStarDerivativePath());
    this.load.image("rainbow-path", getRainbowPathDerivativePath());

    this.load.image("garden.rose-bush", resolveDerivativePath("garden.rose-bush"));
    this.load.image("garden.giant-rose", resolveDerivativePath("garden.giant-rose"));
    this.load.image("garden.star-sparkle", resolveDerivativePath("garden.star-sparkle"));
    this.load.image("shared.rainbow-archway", resolveDerivativePath("shared.rainbow-archway"));
    this.load.image("lacewood.silver-ribbon", resolveDerivativePath("lacewood.silver-ribbon"));
    this.load.image("lacewood.lace-sprout", resolveDerivativePath("lacewood.lace-sprout"));
    this.load.image("abbey.bell-rope", resolveDerivativePath("abbey.bell-rope"));
    this.load.image("abbey.abbey-bell", resolveDerivativePath("abbey.abbey-bell"));
  }

  create(): void {
    this.journey = createJourney();
    this.runnerState = createRunnerState({ x: 200, y: DEFAULT_RUNNER_CONFIG.groundY });
    this.nextStop = 0;
    this.frozen = false;
    this.reunionInProgress = false;
    this.ready = false;
    this.totalSparklesCollected = 0;
    this.maxSparkleStreak = 0;
    this.createTextures();
    this.createAnimations();

    this.player = this.createPlayer(this.runnerState.x, this.runnerState.y);
    this.buildPlace(STOP_STORIES[0]!);

    this.cameras.main.startFollow(this.player, true, .08, .08, -340, 0);
    this.cameras.main.setBackgroundColor("#8bd8f1");
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.input.keyboard?.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.UP]);
    this.spaceKey?.on("down", () => this.jumpInput());
    this.upKey?.on("down", () => this.jumpInput());
    this.input.addPointer(1);
    this.input.on("pointerdown", () => this.jumpInput());

    const particles = this.add.particles(0, 0, "sparkle", {
      lifespan: 800,
      speedX: { min: -50, max: -15 },
      speedY: { min: -22, max: 22 },
      scale: { start: .7, end: 0 },
      alpha: { start: .8, end: 0 },
      frequency: 130,
      quantity: 1,
      follow: this.player,
      followOffset: { x: -65, y: -25 },
    });
    particles.setDepth(18);
    this.sparkleTrail = particles;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeCapture([Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.UP]);
      this.spaceKey?.removeAllListeners();
      this.upKey?.removeAllListeners();
      this.input.removeAllListeners();
    });
    this.ready = true;
  }

  jumpInput(): void {
    if (this.frozen) return;
    this.runnerState = handleJumpInput(this.runnerState);
  }

  update(_time: number, delta: number): void {
    if (this.frozen) return;

    const pointerHeld = this.input.activePointer?.isDown ?? false;
    const isFlutterHeld = Boolean(this.spaceKey?.isDown || this.upKey?.isDown || pointerHeld || this.touchHeld);
    const deltaSeconds = Math.min(delta / 1000, 0.1);

    this.runnerState = updateRunner(this.runnerState, deltaSeconds, isFlutterHeld);

    const encounter = checkObstacleEncounters(this.runnerState, this.currentObstacles);
    this.runnerState = encounter.state;

    if (encounter.stumbledObstacle) {
      this.handleObstacleStumble(encounter.stumbledObstacle);
    } else if (encounter.nearMissObstacle) {
      this.handleObstacleNearMiss(encounter.nearMissObstacle);
    }

    const sbEncounter = checkSpringboardEncounters(this.runnerState, this.currentSpringboards);
    this.runnerState = sbEncounter.state;
    if (sbEncounter.bouncedSpringboard) {
      this.handleSpringboardBounce(sbEncounter.bouncedSpringboard);
    }

    const spEncounter = checkSparkleEncounters(this.runnerState, this.currentSparkles);
    this.runnerState = spEncounter.state;
    if (spEncounter.collectedSparkle) {
      this.handleSparkleCollected(spEncounter.collectedSparkle);
    }

    this.player.update(deltaSeconds, this.runnerState);
    this.updateSceneryLayers();

    const stop = STOP_STORIES[this.nextStop];
    if (stop && !this.runnerState.arrivedAtArchway) {
      const archway = this.archways.get(stop.id) ?? AUTHORED_RAINBOW_ARCHWAYS[stop.id];
      if (archway) {
        const encounter = checkArchwayArrival(this.runnerState, archway);
        if (encounter.archwayArrival) {
          this.runnerState = encounter.state;
          this.handleArchwayArrival(stop);
        }
      }
    }
  }

  getRunnerState(): RunnerState {
    return this.runnerState;
  }

  isReady(): boolean {
    return this.ready;
  }

  hasPuppet(): boolean {
    return (
      this.textures.exists(WING_PUPPET_TEXTURES.backWing) &&
      this.textures.exists(WING_PUPPET_TEXTURES.body) &&
      this.textures.exists(WING_PUPPET_TEXTURES.frontWing) &&
      Boolean(this.player?.hasPuppet?.())
    );
  }

  hasSpriteSheet(): boolean {
    return this.hasPuppet();
  }

  getCurrentAnimation(): string | undefined {
    return this.player?.getCurrentAnimation();
  }

  triggerStumble(): void {
    if (this.frozen) return;
    this.runnerState = triggerPlayfulStumble(this.runnerState);
    this.callbacks.onStumble();
  }

  getObstacles(): readonly PlayfulObstacle[] {
    return AUTHORED_OBSTACLES;
  }

  getSpringboards(): readonly Springboard[] {
    return AUTHORED_SPRINGBOARDS;
  }

  getSparkles(): readonly StarSparkle[] {
    return AUTHORED_SPARKLES;
  }

  getCollectedSparklesCount(): number {
    return this.totalSparklesCollected;
  }

  getSparkleStreak(): number {
    return this.runnerState.sparkleStreak;
  }

  getMaxSparkleStreak(): number {
    return this.maxSparkleStreak;
  }

  getJourney(): Journey {
    return this.journey;
  }

  resetJourney(): Journey {
    this.journey = resetJourney(this.journey);
    this.nextStop = 0;
    this.totalSparklesCollected = 0;
    this.maxSparkleStreak = 0;
    this.frozen = false;
    this.reunionInProgress = false;
    this.buildPlace(STOP_STORIES[0]!);
    return this.journey;
  }

  getArchway(stopId?: StarStop): RainbowArchway | undefined {
    const targetStop = stopId ?? STOP_STORIES[this.nextStop]?.id ?? "garden";
    return this.archways.get(targetStop) ?? AUTHORED_RAINBOW_ARCHWAYS[targetStop];
  }

  isGuestWaving(stopId?: StarStop): boolean {
    const targetStop = stopId ?? STOP_STORIES[this.nextStop]?.id ?? "garden";
    const guest = this.guests.get(targetStop);
    if (guest) {
      return Boolean(guest.getData("isWaving"));
    }
    return STAR_STOPS.includes(targetStop);
  }

  isGuestCutout(stopId?: StarStop): boolean {
    const targetStop = stopId ?? STOP_STORIES[this.nextStop]?.id ?? "garden";
    const guest = this.guests.get(targetStop);
    if (!guest) return false;
    const isCutoutData = Boolean(guest.getData("isCutout"));
    const expectedTextureKey = getFamilyGuestTextureKey(getPlaceFamilyGuest(targetStop).guest);
    const hasCutoutImage = guest.list.some(
      (child) => child instanceof Phaser.GameObjects.Image && child.texture.key === expectedTextureKey,
    );
    const hasTextLabel = guest.list.some((child) => child instanceof Phaser.GameObjects.Text);
    const hasPrimitiveGraphics = guest.list.some(
      (child) =>
        child instanceof Phaser.GameObjects.Graphics ||
        child instanceof Phaser.GameObjects.Shape,
    );
    return isCutoutData && hasCutoutImage && !hasTextLabel && !hasPrimitiveGraphics;
  }

  getAcquiredStamps(): readonly StarStop[] {
    return this.journey.acquiredStamps;
  }

  getCurrentStopIndex(): number {
    return this.nextStop;
  }

  hasPlaceIllustration(stopId: StarStop): boolean {
    return this.textures.exists(`place-illustration-${stopId}`);
  }

  getPlaceIllustrationDisplaySize(): { width: number; height: number } | undefined {
    if (!this.currentPlaceIllustration) return undefined;
    return {
      width: this.currentPlaceIllustration.displayWidth,
      height: this.currentPlaceIllustration.displayHeight,
    };
  }

  getPlaceLayers(place: StarStop): readonly SceneryLayer[];
  getPlaceLayers(): Record<StarStop, readonly SceneryLayer[]>;
  getPlaceLayers(
    place?: StarStop
  ): readonly SceneryLayer[] | Record<StarStop, readonly SceneryLayer[]> {
    if (place !== undefined) {
      const stop = STOP_STORIES.find((s) => s.id === place);
      return stop?.layers ?? getPlaceLayers(place);
    }
    return getAllPlaceLayers();
  }

  getActiveSceneryLayers(): readonly { depth: SceneryLayerDepth; depthFactor: number; x: number }[] {
    return this.activeSceneryLayers.map((a) => ({
      depth: a.layer.depth,
      depthFactor: a.layer.depthFactor,
      x: a.container.x,
    }));
  }

  getScenePlaceObjects(): {
    place: StarStop;
    obstacles: readonly PlayfulObstacle[];
    springboards: readonly Springboard[];
    sparkles: readonly StarSparkle[];
    archway?: RainbowArchway;
    guest?: FamilyGuest;
    displayedSize?: { width: number; height: number };
    layers?: readonly SceneryLayer[];
    activeLayers?: readonly { depth: SceneryLayerDepth; depthFactor: number; x: number }[];
  } {
    const stop = STOP_STORIES[this.nextStop] ?? STOP_STORIES[0]!;
    return {
      place: stop.id,
      obstacles: this.currentObstacles,
      springboards: this.currentSpringboards,
      sparkles: this.currentSparkles,
      archway: this.archways.get(stop.id),
      guest: stop.guest,
      displayedSize: this.getPlaceIllustrationDisplaySize(),
      layers: this.getPlaceLayers(stop.id),
      activeLayers: this.getActiveSceneryLayers(),
    };
  }

  seekToEnd(): void {
    const stop = STOP_STORIES[this.nextStop];
    if (!stop) return;
    const archway = this.archways.get(stop.id) ?? AUTHORED_RAINBOW_ARCHWAYS[stop.id];
    this.runnerState = {
      ...this.runnerState,
      x: archway.x,
    };
    this.player.x = this.runnerState.x;
    const encounter = checkArchwayArrival(this.runnerState, archway);
    this.runnerState = encounter.state;
    this.handleArchwayArrival(stop);
  }

  setTouchHeld(held: boolean): void { this.touchHeld = held; }

  continueAfterBirthdayStar(): void {
    this.reunionInProgress = false;
    if (this.journey.phase === "celebrating") {
      this.callbacks.onCelebration();
      return;
    }
    const nextStop = STOP_STORIES[this.nextStop];
    if (nextStop) {
      this.buildPlace(nextStop);
    }
    this.resume();
  }

  continueAfterCloudRest(): void {
    this.journey = resumeJourney(this.journey);
    this.runnerState = {
      ...this.runnerState,
      x: this.runnerState.x + 115,
      y: 360,
      velocityY: -40,
      isGrounded: false,
      mode: "jumping",
    };
    this.resume();
  }

  pause(): void {
    this.frozen = true;
    this.sparkleTrail?.pause();
  }

  resume(): void {
    this.frozen = false;
    this.sparkleTrail?.resume();
  }

  isPaused(): boolean {
    return this.frozen;
  }

  private handleArchwayArrival(stop: StopStory): void {
    if (this.reunionInProgress) return;
    this.reunionInProgress = true;

    this.runnerState = {
      ...this.runnerState,
      arrivedAtArchway: true,
      pausedForReunion: true,
      courseCompleted: true,
    };
    this.pause();

    const star = this.children.getByName(`star-${stop.id}`) as Phaser.GameObjects.Image | null;
    if (star) {
      this.tweens.killTweensOf(star);
      this.tweens.add({
        targets: star,
        x: this.player.x + 25,
        y: this.player.y - 45,
        scale: { from: 1.14, to: 1.7 },
        duration: 480,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          this.callbacks.onStarGatherChime?.();
          this.journey = collectBirthdayStar(this.journey, stop.id);
          this.cameras.main.flash(260, 255, 235, 160, false);
          this.tweens.add({
            targets: star,
            scale: 2.8,
            alpha: 0,
            angle: 180,
            duration: 380,
            ease: "Back.easeIn",
            onComplete: () => {
              this.awardStorybookStamp(stop);
            },
          });
        },
      });
    } else {
      this.journey = collectBirthdayStar(this.journey, stop.id);
      this.awardStorybookStamp(stop);
    }
  }

  private awardStorybookStamp(stop: StopStory): void {
    this.journey = acquireStorybookStamp(this.journey, stop.id);
    if (stop.id !== "castle") {
      const guestPlacement = getPlaceFamilyGuest(stop.id);
      this.drawRainbowPath(guestPlacement.x, guestPlacement.y);
      this.sendGuestAlongRainbowPath(stop.id);
    }

    const floatingStamp = this.createFloatingStampPresentation(stop, this.player.x + 85, this.player.y - 55);
    this.callbacks.onStorybookStampAwarded?.(stop);

    this.nextStop += 1;
    this.time.delayedCall(780, () => {
      floatingStamp.destroy();
      this.callbacks.onBirthdayStar(stop, this.journey.collectedStars.length, this.journey.phase === "celebrating");
    });
  }

  private createTextures(): void {
    if (!this.textures.exists("rosie-stella")) {
      const canvas = this.textures.createCanvas("rosie-stella", 1024, 1024);
      if (canvas) {
        for (let i = 0; i < 16; i += 1) {
          const col = i % 4;
          const row = Math.floor(i / 4);
          canvas.add(i, 0, col * 256, row * 256, 256, 256);
        }
      }
    }
    if (this.textures.exists("puff-cloud")) return;
    const cloud = this.make.graphics({ x: 0, y: 0 });
    cloud.fillStyle(0x768eb6, .9);
    cloud.fillCircle(54, 52, 35).fillCircle(93, 36, 46).fillCircle(135, 53, 34);
    cloud.fillRoundedRect(30, 50, 135, 48, 24);
    cloud.fillStyle(0x9fb3d1, .7).fillCircle(92, 35, 22);
    cloud.generateTexture("puff-cloud", 190, 105);
    cloud.destroy();

    const wind = this.make.graphics({ x: 0, y: 0 });
    wind.lineStyle(12, 0xe9f8ff, .9).beginPath().moveTo(8, 34).lineTo(128, 34).strokePath();
    wind.lineStyle(10, 0xc6eaf5, .9).strokeCircle(135, 50, 34);
    wind.lineStyle(8, 0xffffff, .75).beginPath().moveTo(12, 72).lineTo(112, 72).strokePath();
    wind.generateTexture("wind-curl", 180, 100);
    wind.destroy();

    const ribbon = this.make.graphics({ x: 0, y: 0 });
    ribbon.lineStyle(15, 0xf6eefc, .96).beginPath().moveTo(8, 20).lineTo(55, 72).lineTo(100, 24).lineTo(150, 78).lineTo(184, 38).strokePath();
    ribbon.lineStyle(4, 0xb898cf, .7).beginPath().moveTo(8, 20).lineTo(55, 72).lineTo(100, 24).lineTo(150, 78).lineTo(184, 38).strokePath();
    ribbon.generateTexture("lace-ribbon", 195, 100);
    ribbon.destroy();

    const sparkle = this.make.graphics({ x: 0, y: 0 });
    sparkle.fillStyle(0xffdf63, 1);
    sparkle.fillTriangle(6, 0, 8, 6, 4, 6).fillTriangle(6, 12, 8, 6, 4, 6);
    sparkle.generateTexture("sparkle", 12, 12);
    sparkle.destroy();
  }

  private createAnimations(): void {
    // Legacy spritesheet frames replaced by procedural WingPuppet kinematics.
  }

  private cleanupCurrentPlace(): void {
    for (const active of this.activeSceneryLayers) {
      active.container.destroy();
    }
    this.activeSceneryLayers = [];
    if (this.currentPlaceIllustration) {
      this.currentPlaceIllustration.destroy();
      this.currentPlaceIllustration = undefined;
    }
    if (this.currentPlaceText) {
      this.currentPlaceText.destroy();
      this.currentPlaceText = undefined;
    }
    if (this.currentArchwayContainer) {
      this.currentArchwayContainer.destroy();
      this.currentArchwayContainer = undefined;
    }
    if (this.currentGuestContainer) {
      this.tweens.killTweensOf(this.currentGuestContainer);
      this.currentGuestContainer.destroy();
      this.currentGuestContainer = undefined;
    }
    if (this.currentStar) {
      this.tweens.killTweensOf(this.currentStar);
      this.currentStar.destroy();
      this.currentStar = undefined;
    }
    if (this.currentStarGlow) {
      this.currentStarGlow.destroy();
      this.currentStarGlow = undefined;
    }
    this.destroyRainbowPath();
    if (this.currentBackgroundGraphics) {
      this.currentBackgroundGraphics.destroy();
      this.currentBackgroundGraphics = undefined;
    }
    this.currentObstacleContainers.forEach((container) => {
      this.tweens.killTweensOf(container);
      container.destroy();
    });
    this.currentObstacleContainers.clear();

    this.currentSpringboardContainers.forEach((container) => {
      this.tweens.killTweensOf(container);
      container.destroy();
    });
    this.currentSpringboardContainers.clear();

    this.currentSparkleContainers.forEach((container) => {
      this.tweens.killTweensOf(container);
      container.destroy();
    });
    this.currentSparkleContainers.clear();

    this.guests.clear();
    this.archways.clear();
    this.archwayContainers.clear();
  }

  private updateSceneryLayers(): void {
    for (const active of this.activeSceneryLayers) {
      const offset = calculateSceneryLayerOffset(this.runnerState.x, active.layer.depthFactor);
      active.container.x = -offset;
    }
  }

  private buildPlace(stop: StopStory): void {
    this.cleanupCurrentPlace();

    const stopIndex = STOP_STORIES.findIndex((s) => s.id === stop.id);
    const archway = AUTHORED_RAINBOW_ARCHWAYS[stop.id];

    // 1. Fallback background if place illustration is absent
    const backgrounds = this.add.graphics().setDepth(-35);
    backgrounds.fillStyle(stop.sky, 1).fillRect(0, 0, PLACE_COURSE_WIDTH, VIEW_HEIGHT);
    this.drawClouds(backgrounds, 0, stopIndex);
    this.drawLandscape(backgrounds, 0, stop);
    if (stop.id === "castle") {
      this.drawCastle(backgrounds, archway.x, 520);
    }
    this.currentBackgroundGraphics = backgrounds;

    // 2. Scenery Layers rendered in depth order beneath all interactive elements.
    // Far layer (depth -30) initially renders the place's approved painting with depth factor 0.
    // Middle (depth -20) and Near (depth -10) render any declared Set Pieces with depth factors.
    const sceneryLayers = stop.layers ?? getPlaceLayers(stop.id);
    for (const layer of sceneryLayers) {
      const depth = SCENERY_LAYER_DEPTHS[layer.depth];
      const container = this.add.container(0, 0).setDepth(depth).setScrollFactor(0);
      let layerImage: Phaser.GameObjects.Image | undefined;
      const pieceImages: Phaser.GameObjects.Image[] = [];

      if (layer.paintingAssetId) {
        const textureKey = this.textures.exists(`place-illustration-${stop.id}`)
          ? `place-illustration-${stop.id}`
          : layer.paintingAssetId;
        if (this.textures.exists(textureKey)) {
          layerImage = this.add
            .image(0, 0, textureKey)
            .setOrigin(0, 0);
          if (layer.depthFactor === 0) {
            layerImage.setDisplaySize(VIEW_WIDTH, VIEW_HEIGHT);
          } else {
            const neededWidth = VIEW_WIDTH + Math.ceil(DEFAULT_RUNNER_CONFIG.courseLength * layer.depthFactor);
            const naturalWidth = Math.round(layerImage.width * (VIEW_HEIGHT / layerImage.height));
            const displayWidth = Math.max(VIEW_WIDTH, naturalWidth, neededWidth);
            layerImage.setDisplaySize(displayWidth, VIEW_HEIGHT);
          }
          container.add(layerImage);

          if (layer.depth === "far") {
            this.currentPlaceIllustration = layerImage;
          }
        }
      }

      if (Array.isArray(layer.setPieces)) {
        for (const piece of layer.setPieces) {
          if (this.textures.exists(piece.assetId)) {
            const pieceImage = this.add
              .image(piece.positionAlongCourse, DEFAULT_RUNNER_CONFIG.groundY, piece.assetId)
              .setOrigin(0.5, piece.groundAnchor);
            container.add(pieceImage);
            pieceImages.push(pieceImage);
          }
        }
      }

      const offset = calculateSceneryLayerOffset(this.runnerState.x, layer.depthFactor);
      container.x = -offset;

      this.activeSceneryLayers.push({
        layer,
        container,
        image: layerImage,
        pieceImages,
      });
    }

    // 3. Place name text along Storybook Ground at start of place
    this.currentPlaceText = this.add
      .text(430, 118, stop.place, {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#ffffff",
        stroke: "#7d4670",
        strokeThickness: 7,
      })
      .setDepth(-5)
      .setAlpha(0.92);

    // 4. Rainbow Archway
    this.archways.set(stop.id, archway);
    this.currentArchwayContainer = this.createRainbowArchway(archway);
    this.archwayContainers.set(stop.id, this.currentArchwayContainer);

    // 5. Birthday Star & Glow
    const starY = 245 + (stopIndex % 3) * 80;
    this.currentStar = this.add
      .image(archway.x, starY, "birthday-star")
      .setDepth(18)
      .setName(`star-${stop.id}`);
    this.tweens.add({
      targets: this.currentStar,
      scale: 1.14,
      angle: 10,
      yoyo: true,
      repeat: -1,
      duration: 650 + stopIndex * 50,
      ease: "Sine.easeInOut",
    });
    this.currentStarGlow = this.add.circle(archway.x, starY, 76, 0xffed97, 0.18).setDepth(17);

    // 6. Family Guest declared relative to place course
    const guestPlacement = getPlaceFamilyGuest(stop.id);
    this.currentGuestContainer = this.createGuest(guestPlacement.x, guestPlacement.y, guestPlacement.guest);
    this.guests.set(stop.id, this.currentGuestContainer);

    // 7. Obstacles for this place
    this.currentObstacles = [...getPlaceObstacles(stop.id)];
    this.currentObstacles.forEach((obstacle) => {
      const container = this.createObstacle(obstacle);
      this.currentObstacleContainers.set(obstacle.id, container);
    });

    // 8. Springboards for this place
    this.currentSpringboards = [...getPlaceSpringboards(stop.id)];
    this.currentSpringboards.forEach((springboard) => {
      const container = this.createSpringboard(springboard);
      this.currentSpringboardContainers.set(springboard.id, container);
    });

    // 9. Sparkles for this place
    this.currentSparkles = [...getPlaceSparkles(stop.id)];
    this.currentSparkles.forEach((sparkle) => {
      const container = this.createSparkle(sparkle);
      this.currentSparkleContainers.set(sparkle.id, container);
    });

    // 10. Reset RunnerState & Player for this place
    this.runnerState = createRunnerState({ x: 200, y: DEFAULT_RUNNER_CONFIG.groundY });
    if (this.player) {
      this.player.reset(200, DEFAULT_RUNNER_CONFIG.groundY);
    }
    if (this.sparkleTrail) {
      this.sparkleTrail.killAll();
    }

    // 11. Camera bounds and reset
    this.cameras.main.setBounds(0, 0, PLACE_COURSE_WIDTH, VIEW_HEIGHT);
    this.cameras.main.scrollX = 0;
  }

  private createObstacle(obstacle: PlayfulObstacle): Phaser.GameObjects.Container {
    const container = this.add.container(obstacle.x, obstacle.y).setDepth(15);
    container.setName(`obstacle-${obstacle.id}`);

    const g = this.add.graphics();
    const w = obstacle.width;
    const h = obstacle.height;

    switch (obstacle.type) {
      case "silver-ribbon": {
        if (this.textures.exists("lacewood.silver-ribbon")) {
          const img = this.add.image(0, 0, "lacewood.silver-ribbon").setOrigin(0.5, 1);
          img.setDisplaySize(72, 60);
          container.add(img);
          break;
        }
        g.fillStyle(0x44533c, 1);
        g.fillRoundedRect(-w * 0.45, -h * 0.6, w * 0.9, h * 0.6, 8);
        g.fillStyle(0x628052, 1);
        g.fillEllipse(-w * 0.15, -h * 0.62, w * 0.4, 8);
        g.lineStyle(4, 0xf0f5ff, 0.95);
        g.beginPath();
        g.moveTo(-w * 0.35, -h * 0.1);
        g.lineTo(-w * 0.1, -h * 0.65);
        g.lineTo(w * 0.15, -h * 0.15);
        g.lineTo(w * 0.35, -h * 0.6);
        g.strokePath();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(w * 0.15, -h * 0.5, 4);
        break;
      }
      case "bell-rope": {
        if (this.textures.exists("abbey.bell-rope")) {
          const img = this.add.image(0, 0, "abbey.bell-rope").setOrigin(0.5, 1);
          img.setDisplaySize(70, 60);
          container.add(img);
          break;
        }
        g.fillStyle(0xd4aa68, 1);
        g.fillRoundedRect(-w * 0.42, -h * 0.7, w * 0.84, h * 0.7, 6);
        g.fillStyle(0xb88d4c, 1);
        g.fillRect(-w * 0.46, -h * 0.78, w * 0.92, 6);
        g.lineStyle(5, 0xffd65e, 0.95);
        g.beginPath();
        g.moveTo(-w * 0.15, -h * 0.8);
        g.lineTo(-w * 0.15, -h * 0.2);
        g.moveTo(w * 0.15, -h * 0.8);
        g.lineTo(w * 0.15, -h * 0.2);
        g.strokePath();
        g.fillStyle(0xffea88, 1);
        g.fillCircle(-w * 0.15, -h * 0.15, 6);
        g.fillCircle(w * 0.15, -h * 0.15, 6);
        break;
      }
      case "soft-cloud": {
        g.fillStyle(0xd6ecfa, 0.9);
        g.fillCircle(-w * 0.24, -h * 0.4, w * 0.32);
        g.fillCircle(w * 0.24, -h * 0.4, w * 0.32);
        g.fillCircle(0, -h * 0.6, w * 0.36);
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(-w * 0.2, -h * 0.45, w * 0.26);
        g.fillCircle(w * 0.2, -h * 0.45, w * 0.26);
        g.fillCircle(0, -h * 0.65, w * 0.3);
        break;
      }
      case "flower-bank": {
        g.fillStyle(0x6e7b75, 1);
        g.fillRoundedRect(-w * 0.45, -h * 0.65, w * 0.9, h * 0.65, 8);
        g.fillStyle(0x8a9e88, 1);
        g.fillCircle(-w * 0.1, -h * 0.68, w * 0.32);
        g.fillStyle(0xf05a9d, 1);
        g.fillCircle(-w * 0.25, -h * 0.5, 7);
        g.fillCircle(w * 0.2, -h * 0.55, 8);
        g.fillCircle(0, -h * 0.75, 7);
        g.fillStyle(0xffd65e, 1);
        g.fillCircle(-w * 0.25, -h * 0.5, 3);
        g.fillCircle(w * 0.2, -h * 0.55, 3);
        g.fillCircle(0, -h * 0.75, 3);
        break;
      }
      case "wave-crest": {
        g.fillStyle(0x168fc4, 0.95);
        g.fillEllipse(0, -h * 0.4, w * 0.85, h * 0.8);
        g.fillStyle(0x6fd3ef, 0.95);
        g.fillCircle(-w * 0.2, -h * 0.5, w * 0.25);
        g.fillCircle(w * 0.18, -h * 0.55, w * 0.28);
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(-w * 0.22, -h * 0.7, 6);
        g.fillCircle(0, -h * 0.75, 7);
        g.fillCircle(w * 0.22, -h * 0.7, 6);
        break;
      }
      case "castle-bunting": {
        g.fillStyle(0x9b3260, 1);
        g.fillRoundedRect(-w * 0.45, -h * 0.6, w * 0.9, h * 0.6, 6);
        g.fillStyle(0xf4c45c, 1);
        g.fillRect(-w * 0.48, -h * 0.72, w * 0.96, 6);
        g.lineStyle(3, 0xffd65e, 1);
        g.beginPath();
        g.moveTo(-w * 0.4, -h * 0.4);
        g.lineTo(0, -h * 0.15);
        g.lineTo(w * 0.4, -h * 0.4);
        g.strokePath();
        break;
      }
      case "rose-bush":
      default: {
        if (this.textures.exists("garden.rose-bush")) {
          const img = this.add.image(0, 0, "garden.rose-bush").setOrigin(0.5, 1);
          img.setDisplaySize(68, 60);
          container.add(img);
          break;
        }
        g.fillStyle(0x3e7a46, 1);
        g.fillEllipse(0, -h * 0.45, w, h * 0.85);
        g.fillStyle(0x5ca364, 1);
        g.fillCircle(-w * 0.22, -h * 0.5, w * 0.28);
        g.fillCircle(w * 0.22, -h * 0.5, w * 0.28);
        g.fillCircle(0, -h * 0.65, w * 0.32);

        g.fillStyle(0xf05a9d, 1);
        g.fillCircle(-14, -h * 0.48, 9);
        g.fillCircle(14, -h * 0.42, 10);
        g.fillCircle(0, -h * 0.72, 11);

        g.fillStyle(0xffd65e, 1);
        g.fillCircle(-14, -h * 0.48, 3.5);
        g.fillCircle(14, -h * 0.42, 3.5);
        g.fillCircle(0, -h * 0.72, 4);
        break;
      }
    }

    container.add(g);
    return container;
  }

  private handleObstacleStumble(obstacle: PlayfulObstacle): void {
    const container = this.currentObstacleContainers.get(obstacle.id);
    if (container) {
      this.tweens.add({
        targets: container,
        angle: { from: -7, to: 7 },
        yoyo: true,
        repeat: 2,
        duration: 75,
        onComplete: () => {
          container.angle = 0;
        },
      });
    }
    this.callbacks.onStumble();
  }

  private handleObstacleNearMiss(obstacle: PlayfulObstacle): void {
    this.callbacks.onNearMiss?.(obstacle);
    const shimmer = this.add.star(obstacle.x, obstacle.y - obstacle.height - 18, 5, 8, 18, 0xfff7c8, 1).setDepth(25);
    this.tweens.add({
      targets: shimmer,
      scale: { from: 0.6, to: 1.8 },
      alpha: { from: 1, to: 0 },
      y: shimmer.y - 30,
      angle: 90,
      duration: 550,
      ease: "Sine.easeOut",
      onComplete: () => shimmer.destroy(),
    });
  }

  private createSpringboard(springboard: Springboard): Phaser.GameObjects.Container {
    const container = this.add.container(springboard.x, springboard.y).setDepth(16);
    container.setName(`springboard-${springboard.id}`);

    const g = this.add.graphics();
    const w = springboard.width;
    const h = springboard.height;

    switch (springboard.type) {
      case "lace-sprout": {
        if (this.textures.exists("lacewood.lace-sprout")) {
          const img = this.add.image(0, 0, "lacewood.lace-sprout").setOrigin(0.5, 1);
          img.setDisplaySize(80, 80);
          container.add(img);
          break;
        }
        g.fillStyle(0x397a5b, 1);
        g.fillEllipse(0, -h * 0.25, w * 0.9, h * 0.4);
        g.fillStyle(0x9d72bd, 1);
        g.fillEllipse(0, -h * 0.65, w * 0.85, h * 0.65);
        g.fillStyle(0xc49bd8, 1);
        g.fillCircle(-w * 0.2, -h * 0.68, w * 0.26);
        g.fillCircle(w * 0.2, -h * 0.68, w * 0.26);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, -h * 0.78, 6);
        break;
      }
      case "abbey-bell": {
        if (this.textures.exists("abbey.abbey-bell")) {
          const img = this.add.image(0, 0, "abbey.abbey-bell").setOrigin(0.5, 1);
          img.setDisplaySize(80, 80);
          container.add(img);
          break;
        }
        g.fillStyle(0xb88d4c, 1);
        g.fillRoundedRect(-w * 0.45, -h * 0.25, w * 0.9, h * 0.3, 4);
        g.fillStyle(0xe3ad54, 1);
        g.fillEllipse(0, -h * 0.65, w * 0.85, h * 0.65);
        g.fillStyle(0xffd65e, 1);
        g.fillCircle(0, -h * 0.74, w * 0.24);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, -h * 0.74, 5);
        break;
      }
      case "cloud-updraft": {
        g.fillStyle(0xa4dcf4, 0.8);
        g.fillEllipse(0, -h * 0.25, w * 0.95, h * 0.4);
        g.fillStyle(0xedf8ff, 0.95);
        g.fillCircle(-w * 0.22, -h * 0.6, w * 0.28);
        g.fillCircle(w * 0.22, -h * 0.6, w * 0.28);
        g.fillCircle(0, -h * 0.78, w * 0.32);
        g.fillStyle(0xffea88, 1);
        g.fillCircle(0, -h * 0.78, 6);
        break;
      }
      case "mountain-blossom": {
        g.fillStyle(0x56695e, 1);
        g.fillEllipse(0, -h * 0.25, w * 0.9, h * 0.4);
        g.fillStyle(0xf5e3ed, 1);
        g.fillEllipse(0, -h * 0.65, w * 0.85, h * 0.65);
        g.fillStyle(0xff9abb, 1);
        g.fillCircle(-w * 0.2, -h * 0.68, w * 0.25);
        g.fillCircle(w * 0.2, -h * 0.68, w * 0.25);
        g.fillStyle(0xffd65e, 1);
        g.fillCircle(0, -h * 0.76, w * 0.14);
        break;
      }
      case "sea-geyser": {
        g.fillStyle(0x0e6e99, 1);
        g.fillEllipse(0, -h * 0.25, w * 0.95, h * 0.4);
        g.fillStyle(0x6fd3ef, 0.95);
        g.fillEllipse(0, -h * 0.65, w * 0.85, h * 0.65);
        g.fillStyle(0xa7efff, 1);
        g.fillCircle(0, -h * 0.75, w * 0.26);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, -h * 0.78, 6);
        break;
      }
      case "castle-drum": {
        g.fillStyle(0x7d284a, 1);
        g.fillRoundedRect(-w * 0.42, -h * 0.55, w * 0.84, h * 0.55, 6);
        g.fillStyle(0xf4c45c, 1);
        g.fillEllipse(0, -h * 0.6, w * 0.88, h * 0.4);
        g.fillStyle(0xfff5df, 1);
        g.fillCircle(0, -h * 0.62, w * 0.2);
        break;
      }
      case "giant-rose":
      default: {
        if (this.textures.exists("garden.giant-rose")) {
          const img = this.add.image(0, 0, "garden.giant-rose").setOrigin(0.5, 1);
          img.setDisplaySize(80, 80);
          container.add(img);
          break;
        }
        g.fillStyle(0x2f6838, 1);
        g.fillEllipse(0, -h * 0.25, w * 0.95, h * 0.45);
        g.fillStyle(0x4a9456, 1);
        g.fillCircle(-w * 0.32, -h * 0.35, w * 0.24);
        g.fillCircle(w * 0.32, -h * 0.35, w * 0.24);

        g.fillStyle(0xbe2567, 1);
        g.fillEllipse(0, -h * 0.65, w * 0.85, h * 0.65);
        g.fillStyle(0xef4f95, 1);
        g.fillCircle(-w * 0.2, -h * 0.68, w * 0.28);
        g.fillCircle(w * 0.2, -h * 0.68, w * 0.28);
        g.fillCircle(0, -h * 0.82, w * 0.32);

        g.fillStyle(0xff9abb, 1);
        g.fillCircle(0, -h * 0.76, w * 0.22);

        g.fillStyle(0xffdf63, 1);
        g.fillCircle(0, -h * 0.76, w * 0.12);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, -h * 0.76, 3);
        break;
      }
    }

    container.add(g);
    return container;
  }

  private handleSpringboardBounce(springboard: Springboard): void {
    this.callbacks.onSpringboard?.(springboard);
    const container = this.currentSpringboardContainers.get(springboard.id);
    if (container) {
      this.tweens.add({
        targets: container,
        scaleY: { from: 1, to: 0.62 },
        scaleX: { from: 1, to: 1.32 },
        yoyo: true,
        duration: 80,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: container,
            scaleY: { from: 1, to: 1.18 },
            scaleX: { from: 1, to: 0.9 },
            yoyo: true,
            duration: 140,
            ease: "Sine.easeInOut",
          });
        },
      });
    }

    const chimeBurst = this.add.star(springboard.x, springboard.y - springboard.height * 0.8, 6, 12, 28, 0xfff7c8, 1).setDepth(25);
    this.tweens.add({
      targets: chimeBurst,
      scale: { from: 0.8, to: 2.2 },
      alpha: { from: 1, to: 0 },
      y: chimeBurst.y - 45,
      angle: 120,
      duration: 550,
      ease: "Sine.easeOut",
      onComplete: () => chimeBurst.destroy(),
    });
  }

  private createSparkle(sparkle: StarSparkle): Phaser.GameObjects.Container {
    const container = this.add.container(sparkle.x, sparkle.y).setDepth(18);
    container.setName(`sparkle-${sparkle.id}`);

    const currentStop = STOP_STORIES[this.nextStop]?.id;
    if (currentStop === "garden" && this.textures.exists("garden.star-sparkle")) {
      const img = this.add.image(0, 0, "garden.star-sparkle").setOrigin(0.5, 0.5);
      img.setDisplaySize(44, 44);
      container.add(img);
    } else {
      const graphics = this.add.graphics();
      // Warm outer starlight aura
      graphics.fillStyle(0xffed97, 0.35);
      graphics.fillCircle(0, 0, 18);
      graphics.fillStyle(0xffdf63, 0.55);
      graphics.fillCircle(0, 0, 11);

      // 4-pointed celestial star sparkle
      graphics.fillStyle(0xfff7c8, 1);
      graphics.fillTriangle(-2, 0, 2, 0, 0, -14);
      graphics.fillTriangle(-2, 0, 2, 0, 0, 14);
      graphics.fillTriangle(0, -2, 0, 2, -14, 0);
      graphics.fillTriangle(0, -2, 0, 2, 14, 0);

      // Radiant starlight core
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(0, 0, 3.5);

      container.add(graphics);
    }

    // Gentle hovering idle motion
    this.tweens.add({
      targets: container,
      y: sparkle.y - 6,
      yoyo: true,
      repeat: -1,
      duration: 550 + (sparkle.x % 140),
      ease: "Sine.easeInOut",
    });

    return container;
  }

  private handleSparkleCollected(sparkle: StarSparkle): void {
    this.totalSparklesCollected += 1;
    this.maxSparkleStreak = Math.max(this.maxSparkleStreak, this.runnerState.sparkleStreak);
    this.callbacks.onSparkleGathered?.(sparkle, this.runnerState.sparkleStreak, this.totalSparklesCollected);

    const container = this.currentSparkleContainers.get(sparkle.id);
    if (container) {
      this.tweens.add({
        targets: container,
        scale: 2.2,
        alpha: 0,
        y: container.y - 25,
        duration: 300,
        ease: "Back.easeIn",
        onComplete: () => {
          container.setVisible(false);
        },
      });
    }

    const collectStar = this.add.star(sparkle.x, sparkle.y, 5, 7, 20, 0xfff7c8, 1).setDepth(26);
    this.tweens.add({
      targets: collectStar,
      scale: { from: 1, to: 2.4 },
      alpha: { from: 1, to: 0 },
      angle: 90,
      duration: 380,
      ease: "Sine.easeOut",
      onComplete: () => collectStar.destroy(),
    });
  }

  private drawClouds(graphics: Phaser.GameObjects.Graphics, start: number, index: number): void {
    graphics.fillStyle(0xffffff, .34);
    const cloudsCount = Math.floor(PLACE_COURSE_WIDTH / 360);
    for (let cloudIndex = 0; cloudIndex < cloudsCount; cloudIndex += 1) {
      const x = start + 120 + cloudIndex * 360 + (index % 2) * 100;
      const y = 70 + (cloudIndex % 3) * 115;
      graphics.fillCircle(x, y, 48).fillCircle(x + 55, y - 14, 66).fillCircle(x + 118, y + 2, 44);
    }
  }

  private drawLandscape(graphics: Phaser.GameObjects.Graphics, start: number, stop: StopStory): void {
    graphics.fillStyle(stop.ground, 1);
    LANDSCAPE_DRAWERS[stop.id]?.(graphics, start);
  }

  private createRainbowArchway(archway: RainbowArchway): Phaser.GameObjects.Container {
    const container = this.add.container(archway.x, archway.y).setDepth(14);
    container.setName(`rainbow-archway-${archway.place}`);

    const stop = STOP_STORIES.find((s) => s.id === archway.place);

    if (this.textures.exists("shared.rainbow-archway")) {
      const archwayImage = this.add.image(0, 0, "shared.rainbow-archway").setOrigin(0.5, 1);
      archwayImage.setDisplaySize(240, 360);
      if (stop?.archwayTint !== undefined) {
        archwayImage.setTint(stop.archwayTint);
      }
      container.add(archwayImage);
      return container;
    }

    const graphics = this.add.graphics();
    const archCenterY = -140;
    const pillarLeftX = -archway.width / 2 + 14;
    const pillarRightX = archway.width / 2 - 14;
    const pillarWidth = 26;
    const pillarHeight = 140;

    // Glowing starlight aura behind archway
    graphics.fillStyle(0xfff7c8, 0.22);
    graphics.fillCircle(0, archCenterY, 92);

    // Marble and golden pillars
    graphics.fillStyle(0xe2a842, 1);
    graphics.fillRoundedRect(pillarLeftX - pillarWidth / 2 - 4, -pillarHeight - 12, pillarWidth + 8, 16, 4);
    graphics.fillRoundedRect(pillarRightX - pillarWidth / 2 - 4, -pillarHeight - 12, pillarWidth + 8, 16, 4);

    graphics.fillStyle(0xf5cd72, 1);
    graphics.fillRect(pillarLeftX - pillarWidth / 2, -pillarHeight, pillarWidth, pillarHeight);
    graphics.fillRect(pillarRightX - pillarWidth / 2, -pillarHeight, pillarWidth, pillarHeight);

    graphics.fillStyle(0xcca03a, 1);
    graphics.fillRoundedRect(pillarLeftX - pillarWidth / 2 - 6, -18, pillarWidth + 12, 18, 4);
    graphics.fillRoundedRect(pillarRightX - pillarWidth / 2 - 6, -18, pillarWidth + 12, 18, 4);

    // Shining Rainbow bands spanning the arch
    const rainbowColors = [0xef5d9d, 0xf4a658, 0xf3d760, 0x67c984, 0x5bbce3, 0x9271d1];
    rainbowColors.forEach((color, i) => {
      const radius = 68 - i * 8;
      graphics.lineStyle(8, color, 0.95);
      graphics.beginPath();
      graphics.arc(0, archCenterY, radius, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
      graphics.strokePath();
    });

    container.add(graphics);

    const crownStar = this.add.star(0, archCenterY - 78, 6, 9, 22, 0xfff7c8, 1);
    crownStar.setStrokeStyle(3, 0xffe985, 1);
    container.add(crownStar);

    this.tweens.add({
      targets: crownStar,
      scale: { from: 0.92, to: 1.25 },
      alpha: { from: 0.8, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 650,
      ease: "Sine.easeInOut",
    });

    return container;
  }

  private createFloatingStampPresentation(stop: StopStory, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(30);
    container.setName(`stamp-presentation-${stop.id}`);

    const bg = this.add.graphics();
    bg.fillStyle(0xfff8ea, 1);
    bg.fillRoundedRect(-50, -65, 100, 130, 10);
    bg.lineStyle(4, 0xf4c45c, 1);
    bg.strokeRoundedRect(-50, -65, 100, 130, 10);
    bg.fillStyle(0xffe89e, 0.4);
    bg.fillRoundedRect(-44, -59, 88, 118, 6);

    const icon = this.add.text(0, -25, stop.stamp.icon, { fontSize: "40px" }).setOrigin(0.5);
    const guestLabel = this.add.text(0, 18, stop.guest, {
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
      fontSize: "14px",
      color: "#7d4670",
    }).setOrigin(0.5);
    const stampLabel = this.add.text(0, 36, "STAMP", {
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
      fontSize: "11px",
      color: "#f05a9d",
    }).setOrigin(0.5);

    container.add([bg, icon, guestLabel, stampLabel]);
    container.setScale(0.2);
    container.alpha = 0;

    this.tweens.add({
      targets: container,
      scale: 1.25,
      alpha: 1,
      y: y - 45,
      duration: 480,
      ease: "Back.easeOut",
    });

    return container;
  }

  private createGuest(x: number, groundY: number, name: FamilyGuest): Phaser.GameObjects.Container {
    const guest = this.add.container(x, groundY).setDepth(16);
    guest.setData("isCutout", true);
    guest.setData("isWaving", true);
    guest.setData("guestName", name);
    guest.setName(`guest-${name}`);

    const cutout = this.add
      .image(0, 0, getFamilyGuestTextureKey(name))
      .setOrigin(0.5, GUEST_ORIGIN_Y[name])
      .setScale(0.44);
    guest.add(cutout);

    this.tweens.add({
      targets: guest,
      y: groundY - 7,
      yoyo: true,
      repeat: -1,
      duration: 780,
      ease: "Sine.easeInOut",
    });
    return guest;
  }

  private createPlayer(x: number, y: number): WingPuppet {
    return new WingPuppet(this, x, y);
  }

  private destroyRainbowPath(): void {
    if (this.currentRainbowPath) {
      this.tweens.killTweensOf(this.currentRainbowPath);
      this.currentRainbowPath.destroy();
      this.currentRainbowPath = undefined;
    }
  }

  private drawRainbowPath(x: number, y: number): void {
    this.destroyRainbowPath();
    const path = this.add
      .image(x, y, "rainbow-path")
      .setDepth(1)
      .setOrigin(0.18, 0.78)
      .setAlpha(0);
    this.currentRainbowPath = path;
    this.tweens.add({
      targets: path,
      alpha: 1,
      duration: 550,
      ease: "Sine.easeOut",
    });
  }

  private sendGuestAlongRainbowPath(stop: StarStop): void {
    const guest = this.guests.get(stop);
    if (!guest) return;
    this.tweens.killTweensOf(guest);
    this.tweens.add({
      targets: guest,
      x: guest.x + 620,
      y: 450,
      scale: guest.scale * 0.85,
      angle: -4,
      duration: 680,
      ease: "Sine.easeInOut",
      onComplete: () => this.tweens.add({ targets: guest, alpha: 0, duration: 180 }),
    });
  }

  private drawCastle(graphics: Phaser.GameObjects.Graphics, x: number, groundY: number): void {
    graphics.fillStyle(0xf4c45c, 1).fillRoundedRect(x, groundY - 270, 560, 300, 25);
    graphics.fillStyle(0xe7a643, 1);
    [x + 15, x + 185, x + 355, x + 525].forEach((towerX) => graphics.fillRect(towerX, groundY - 370, 90, 400));
    graphics.fillStyle(0x866fc3, 1).fillTriangle(x - 10, groundY - 370, x + 60, groundY - 470, x + 130, groundY - 370);
    graphics.fillTriangle(x + 160, groundY - 370, x + 230, groundY - 470, x + 300, groundY - 370);
    graphics.fillTriangle(x + 330, groundY - 370, x + 400, groundY - 470, x + 470, groundY - 370);
    graphics.fillStyle(0x8b4d78, 1).fillRoundedRect(x + 225, groundY - 160, 110, 190, 55);
    graphics.fillStyle(0xf1e8ff, 1).fillCircle(x + 280, groundY - 235, 48);
  }
}

export const GAME_SIZE = { width: VIEW_WIDTH, height: VIEW_HEIGHT } as const;
