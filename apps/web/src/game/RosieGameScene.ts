import Phaser from "phaser";

import {
  acquireStorybookStamp,
  collectBirthdayStar,
  createJourney,
  resumeJourney,
  type Journey,
  type StarStop,
} from "../domain/journey";
import {
  createRunnerState,
  handleJumpInput,
  updateRunner,
  triggerPlayfulStumble,
  getSpriteAnimationState,
  checkObstacleEncounters,
  checkSpringboardEncounters,
  checkSparkleEncounters,
  SPRITE_ANIMATIONS,
  DEFAULT_RUNNER_CONFIG,
  DEFAULT_ROSE_GARDEN_OBSTACLES,
  DEFAULT_ROSE_GARDEN_SPRINGBOARDS,
  DEFAULT_ROSE_GARDEN_SPARKLES,
  AUTHORED_RAINBOW_ARCHWAYS,
  checkArchwayArrival,
  type RunnerState,
  type PlayfulObstacle,
  type Springboard,
  type StarSparkle,
  type RainbowArchway,
} from "../domain/gallop-and-flutter";
import { STOP_STORIES, type FamilyGuest, type StopStory } from "./content";

const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;
const SEGMENT_WIDTH = 1700;
const WORLD_WIDTH = SEGMENT_WIDTH * STOP_STORIES.length + 500;

interface GuestStyle {
  clothes: number;
  hair: number;
  trousers: number;
  hairStyle: "long" | "curls" | "short" | "bun" | "pompadour";
}

const GUEST_STYLES: Record<Exclude<FamilyGuest, "Beasley">, GuestStyle> = {
  Mom: { clothes: 0xef719f, hair: 0xc49b68, trousers: 0x5683b3, hairStyle: "long" },
  Dad: { clothes: 0x4e8eb8, hair: 0x76503c, trousers: 0x6a705f, hairStyle: "short" },
  Pop: { clothes: 0xf0c171, hair: 0xd8aa72, trousers: 0x80664f, hairStyle: "short" },
  Gram: { clothes: 0x9d72bd, hair: 0x73503f, trousers: 0x76507f, hairStyle: "curls" },
  Aunt: { clothes: 0x57a49b, hair: 0xb38b5f, trousers: 0x755a94, hairStyle: "bun" },
  Uncle: { clothes: 0x477fa8, hair: 0x654333, trousers: 0x3e5770, hairStyle: "pompadour" },
};

type LandscapeDrawer = (graphics: Phaser.GameObjects.Graphics, start: number) => void;

