import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const CASTLE_DIR = path.join(REPO_ROOT, "shared/edition/source-media/castle");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const GROUND_Y = 560;

  // Paths
  const farLayerPath = path.join(CASTLE_DIR, "far/far-layer.png");
  const gatehousePavilionPath = path.join(CASTLE_DIR, "middle/gatehouse-pavilion.png");
  const terraceBalustradePath = path.join(CASTLE_DIR, "middle/terrace-balustrade-row.png");
  const mosaicTowerPath = path.join(CASTLE_DIR, "middle/mosaic-tower-spire.png");
  const festiveBannerPostPath = path.join(SHARED_DIR, "festive-banner-post.png");
  const mosaicStoneGroundPath = path.join(CASTLE_DIR, "near/mosaic-stone-ground.png");
  const coastalFlowerBorderPath = path.join(CASTLE_DIR, "near/coastal-flower-border.png");
  const palaceGarlandCanopyPath = path.join(CASTLE_DIR, "near/palace-garland-canopy.png");
  const cypressPath = path.join(SHARED_DIR, "cypress-tree.png");
  const cloudBankPath = path.join(SHARED_DIR, "cloud-bank.png");
  const castleBuntingPath = path.join(CASTLE_DIR, "cutouts/castle-bunting.png");
  const castleDrumPath = path.join(CASTLE_DIR, "cutouts/castle-drum.png");
  const starSparklePath = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");
  const rainbowArchwayPath = path.join(SHARED_DIR, "rainbow-archway.png");
  const dadPath = path.join(JOURNEY_DIR, "family-guest-dad.png");

  // Verify all source assets exist
  const requiredFiles = [
    farLayerPath, gatehousePavilionPath, terraceBalustradePath, mosaicTowerPath,
    festiveBannerPostPath, mosaicStoneGroundPath, coastalFlowerBorderPath, palaceGarlandCanopyPath,
    cypressPath, cloudBankPath, castleBuntingPath, castleDrumPath,
    starSparklePath, rainbowArchwayPath, dadPath,
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(f)) {
      throw new Error(`Missing asset for contact sheet: ${f}`);
    }
  }

  // 1. Far layer slice (1280x720)
  const farResized = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 400, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  // 2. Flight Stage frame (Frame A)
  const balustradeResized = await sharp(terraceBalustradePath)
    .resize({ height: 300 })
    .toBuffer();
  const towerResized = await sharp(mosaicTowerPath)
    .resize({ height: 480 })
    .toBuffer();
  const bannerPostResized = await sharp(festiveBannerPostPath)
    .resize({ height: 220 })
    .toBuffer();
  const cypressResized = await sharp(cypressPath)
    .resize({ height: 420 })
    .toBuffer();
  const cloudResized = await sharp(cloudBankPath)
    .resize({ width: 500 })
    .toBuffer();
  const mosaicStoneResized = await sharp(mosaicStoneGroundPath)
    .resize(STAGE_WIDTH, 200)
    .toBuffer();
  const coastalFlowerResized = await sharp(coastalFlowerBorderPath)
    .resize(STAGE_WIDTH, 180)
    .toBuffer();
  const canopyResized = await sharp(palaceGarlandCanopyPath)
    .resize(STAGE_WIDTH, 220)
    .toBuffer();
  const obstacleResized = await sharp(castleBuntingPath)
    .resize({ height: 130 })
    .toBuffer();
  const springboardResized = await sharp(castleDrumPath)
    .resize({ height: 140 })
    .toBuffer();
  const sparkleResized = await sharp(starSparklePath)
    .resize({ height: 70 })
    .toBuffer();

  const frameA = await sharp(farResized)
    .composite([
      { input: cloudResized, left: 60, top: 30 },
      { input: cypressResized, left: 750, top: GROUND_Y - 420 },
      { input: balustradeResized, left: 80, top: GROUND_Y - 280 },
      { input: bannerPostResized, left: 540, top: GROUND_Y - 220 },
      { input: towerResized, left: 950, top: GROUND_Y - 480 },
      { input: mosaicStoneResized, left: 0, top: GROUND_Y - 50 },
      { input: coastalFlowerResized, left: 0, top: GROUND_Y - 90 },
      { input: canopyResized, left: 0, top: 0 },
      { input: springboardResized, left: 340, top: GROUND_Y - 140 },
      { input: obstacleResized, left: 720, top: GROUND_Y - 130 },
      { input: sparkleResized, left: 400, top: 180 },
      { input: sparkleResized, left: 500, top: 140 },
    ])
    .png()
    .toBuffer();

  // 3. Arrival Stage frame (Frame B)
  const gatehousePavilionResized = await sharp(gatehousePavilionPath)
    .resize(STAGE_WIDTH, Math.round(STAGE_WIDTH * (1024 / 3072)))
    .toBuffer();
  const archwayResized = await sharp(rainbowArchwayPath)
    .resize({ height: 460 })
    .toBuffer();
  const dadResized = await sharp(dadPath)
    .resize({ height: 260 })
    .toBuffer();

  const farArrival = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: Math.round(3072 * (720 / 1024)) - STAGE_WIDTH, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  const frameB = await sharp(farArrival)
    .composite([
      { input: gatehousePavilionResized, left: 0, top: GROUND_Y - 420 },
      { input: mosaicStoneResized, left: 0, top: GROUND_Y - 50 },
      { input: coastalFlowerResized, left: 0, top: GROUND_Y - 90 },
      { input: canopyResized, left: 0, top: 0 },
      { input: archwayResized, left: 700, top: GROUND_Y - 460 },
      { input: dadResized, left: 770, top: GROUND_Y - 260 },
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

  const outPath = path.join(CASTLE_DIR, "contact-sheet.png");
  await sharp(contactSheet).toFile(outPath);
  console.log(`Saved contact sheet to ${outPath} (${STAGE_WIDTH * 2}x${STAGE_HEIGHT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
