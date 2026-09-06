import Phaser from "phaser";
import {
  BODY_ORIGIN,
  BACK_WING_PIVOT,
  FRONT_WING_PIVOT,
  createPuppetKinematicState,
  getWingAttachmentOffset,
  updatePuppetKinematics,
  type PuppetAnimationName,
  type PuppetKinematicState,
} from "../domain/wing-puppet";
import type { RunnerState } from "../domain/gallop-and-flutter";

export const WING_PUPPET_TEXTURES = {
  backWing: "rosie-stella-back-wing",
  body: "rosie-stella-body",
  frontWing: "rosie-stella-front-wing",
} as const;

export class WingPuppet extends Phaser.GameObjects.Container {
  public readonly backWingImage: Phaser.GameObjects.Image;
  public readonly bodyImage: Phaser.GameObjects.Image;
  public readonly frontWingImage: Phaser.GameObjects.Image;

  private kinematics: PuppetKinematicState;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const backOffset = getWingAttachmentOffset("backWing");
    const frontOffset = getWingAttachmentOffset("frontWing");

    // 1. Back wing (drawn behind body)
    this.backWingImage = scene.add.image(backOffset.x, backOffset.y, WING_PUPPET_TEXTURES.backWing);
    this.backWingImage.setOrigin(BACK_WING_PIVOT.x, BACK_WING_PIVOT.y);

    // 2. Body (drawn in middle)
    this.bodyImage = scene.add.image(0, 0, WING_PUPPET_TEXTURES.body);
    this.bodyImage.setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);

    // 3. Front wing (drawn in front of body)
    this.frontWingImage = scene.add.image(frontOffset.x, frontOffset.y, WING_PUPPET_TEXTURES.frontWing);
    this.frontWingImage.setOrigin(FRONT_WING_PIVOT.x, FRONT_WING_PIVOT.y);

    // Add children strictly in draw order: back wing, body, front wing
    this.add([this.backWingImage, this.bodyImage, this.frontWingImage]);

    this.setDepth(20);

    this.kinematics = createPuppetKinematicState();
    this.setScale(this.kinematics.scaleX, this.kinematics.scaleY);
    this.frontWingImage.rotation = this.kinematics.frontWingRotation;
    this.backWingImage.rotation = this.kinematics.backWingRotation;

    scene.add.existing(this);
  }

  public getCurrentAnimation(): PuppetAnimationName {
    return this.kinematics.animationName;
  }

  public update(deltaSeconds: number, runnerState: RunnerState): void {
    this.kinematics = updatePuppetKinematics(this.kinematics, runnerState, deltaSeconds);

    this.x = runnerState.x;
    this.y = runnerState.y + this.kinematics.bobOffsetY;
    this.rotation = this.kinematics.containerRotation;
    this.setScale(this.kinematics.scaleX, this.kinematics.scaleY);

    this.frontWingImage.rotation = this.kinematics.frontWingRotation;
    this.backWingImage.rotation = this.kinematics.backWingRotation;
  }

  public hasPuppet(): boolean {
    return (
      this.scene.textures.exists(WING_PUPPET_TEXTURES.backWing) &&
      this.scene.textures.exists(WING_PUPPET_TEXTURES.body) &&
      this.scene.textures.exists(WING_PUPPET_TEXTURES.frontWing)
    );
  }

  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.kinematics = createPuppetKinematicState();
    this.setScale(this.kinematics.scaleX, this.kinematics.scaleY);
    this.frontWingImage.rotation = this.kinematics.frontWingRotation;
    this.backWingImage.rotation = this.kinematics.backWingRotation;
  }
}
