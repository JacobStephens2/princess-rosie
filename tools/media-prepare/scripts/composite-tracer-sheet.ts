import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const GROUND_Y = 560;

  // Paths
  const farLayerPath = path.join(GARDEN_DIR, "far/far-layer.png");
  const archClusterPath = path.join(GARDEN_DIR, "middle/arch-cluster.png");
  const columnRibbonPath = path.join(GARDEN_DIR, "middle/column-ribbon.png");
  const balustradeRunPath = path.join(GARDEN_DIR, "middle/balustrade-run.png");
  const roseBushClusterPath = path.join(GARDEN_DIR, "near/rose-bush-cluster.png");
  const borderStripPath = path.join(GARDEN_DIR, "near/border-strip.png");
  const terraceEdgePath = path.join(GARDEN_DIR, "near/terrace-edge.png");
  const cypressPath = path.join(SHARED_DIR, "cypress-tree.png");
  const cloudBankPath = path.join(SHARED_DIR, "cloud-bank.png");
  const roseBushPath = path.join(GARDEN_DIR, "cutouts/rose-bush.png");
  const giantRosePath = path.join(GARDEN_DIR, "cutouts/giant-rose.png");
  const starSparklePath = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");
  const rainbowArchwayPath = path.join(SHARED_DIR, "rainbow-archway.png");
  const momPath = path.join(JOURNEY_DIR, "family-guest-mom.png");

  // Load and prepare base images
  // 1. Far layer slice (1280x720)
  const farResized = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 880, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  // 2. Flight Stage frame (Frame A)
  // Balustrade run on middle layer (groundY 560)
  const balustradeResized = await sharp(balustradeRunPath)
    .resize({ height: 320 })
    .toBuffer();
  // Column ribbon (height 480)
  const columnResized = await sharp(columnRibbonPath)
    .resize({ height: 480 })
    .toBuffer();
  // Cypress tree (height 420)
  const cypressResized = await sharp(cypressPath)
    .resize({ height: 420 })
    .toBuffer();
  // Cloud bank (width 500)
  const cloudResized = await sharp(cloudBankPath)
    .resize({ width: 500 })
    .toBuffer();
  // Border strip (near layer ground)
  const borderResized = await sharp(borderStripPath)
    .resize(STAGE_WIDTH, 220)
    .toBuffer();
  // Rose bush obstacle (height 120)
  const obstacleResized = await sharp(roseBushPath)
    .resize({ height: 130 })
    .toBuffer();
  // Giant rose springboard (height 140)
  const springboardResized = await sharp(giantRosePath)
    .resize({ height: 140 })
    .toBuffer();
  // Star sparkle (height 70)
  const sparkleResized = await sharp(starSparklePath)
    .resize({ height: 70 })
    .toBuffer();

  const frameA = await sharp(farResized)
    .composite([
      { input: cloudResized, left: 60, top: 30 },
      { input: cypressResized, left: 750, top: GROUND_Y - 420 },
      { input: balustradeResized, left: 100, top: GROUND_Y - 300 },
      { input: columnResized, left: 950, top: GROUND_Y - 480 },
      { input: borderResized, left: 0, top: GROUND_Y - 60 },
      { input: springboardResized, left: 340, top: GROUND_Y - 140 },
      { input: obstacleResized, left: 720, top: GROUND_Y - 130 },
      { input: sparkleResized, left: 400, top: 180 },
      { input: sparkleResized, left: 500, top: 140 },
    ])
    .png()
    .toBuffer();

  // 3. Arrival Stage frame (Frame B)
  // Arch cluster framing at archway
  const archClusterResized = await sharp(archClusterPath)
    .resize(STAGE_WIDTH, Math.round(STAGE_WIDTH * (1024 / 3072)))
    .toBuffer();
  // Terrace edge
  const terraceResized = await sharp(terraceEdgePath)
    .resize(STAGE_WIDTH, 200)
    .toBuffer();
  // Rainbow Archway
  const archwayResized = await sharp(rainbowArchwayPath)
    .resize({ height: 460 })
    .toBuffer();
  // Mom cutout
  const momResized = await sharp(momPath)
    .resize({ height: 260 })
    .toBuffer();

  const farArrival = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  const frameB = await sharp(farArrival)
    .composite([
      { input: archClusterResized, left: 0, top: GROUND_Y - 420 },
      { input: terraceResized, left: 0, top: GROUND_Y - 40 },
      { input: archwayResized, left: 700, top: GROUND_Y - 460 },
      { input: momResized, left: 770, top: GROUND_Y - 260 },
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

  const outPath = path.join(GARDEN_DIR, "contact-sheet.png");
  await sharp(contactSheet).toFile(outPath);
  console.log(`Saved contact sheet to ${outPath} (${STAGE_WIDTH * 2}x${STAGE_HEIGHT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