const LANDSCAPE_DRAWERS: Record<StarStop, LandscapeDrawer> = {
  garden: (graphics, start) => {
    graphics.fillStyle(0x5ca364, 1);
    graphics.fillRect(start, 560, SEGMENT_WIDTH, 160);
    graphics.fillStyle(0x73b97b, 1);
    graphics.fillRoundedRect(start, 555, SEGMENT_WIDTH, 20, 8);
    for (let rose = 0; rose < 16; rose += 1) {
      const x = start + 40 + rose * 105;
      const y = 575 + (rose % 3) * 20;
      graphics.fillStyle(rose % 2 ? 0xf05a9d : 0xff9abb, 1).fillCircle(x, y, 15).fillCircle(x + 14, y, 15).fillCircle(x + 7, y - 12, 15);
    }
  },
  lacewood: (graphics, start) => {
    graphics.fillEllipse(start + 520, 690, 1200, 330).fillEllipse(start + 1340, 665, 1050, 290);
    for (let tree = 0; tree < 12; tree += 1) {
      const x = start + 60 + tree * 145;
      graphics.fillStyle(0x5e765a, 1).fillRect(x, 410, 28, 230);
      graphics.fillStyle(0x397a5b, 1).fillCircle(x + 10, 390, 78);
      graphics.lineStyle(5, 0xf8f5ff, .8).beginPath().moveTo(x - 65, 420).lineTo(x + 78, 505).strokePath();
    }
  },
  abbey: (graphics, start) => {
    graphics.fillEllipse(start + 520, 690, 1200, 330).fillEllipse(start + 1340, 665, 1050, 290);
    graphics.fillStyle(0xf2d292, 1).fillRoundedRect(start + 760, 300, 470, 330, 35);
    graphics.fillStyle(0xe3ad54, 1).fillTriangle(start + 715, 320, start + 995, 150, start + 1280, 320);
    graphics.fillStyle(0x7e71c7, 1).fillCircle(start + 995, 390, 65);
    graphics.fillStyle(0xffd65e, 1).fillCircle(start + 900, 218, 34).fillCircle(start + 1080, 218, 34);
  },
  clouds: (graphics, start) => {
    graphics.fillStyle(0xf4fbff, .95).fillEllipse(start + 850, 670, 1850, 220);
    for (let arch = 0; arch < 6; arch += 1) {
      graphics.lineStyle(20, 0xfff1db, .72).strokeCircle(start + 220 + arch * 280, 400, 125);
    }
  },
  peak: (graphics, start) => {
    graphics.fillEllipse(start + 520, 690, 1200, 330).fillEllipse(start + 1340, 665, 1050, 290);
    graphics.fillStyle(0x6d7f70, 1).fillTriangle(start, 650, start + 920, 120, start + 1700, 650);
    graphics.fillStyle(0xf5e3ed, 1);
    for (let flower = 0; flower < 20; flower += 1) graphics.fillCircle(start + 90 + flower * 77, 590 - (flower % 5) * 28, 10);
  },
  sea: (graphics, start) => {
    graphics.fillRect(start, 520, SEGMENT_WIDTH, 200);
    graphics.lineStyle(9, 0xa7efff, .55);
    for (let wave = 0; wave < 9; wave += 1) graphics.strokeCircle(start + 90 + wave * 210, 555 + (wave % 2) * 45, 100);
  },
  castle: (graphics, start) => {
    graphics.fillEllipse(start + 520, 690, 1200, 330).fillEllipse(start + 1340, 665, 1050, 290);
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
  private player!: Phaser.GameObjects.Sprite;
  private spaceKey: Phaser.Input.Keyboard.Key | undefined;
  private touchHeld = false;
  private frozen = false;
  private nextStop = 0;
  private readonly guests = new Map<StarStop, Phaser.GameObjects.Container>();
  private readonly archways = new Map<StarStop, RainbowArchway>();
  private readonly archwayContainers = new Map<StarStop, Phaser.GameObjects.Container>();
  private readonly obstacles: PlayfulObstacle[] = [...DEFAULT_ROSE_GARDEN_OBSTACLES];
  private readonly obstacleContainers = new Map<string, Phaser.GameObjects.Container>();
  private readonly springboards: Springboard[] = [...DEFAULT_ROSE_GARDEN_SPRINGBOARDS];
  private readonly springboardContainers = new Map<string, Phaser.GameObjects.Container>();
  private readonly sparkles: StarSparkle[] = [...DEFAULT_ROSE_GARDEN_SPARKLES];
  private readonly sparkleContainers = new Map<string, Phaser.GameObjects.Container>();
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
    this.load.spritesheet("rosie-stella", "assets/rosie-stella-spritesheet.png", {
      frameWidth: 256,
      frameHeight: 256,
    });
    STOP_STORIES.forEach((stop) => {
      if (stop.placeIllustration) {
        this.load.image(`place-illustration-${stop.id}`, stop.placeIllustration);
      }
    });
  }

  create(): void {
    this.journey = createJourney();
    this.runnerState = createRunnerState({ x: 200, y: DEFAULT_RUNNER_CONFIG.groundY });
    this.nextStop = 0;
    this.frozen = false;
    this.reunionInProgress = false;
    this.ready = false;
    this.guests.clear();
    this.archways.clear();
    this.archwayContainers.clear();
    this.obstacleContainers.clear();
    this.springboardContainers.clear();
    this.sparkleContainers.clear();
    this.totalSparklesCollected = 0;
    this.createTextures();
    this.createAnimations();
    this.createWorld();
    this.player = this.createPlayer(this.runnerState.x, this.runnerState.y);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, VIEW_HEIGHT);
    this.cameras.main.startFollow(this.player, true, .08, .08, -340, 0);
    this.cameras.main.setBackgroundColor("#8bd8f1");
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey?.on("down", () => this.jumpInput());
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
      followOffset: { x: -65, y: 15 },
    });
    particles.setDepth(18);
    this.sparkleTrail = particles;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.spaceKey?.removeAllListeners();
      this.input.removeAllListeners();
    });
    this.ready = true;
  }

  jumpInput(): void {
    if (this.frozen) return;
    this.runnerState = handleJumpInput(this.runnerState);
    if (this.runnerState.mode === "flapping") {
      this.player.play(SPRITE_ANIMATIONS.leap.key, false);
    }
  }

  update(_time: number, delta: number): void {
    if (this.frozen) return;

    const pointerHeld = this.input.activePointer?.isDown ?? false;
    const isFlutterHeld = Boolean(this.spaceKey?.isDown || pointerHeld || this.touchHeld);
    const deltaSeconds = Math.min(delta / 1000, 0.1);

    this.runnerState = updateRunner(this.runnerState, deltaSeconds, isFlutterHeld);

    const encounter = checkObstacleEncounters(this.runnerState, this.obstacles);
    this.runnerState = encounter.state;

    if (encounter.stumbledObstacle) {
      this.handleObstacleStumble(encounter.stumbledObstacle);
    } else if (encounter.nearMissObstacle) {
      this.handleObstacleNearMiss(encounter.nearMissObstacle);
    }

    const sbEncounter = checkSpringboardEncounters(this.runnerState, this.springboards);
    this.runnerState = sbEncounter.state;
    if (sbEncounter.bouncedSpringboard) {
      this.handleSpringboardBounce(sbEncounter.bouncedSpringboard);
    }

    const spEncounter = checkSparkleEncounters(this.runnerState, this.sparkles);
    this.runnerState = spEncounter.state;
    if (spEncounter.collectedSparkle) {
      this.handleSparkleCollected(spEncounter.collectedSparkle);
    }

    this.player.x = this.runnerState.x;
    this.player.y = this.runnerState.y;

    const animState = getSpriteAnimationState(this.runnerState);
    const animConfig = SPRITE_ANIMATIONS[animState];
    if (this.player.anims.getName() !== animConfig.key) {
      this.player.play(animConfig.key, true);
    }

    let targetAngle = 0;
    if (!this.runnerState.isGrounded && animState !== "flutter" && animState !== "stumble") {
      const deg = Phaser.Math.Clamp(this.runnerState.velocityY * 0.025, -8, 10);
      targetAngle = Phaser.Math.DegToRad(deg);
    }
    this.player.rotation = Phaser.Math.Linear(this.player.rotation, targetAngle, Math.min(1, deltaSeconds * 14));

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

  hasSpriteSheet(): boolean {
    return (
      this.textures.exists("rosie-stella") &&
      this.anims.exists(SPRITE_ANIMATIONS.gallop.key) &&
      this.anims.exists(SPRITE_ANIMATIONS.leap.key) &&
      this.anims.exists(SPRITE_ANIMATIONS.flutter.key) &&
      this.anims.exists(SPRITE_ANIMATIONS.stumble.key)
    );
  }

  getCurrentAnimation(): string | undefined {
    return this.player?.anims?.getName();
  }

  triggerStumble(): void {
    if (this.frozen) return;
    this.runnerState = triggerPlayfulStumble(this.runnerState);
    this.player.play(SPRITE_ANIMATIONS.stumble.key, false);
    this.callbacks.onStumble();
  }

  getObstacles(): readonly PlayfulObstacle[] {
    return this.obstacles;
  }

  getSpringboards(): readonly Springboard[] {
    return this.springboards;
  }

  getSparkles(): readonly StarSparkle[] {
    return this.sparkles;
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

  getArchway(stopId: StarStop = "garden"): RainbowArchway | undefined {
    return this.archways.get(stopId);
  }

  isGuestWaving(stopId: StarStop = "garden"): boolean {
    const guest = this.guests.get(stopId);
    return Boolean(guest?.getData("isWaving"));
  }

  getAcquiredStamps(): readonly StarStop[] {
    return this.journey.acquiredStamps;
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
    this.runnerState = {
      ...this.runnerState,
      courseCompleted: false,
      arrivedAtArchway: false,
      pausedForReunion: false,
    };
    this.resumeMotion();
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
    this.resumeMotion();
  }

  private pauseMotion(): void {
    this.frozen = true;
    this.sparkleTrail?.pause();
  }

  private resumeMotion(): void {
    this.frozen = false;
    this.sparkleTrail?.resume();
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
    this.pauseMotion();

    const star = this.children.getByName(`star-${stop.id}`) as Phaser.GameObjects.Star | null;
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
      this.drawRainbowPath(this.stopX(this.nextStop) - 290, 580);
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
    if (!this.textures.exists("rosie-stella")) return;
    Object.values(SPRITE_ANIMATIONS).forEach((anim) => {
      if (!this.anims.exists(anim.key)) {
        this.anims.create({
          key: anim.key,
          frames: this.anims.generateFrameNumbers("rosie-stella", {
            start: anim.startFrame,
            end: anim.endFrame,
          }),
          frameRate: anim.frameRate,
          repeat: anim.repeat,
        });
      }
    });
  }

  private createWorld(): void {
    const backgrounds = this.add.graphics().setDepth(-30);
    const distant = this.add.graphics().setDepth(-20);

    STOP_STORIES.forEach((stop, index) => {
      const start = index * SEGMENT_WIDTH;
      if (stop.placeIllustration) {
        const illustration = this.add.image(start, 0, `place-illustration-${stop.id}`).setOrigin(0, 0).setDepth(-30);
        illustration.setDisplaySize(SEGMENT_WIDTH + 4, VIEW_HEIGHT);
      } else {
        backgrounds.fillStyle(stop.sky, 1).fillRect(start, 0, SEGMENT_WIDTH + 4, VIEW_HEIGHT);
        this.drawClouds(distant, start, index);
      }
      this.drawLandscape(backgrounds, start, stop);
      this.add.text(start + 430, 118, stop.place, {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#ffffff",
        stroke: "#7d4670",
        strokeThickness: 7,
      }).setDepth(-5).setAlpha(.92);

      const archway = AUTHORED_RAINBOW_ARCHWAYS[stop.id];
      this.archways.set(stop.id, archway);
      const archwayContainer = this.createRainbowArchway(archway);
      this.archwayContainers.set(stop.id, archwayContainer);

      const starY = 245 + (index % 3) * 80;
      const star = this.add.star(archway.x, starY, 7, 23, 49, 0xffd65e, 1)
        .setStrokeStyle(7, 0xfff7c8, 1).setDepth(18).setName(`star-${stop.id}`);
      this.tweens.add({ targets: star, scale: 1.14, angle: 10, yoyo: true, repeat: -1, duration: 650 + index * 50, ease: "Sine.easeInOut" });
      this.add.circle(archway.x, starY, 76, 0xffed97, .18).setDepth(17);
      this.guests.set(stop.id, this.createGuest(archway.x + 95, 575, stop.guest));
    });

    this.obstacles.forEach((obstacle) => {
      const container = this.createObstacle(obstacle);
      this.obstacleContainers.set(obstacle.id, container);
    });

    this.springboards.forEach((springboard) => {
      const container = this.createSpringboard(springboard);
      this.springboardContainers.set(springboard.id, container);
    });

    this.sparkles.forEach((sparkle) => {
      const container = this.createSparkle(sparkle);
      this.sparkleContainers.set(sparkle.id, container);
    });

    this.drawCastle(backgrounds, WORLD_WIDTH - 850, 520);
  }

  private createObstacle(obstacle: PlayfulObstacle): Phaser.GameObjects.Container {
    const container = this.add.container(obstacle.x, obstacle.y).setDepth(15);
    container.setName(`obstacle-${obstacle.id}`);

    const bush = this.add.graphics();
    bush.fillStyle(0x3e7a46, 1);
    bush.fillEllipse(0, -obstacle.height * 0.45, obstacle.width, obstacle.height * 0.85);
    bush.fillStyle(0x5ca364, 1);
    bush.fillCircle(-obstacle.width * 0.22, -obstacle.height * 0.5, obstacle.width * 0.28);
    bush.fillCircle(obstacle.width * 0.22, -obstacle.height * 0.5, obstacle.width * 0.28);
    bush.fillCircle(0, -obstacle.height * 0.65, obstacle.width * 0.32);

    bush.fillStyle(0xf05a9d, 1);
    bush.fillCircle(-14, -obstacle.height * 0.48, 9);
    bush.fillCircle(14, -obstacle.height * 0.42, 10);
    bush.fillCircle(0, -obstacle.height * 0.72, 11);

    bush.fillStyle(0xffd65e, 1);
    bush.fillCircle(-14, -obstacle.height * 0.48, 3.5);
    bush.fillCircle(14, -obstacle.height * 0.42, 3.5);
    bush.fillCircle(0, -obstacle.height * 0.72, 4);

    container.add(bush);
    return container;
  }

  private handleObstacleStumble(obstacle: PlayfulObstacle): void {
    this.player.play(SPRITE_ANIMATIONS.stumble.key, false);
    const container = this.obstacleContainers.get(obstacle.id);
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

    const graphics = this.add.graphics();
    // Broad green foliage base on Storybook Ground
    graphics.fillStyle(0x2f6838, 1);
    graphics.fillEllipse(0, -springboard.height * 0.25, springboard.width * 0.95, springboard.height * 0.45);
    graphics.fillStyle(0x4a9456, 1);
    graphics.fillCircle(-springboard.width * 0.32, -springboard.height * 0.35, springboard.width * 0.24);
    graphics.fillCircle(springboard.width * 0.32, -springboard.height * 0.35, springboard.width * 0.24);

    // Springy giant rose petals
    graphics.fillStyle(0xbe2567, 1);
    graphics.fillEllipse(0, -springboard.height * 0.65, springboard.width * 0.85, springboard.height * 0.65);
    graphics.fillStyle(0xef4f95, 1);
    graphics.fillCircle(-springboard.width * 0.2, -springboard.height * 0.68, springboard.width * 0.28);
    graphics.fillCircle(springboard.width * 0.2, -springboard.height * 0.68, springboard.width * 0.28);
    graphics.fillCircle(0, -springboard.height * 0.82, springboard.width * 0.32);

    // Soft blush inner highlights
    graphics.fillStyle(0xff9abb, 1);
    graphics.fillCircle(0, -springboard.height * 0.76, springboard.width * 0.22);

    // Resonant golden chime pistil center
    graphics.fillStyle(0xffdf63, 1);
    graphics.fillCircle(0, -springboard.height * 0.76, springboard.width * 0.12);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(0, -springboard.height * 0.76, 3);

    container.add(graphics);
    return container;
  }

  private handleSpringboardBounce(springboard: Springboard): void {
    this.callbacks.onSpringboard?.(springboard);
    const container = this.springboardContainers.get(springboard.id);
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

    const container = this.sparkleContainers.get(sparkle.id);
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
    for (let cloudIndex = 0; cloudIndex < 5; cloudIndex += 1) {
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
    guest.setData("isWaving", true);
    guest.setName(`guest-${name}`);
    if (name === "Beasley") {
      const body = this.add.ellipse(0, 0, 64, 42, 0xf39a38);
      const head = this.add.circle(29, -22, 25, 0xf39a38);
      const chest = this.add.ellipse(13, -3, 23, 35, 0xfff5df);
      const ears = [this.add.triangle(12, -43, 0, 20, 18, 0, 28, 24, 0xf39a38), this.add.triangle(43, -43, 0, 24, 12, 0, 25, 22, 0xf39a38)];
      const wavePaw = this.add.ellipse(32, -30, 12, 22, 0xf39a38);
      wavePaw.setOrigin(0.5, 0.85);
      wavePaw.angle = 20;
      this.tweens.add({
        targets: wavePaw,
        angle: { from: 5, to: 42 },
        yoyo: true,
        repeat: -1,
        duration: 320,
        ease: "Sine.easeInOut",
      });
      guest.add([body, head, chest, ...ears, wavePaw]);
    } else {
      const style = GUEST_STYLES[name];
      const skin = 0xffd7bd;
      const legs = [this.add.rectangle(-14, 19, 18, 54, style.trousers), this.add.rectangle(14, 19, 18, 54, style.trousers)];
      const shoes = [this.add.ellipse(-14, 47, 24, 12, name === "Uncle" ? 0x70452f : 0x5e4e5a), this.add.ellipse(14, 47, 24, 12, name === "Uncle" ? 0x70452f : 0x5e4e5a)];
      const body = this.add.ellipse(0, -27, 64, 82, style.clothes);
      const longHair = style.hairStyle === "long" ? this.add.ellipse(-2, -72, 64, 86, style.hair) : undefined;
      const head = this.add.circle(0, -88, 34, skin);
      const hair = this.add.ellipse(0, -106, 70, style.hairStyle === "pompadour" ? 34 : 42, style.hair)
        .setRotation(style.hairStyle === "pompadour" ? -.16 : 0);
      const hairDetails: Phaser.GameObjects.GameObject[] = [];
      if (style.hairStyle === "curls") {
        [-25, -12, 2, 16, 28].forEach((hairX, curlIndex) => hairDetails.push(this.add.circle(hairX, -108 - (curlIndex % 2) * 7, 13, style.hair)));
      } else if (style.hairStyle === "bun") {
        hairDetails.push(this.add.circle(19, -135, 18, style.hair), this.add.rectangle(-10, -108, 38, 10, style.hair).setRotation(.12));
      } else if (style.hairStyle === "pompadour") {
        hairDetails.push(this.add.ellipse(-12, -124, 48, 25, style.hair).setRotation(-.22));
      }
      const smile = this.add.arc(0, -82, 12, 20, 160, false, 0, 0).setStrokeStyle(3, 0x8f4a5b, 1);
      const waveArm = this.add.ellipse(26, -55, 14, 38, style.clothes);
      waveArm.setOrigin(0.5, 0.9);
      waveArm.angle = 20;
      this.tweens.add({
        targets: waveArm,
        angle: { from: 10, to: 48 },
        yoyo: true,
        repeat: -1,
        duration: 360,
        ease: "Sine.easeInOut",
      });
      const layers: Phaser.GameObjects.GameObject[] = [...legs, ...shoes];
      if (longHair) layers.push(longHair);
      layers.push(body);
      if (name === "Dad" || name === "Uncle") layers.push(this.add.rectangle(0, -31, 17, 62, 0xfff8e9));
      layers.push(head, hair, ...hairDetails, smile, waveArm);
      guest.add(layers);
    }
    guest.add(this.add.text(0, 32, name, { fontFamily: "Arial, sans-serif", fontStyle: "bold", fontSize: "20px", color: "#69395d", backgroundColor: "#fff8eacc", padding: { x: 9, y: 5 } }).setOrigin(.5));
    if (name === "Uncle") guest.setScale(1.14);
    this.tweens.add({ targets: guest, y: groundY - 7, yoyo: true, repeat: -1, duration: 780, ease: "Sine.easeInOut" });
    return guest;
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Sprite {
    const player = this.add.sprite(x, y, "rosie-stella").setDepth(20);
    player.setOrigin(0.5, 0.8);
    player.setScale(0.72);
    player.play(SPRITE_ANIMATIONS.gallop.key);
    return player;
  }

  private drawRainbowPath(x: number, y: number): void {
    const path = this.add.graphics().setDepth(1);
    [0xef5d9d, 0xf4a658, 0xf3d760, 0x67c984, 0x5bbce3, 0x9271d1].forEach((color, index) => {
      path.lineStyle(12, color, .9).beginPath().moveTo(x - 350, y + index * 9).lineTo(x + 350, y - 110 + index * 9).strokePath();
    });
    path.alpha = 0;
    this.tweens.add({ targets: path, alpha: 1, duration: 550 });
  }

  private sendGuestAlongRainbowPath(stop: StarStop): void {
    const guest = this.guests.get(stop);
    if (!guest) return;
    this.tweens.killTweensOf(guest);
    this.tweens.add({
      targets: guest,
      x: guest.x + 620,
      y: 450,
      scale: .72,
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

  private stopX(index: number): number { return index * SEGMENT_WIDTH + 1450; }
}

export const GAME_SIZE = { width: VIEW_WIDTH, height: VIEW_HEIGHT } as const;
