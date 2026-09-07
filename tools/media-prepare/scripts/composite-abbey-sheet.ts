import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const ABBEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/abbey");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const GROUND_Y = 560;

  // Paths
  const farLayerPath = path.join(ABBEY_DIR, "far/far-layer.png");
  const cloisterArcadePath = path.join(ABBEY_DIR, "middle/cloister-arcade.png");
  const bellTowerBelfryPath = path.join(ABBEY_DIR, "middle/bell-tower-belfry.png");
  const roseWindowWallPath = path.join(ABBEY_DIR, "middle/rose-window-wall.png");
  const stoneFountainPath = path.join(SHARED_DIR, "stone-fountain.png");
  const stoneTerraceGroundPath = path.join(ABBEY_DIR, "near/stone-terrace-ground.png");
  const lavenderHerbBorderPath = path.join(ABBEY_DIR, "near/lavender-herb-border.png");
  const vaultedArchCanopyPath = path.join(ABBEY_DIR, "near/vaulted-arch-canopy.png");
  const cypressPath = path.join(SHARED_DIR, "cypress-tree.png");
  const cloudBankPath = path.join(SHARED_DIR, "cloud-bank.png");
  const bellRopePath = path.join(ABBEY_DIR, "cutouts/bell-rope.png");
  const abbeyBellPath = path.join(ABBEY_DIR, "cutouts/abbey-bell.png");
  const starSparklePath = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");
  const rainbowArchwayPath = path.join(SHARED_DIR, "rainbow-archway.png");
  const popPath = path.join(JOURNEY_DIR, "family-guest-pop.png");

  // Verify all source assets exist
  const requiredFiles = [
    farLayerPath, cloisterArcadePath, bellTowerBelfryPath, roseWindowWallPath,
    stoneFountainPath, stoneTerraceGroundPath, lavenderHerbBorderPath, vaultedArchCanopyPath,
    cypressPath, cloudBankPath, bellRopePath, abbeyBellPath,
    starSparklePath, rainbowArchwayPath, popPath,
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(f)) {
      throw new Error(`Missing asset for contact sheet: ${f}`);
    }
  }

  // 1. Far layer slice (1280x720)
  const farResized = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 880, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  // 2. Flight Stage frame (Frame A)
  const roseWindowResized = await sharp(roseWindowWallPath)
    .resize({ height: 320 })
    .toBuffer();
  const belfryResized = await sharp(bellTowerBelfryPath)
    .resize({ height: 480 })
    .toBuffer();
  const fountainResized = await sharp(stoneFountainPath)
    .resize({ height: 210 })
    .toBuffer();
  const cypressResized = await sharp(cypressPath)
    .resize({ height: 420 })
    .toBuffer();
  const cloudResized = await sharp(cloudBankPath)
    .resize({ width: 500 })
    .toBuffer();
  const stoneTerraceResized = await sharp(stoneTerraceGroundPath)
    .resize(STAGE_WIDTH, 200)
    .toBuffer();
  const lavenderHerbResized = await sharp(lavenderHerbBorderPath)
    .resize(STAGE_WIDTH, 180)
    .toBuffer();
  const vaultedCanopyResized = await sharp(vaultedArchCanopyPath)
    .resize(STAGE_WIDTH, 220)
    .toBuffer();
  const obstacleResized = await sharp(bellRopePath)
    .resize({ height: 130 })
    .toBuffer();
  const springboardResized = await sharp(abbeyBellPath)
    .resize({ height: 140 })
    .toBuffer();
  const sparkleResized = await sharp(starSparklePath)
    .resize({ height: 70 })
    .toBuffer();

  const frameA = await sharp(farResized)
    .composite([
      { input: cloudResized, left: 60, top: 30 },
      { input: cypressResized, left: 750, top: GROUND_Y - 420 },
      { input: roseWindowResized, left: 80, top: GROUND_Y - 300 },
      { input: fountainResized, left: 540, top: GROUND_Y - 210 },
      { input: belfryResized, left: 950, top: GROUND_Y - 480 },
      { input: stoneTerraceResized, left: 0, top: GROUND_Y - 50 },
      { input: lavenderHerbResized, left: 0, top: GROUND_Y - 90 },
      { input: vaultedCanopyResized, left: 0, top: 0 },
      { input: springboardResized, left: 340, top: GROUND_Y - 140 },
      { input: obstacleResized, left: 720, top: GROUND_Y - 130 },
      { input: sparkleResized, left: 400, top: 180 },
      { input: sparkleResized, left: 500, top: 140 },
    ])
    .png()
    .toBuffer();

  // 3. Arrival Stage frame (Frame B)
  const cloisterArcadeResized = await sharp(cloisterArcadePath)
    .resize(STAGE_WIDTH, Math.round(STAGE_WIDTH * (1024 / 3072)))
    .toBuffer();
  const archwayResized = await sharp(rainbowArchwayPath)
    .resize({ height: 460 })
    .toBuffer();
  const popResized = await sharp(popPath)
    .resize({ height: 260 })
    .toBuffer();

  const farArrival = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  const frameB = await sharp(farArrival)
    .composite([
      { input: cloisterArcadeResized, left: 0, top: GROUND_Y - 420 },
      { input: stoneTerraceResized, left: 0, top: GROUND_Y - 50 },
      { input: lavenderHerbResized, left: 0, top: GROUND_Y - 90 },
      { input: vaultedCanopyResized, left: 0, top: 0 },
      { input: archwayResized, left: 700, top: GROUND_Y - 460 },
      { input: popResized, left: 770, top: GROUND_Y - 260 },
      { input: sparkleResized, left: 780, top: 120 },
    ])
    .png()
    .toBuffer();

  // 4. Combine side-by-side into contact sheet (2560 x 720)
  const contactSheet = await sharp({
    create: {
      width: STAGE_WIDTH * 2,
      height: STAGE_HEIGHT,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: frameA, left: 0, top: 0 },
      { input: frameB, left: STAGE_WIDTH, top: 0 },
    ])
    .png()
    .toBuffer();

  const outPath = path.join(ABBEY_DIR, "contact-sheet.png");
  await sharp(contactSheet).toFile(outPath);
  console.log(`Saved contact sheet to ${outPath} (${STAGE_WIDTH * 2}x${STAGE_HEIGHT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
