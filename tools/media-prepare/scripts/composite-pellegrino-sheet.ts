import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const PEAK_DIR = path.join(REPO_ROOT, "shared/edition/source-media/pellegrino-peak");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const GROUND_Y = 560;

  // Paths
  const farLayerPath = path.join(PEAK_DIR, "far/far-layer.png");
  const terraceOverlookPath = path.join(PEAK_DIR, "middle/terrace-overlook.png");
  const blossomTreePath = path.join(PEAK_DIR, "middle/blossom-tree.png");
  const floweredRidgePath = path.join(PEAK_DIR, "middle/flowered-ridge.png");
  const limestoneBoulderPath = path.join(SHARED_DIR, "limestone-boulder.png");
  const floweredGroundPath = path.join(PEAK_DIR, "near/flowered-ground.png");
  const wildflowerBorderPath = path.join(PEAK_DIR, "near/wildflower-border.png");
  const overhangCragPath = path.join(PEAK_DIR, "near/overhang-crag.png");
  const cypressPath = path.join(SHARED_DIR, "cypress-tree.png");
  const cloudBankPath = path.join(SHARED_DIR, "cloud-bank.png");
  const flowerBankPath = path.join(PEAK_DIR, "cutouts/flower-bank.png");
  const mountainBlossomPath = path.join(PEAK_DIR, "cutouts/mountain-blossom.png");
  const starSparklePath = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");
  const rainbowArchwayPath = path.join(SHARED_DIR, "rainbow-archway.png");
  const auntPath = path.join(JOURNEY_DIR, "family-guest-aunt.png");

  // Verify all source assets exist
  const requiredFiles = [
    farLayerPath,
    terraceOverlookPath,
    blossomTreePath,
    floweredRidgePath,
    limestoneBoulderPath,
    floweredGroundPath,
    wildflowerBorderPath,
    overhangCragPath,
    cypressPath,
    cloudBankPath,
    flowerBankPath,
    mountainBlossomPath,
    starSparklePath,
    rainbowArchwayPath,
    auntPath,
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
  const floweredRidgeResized = await sharp(floweredRidgePath)
    .resize({ height: 320 })
    .toBuffer();
  const treeResized = await sharp(blossomTreePath)
    .resize({ height: 480 })
    .toBuffer();
  const limestoneBoulderResized = await sharp(limestoneBoulderPath)
    .resize({ height: 180 })
    .toBuffer();
  const cypressResized = await sharp(cypressPath)
    .resize({ height: 420 })
    .toBuffer();
  const cloudResized = await sharp(cloudBankPath)
    .resize({ width: 500 })
    .toBuffer();
  const floweredGroundResized = await sharp(floweredGroundPath)
    .trim()
    .resize({ width: STAGE_WIDTH })
    .toBuffer();
  const groundMeta = await sharp(floweredGroundResized).metadata();
  const groundTop = STAGE_HEIGHT - (groundMeta.height ?? 300);

  const wildflowerBorderResized = await sharp(wildflowerBorderPath)
    .trim()
    .resize({ width: STAGE_WIDTH, height: 180, fit: "inside" })
    .toBuffer();

  const overhangCragResized = await sharp(overhangCragPath)
    .trim()
    .resize({ width: STAGE_WIDTH, height: 220, fit: "inside" })
    .toBuffer();

  const obstacleResized = await sharp(flowerBankPath)
    .resize({ height: 110 })
    .toBuffer();
  const springboardResized = await sharp(mountainBlossomPath)
    .resize({ height: 130 })
    .toBuffer();
  const sparkleResized = await sharp(starSparklePath)
    .resize({ height: 70 })
    .toBuffer();

  const frameA = await sharp(farResized)
    .composite([
      { input: cloudResized, left: 60, top: 30 },
      { input: cypressResized, left: 760, top: GROUND_Y - 420 },
      { input: floweredRidgeResized, left: 40, top: GROUND_Y - 300 },
      { input: limestoneBoulderResized, left: 560, top: GROUND_Y - 180 },
      { input: treeResized, left: 920, top: GROUND_Y - 480 },
      { input: floweredGroundResized, left: 0, top: groundTop },
      { input: wildflowerBorderResized, left: 0, top: STAGE_HEIGHT - 180 },
      { input: overhangCragResized, left: 0, top: 0 },
      { input: springboardResized, left: 340, top: GROUND_Y - 130 },
      { input: obstacleResized, left: 740, top: GROUND_Y - 110 },
      { input: sparkleResized, left: 400, top: 180 },
      { input: sparkleResized, left: 500, top: 140 },
    ])
    .png()
    .toBuffer();

  // 3. Arrival Stage frame (Frame B)
  const terraceOverlookResized = await sharp(terraceOverlookPath)
    .resize(STAGE_WIDTH, Math.round(STAGE_WIDTH * (1024 / 3072)))
    .toBuffer();
  const archwayResized = await sharp(rainbowArchwayPath)
    .resize({ height: 460 })
    .toBuffer();
  const auntResized = await sharp(auntPath)
    .resize({ height: 260 })
    .toBuffer();

  const farArrival = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  const frameB = await sharp(farArrival)
    .composite([
      { input: terraceOverlookResized, left: 0, top: GROUND_Y - 420 },
      { input: floweredGroundResized, left: 0, top: groundTop },
      { input: wildflowerBorderResized, left: 0, top: STAGE_HEIGHT - 180 },
      { input: overhangCragResized, left: 0, top: 0 },
      { input: archwayResized, left: 700, top: GROUND_Y - 460 },
      { input: auntResized, left: 770, top: GROUND_Y - 260 },
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

  const outPath = path.join(PEAK_DIR, "contact-sheet.png");
  await sharp(contactSheet).toFile(outPath);
  console.log(`Saved contact sheet to ${outPath} (${STAGE_WIDTH * 2}x${STAGE_HEIGHT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
