import Phaser from "phaser";

import {
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
  SPRITE_ANIMATIONS,
  DEFAULT_RUNNER_CONFIG,
  type RunnerState,
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
  onBump: () => void;
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
  private sparkleTrail!: Phaser.GameObjects.Particles.ParticleEmitter;

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
    this.guests.clear();
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
  }

  jumpInput(): void {
    if (this.frozen) return;
    this.runnerState = handleJumpInput(this.runnerState);
  }

  update(_time: number, delta: number): void {
    if (this.frozen) return;

    const pointerHeld = this.input.activePointer?.isDown ?? false;
    const isFlutterHeld = Boolean(this.spaceKey?.isDown || pointerHeld || this.touchHeld);
    const deltaSeconds = Math.min(delta / 1000, 0.1);

    this.runnerState = updateRunner(this.runnerState, deltaSeconds, isFlutterHeld);

    this.player.x = this.runnerState.x;
    this.player.y = this.runnerState.y;

    const animState = getSpriteAnimationState(this.runnerState);
    const animConfig = SPRITE_ANIMATIONS[animState];
    if (this.player.anims.currentAnim?.key !== animConfig.key) {
      this.player.play(animConfig.key, true);
    }

    if (this.runnerState.isGrounded || animState === "flutter" || animState === "stumble") {
      this.player.rotation = 0;
    } else {
      const targetAngle = Phaser.Math.Clamp(this.runnerState.velocityY * 0.025, -8, 10);
      this.player.rotation = Phaser.Math.DegToRad(targetAngle);
    }

    const stop = STOP_STORIES[this.nextStop];
    if (stop && (this.runnerState.courseCompleted || this.player.x >= this.stopX(this.nextStop))) {
      this.gatherStar(stop);
    }
  }

  getRunnerState(): RunnerState {
    return this.runnerState;
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
    return this.player?.anims?.currentAnim?.key;
  }

  triggerStumble(): void {
    if (this.frozen) return;
    this.runnerState = triggerPlayfulStumble(this.runnerState);
    this.player.play(SPRITE_ANIMATIONS.stumble.key, false);
    this.callbacks.onBump();
  }

  getJourney(): Journey {
    return this.journey;
  }

  seekToEnd(): void {
    const stop = STOP_STORIES[this.nextStop];
    if (!stop) return;
    this.runnerState = {
      ...this.runnerState,
      x: this.stopX(this.nextStop),
      courseCompleted: true,
    };
    this.player.x = this.runnerState.x;
    this.gatherStar(stop);
  }

  setTouchHeld(held: boolean): void { this.touchHeld = held; }

  continueAfterBirthdayStar(): void {
    if (this.journey.phase === "celebrating") {
      this.callbacks.onCelebration();
      return;
    }
    this.runnerState = {
      ...this.runnerState,
      courseCompleted: false,
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

  private gatherStar(stop: StopStory): void {
    this.journey = collectBirthdayStar(this.journey, stop.id);
    this.drawRainbowPath(this.stopX(this.nextStop) - 290, 580);
    this.sendGuestAlongRainbowPath(stop.id);
    const star = this.children.getByName(`star-${stop.id}`);
    if (star) {
      this.tweens.add({ targets: star, scale: 2.4, alpha: 0, angle: 180, duration: 520, ease: "Back.easeIn" });
    }
    this.cameras.main.flash(250, 255, 232, 150, false);
    this.nextStop += 1;
    this.pauseMotion();
    this.time.delayedCall(720, () => {
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

      const starY = 245 + (index % 3) * 80;
      const star = this.add.star(this.stopX(index), starY, 7, 23, 49, 0xffd65e, 1)
        .setStrokeStyle(7, 0xfff7c8, 1).setDepth(3).setName(`star-${stop.id}`);
      this.tweens.add({ targets: star, scale: 1.14, angle: 10, yoyo: true, repeat: -1, duration: 650 + index * 50, ease: "Sine.easeInOut" });
      this.add.circle(this.stopX(index), starY, 76, 0xffed97, .18).setDepth(2);
      this.guests.set(stop.id, this.createGuest(this.stopX(index) + 115, 575, stop.guest));
    });

    this.drawCastle(backgrounds, WORLD_WIDTH - 850, 520);
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

  private createGuest(x: number, groundY: number, name: FamilyGuest): Phaser.GameObjects.Container {
    const guest = this.add.container(x, groundY).setDepth(2);
    if (name === "Beasley") {
      const body = this.add.ellipse(0, 0, 64, 42, 0xf39a38);
      const head = this.add.circle(29, -22, 25, 0xf39a38);
      const chest = this.add.ellipse(13, -3, 23, 35, 0xfff5df);
      const ears = [this.add.triangle(12, -43, 0, 20, 18, 0, 28, 24, 0xf39a38), this.add.triangle(43, -43, 0, 24, 12, 0, 25, 22, 0xf39a38)];
      guest.add([body, head, chest, ...ears]);
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
      const layers: Phaser.GameObjects.GameObject[] = [...legs, ...shoes];
      if (longHair) layers.push(longHair);
      layers.push(body);
      if (name === "Dad" || name === "Uncle") layers.push(this.add.rectangle(0, -31, 17, 62, 0xfff8e9));
      layers.push(head, hair, ...hairDetails, smile);
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
