import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const SEA_DIR = path.join(REPO_ROOT, "shared/edition/source-media/sapphire-sea");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const GROUND_Y = 560;

  // Paths
  const farLayerPath = path.join(SEA_DIR, "far/far-layer.png");
  const seaPromontoryPath = path.join(SEA_DIR, "middle/sea-promontory.png");
  const limestoneSeaStackPath = path.join(SEA_DIR, "middle/limestone-sea-stack.png");
  const coralTideTerracePath = path.join(SEA_DIR, "middle/coral-tide-terrace.png");
  const floweredRockPath = path.join(SHARED_DIR, "flowered-coastal-rock.png");
  const coastalShelfGroundPath = path.join(SEA_DIR, "near/coastal-shelf-ground.png");
  const floweredRockBorderPath = path.join(SEA_DIR, "near/flowered-rock-border.png");
  const turquoiseShallowsPath = path.join(SEA_DIR, "near/turquoise-shallows-pool.png");
  const cypressPath = path.join(SHARED_DIR, "cypress-tree.png");
  const cloudBankPath = path.join(SHARED_DIR, "cloud-bank.png");
  const waveCrestPath = path.join(SEA_DIR, "cutouts/wave-crest.png");
  const seaGeyserPath = path.join(SEA_DIR, "cutouts/sea-geyser.png");
  const starSparklePath = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");
  const rainbowArchwayPath = path.join(SHARED_DIR, "rainbow-archway.png");
  const unclePath = path.join(JOURNEY_DIR, "family-guest-uncle.png");

  // Verify all source assets exist
  const requiredFiles = [
    farLayerPath, seaPromontoryPath, limestoneSeaStackPath, coralTideTerracePath,
    floweredRockPath, coastalShelfGroundPath, floweredRockBorderPath, turquoiseShallowsPath,
    cypressPath, cloudBankPath, waveCrestPath, seaGeyserPath,
    starSparklePath, rainbowArchwayPath, unclePath,
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
  const tideTerraceResized = await sharp(coralTideTerracePath)
    .resize({ height: 320 })
    .toBuffer();
  const seaStackResized = await sharp(limestoneSeaStackPath)
    .resize({ height: 460 })
    .toBuffer();
  const floweredRockResized = await sharp(floweredRockPath)
    .resize({ height: 180 })
    .toBuffer();
  const cypressResized = await sharp(cypressPath)
    .resize({ height: 420 })
    .toBuffer();
  const cloudResized = await sharp(cloudBankPath)
    .resize({ width: 500 })
    .toBuffer();
  const coastalShelfResized = await sharp(coastalShelfGroundPath)
    .resize(STAGE_WIDTH, 200)
    .toBuffer();
  const floweredBorderResized = await sharp(floweredRockBorderPath)
    .resize(STAGE_WIDTH, 180)
    .toBuffer();
  const turquoisePoolResized = await sharp(turquoiseShallowsPath)
    .resize(STAGE_WIDTH, 200)
    .toBuffer();
  const obstacleResized = await sharp(waveCrestPath)
    .resize({ height: 130 })
    .toBuffer();
  const springboardResized = await sharp(seaGeyserPath)
    .resize({ height: 140 })
    .toBuffer();
  const sparkleResized = await sharp(starSparklePath)
    .resize({ height: 70 })
    .toBuffer();

  const frameA = await sharp(farResized)
    .composite([
      { input: cloudResized, left: 60, top: 30 },
      { input: cypressResized, left: 780, top: GROUND_Y - 420 },
      { input: tideTerraceResized, left: 60, top: GROUND_Y - 300 },
      { input: floweredRockResized, left: 540, top: GROUND_Y - 180 },
      { input: seaStackResized, left: 950, top: GROUND_Y - 460 },
      { input: coastalShelfResized, left: 0, top: GROUND_Y - 50 },
      { input: floweredBorderResized, left: 0, top: GROUND_Y - 90 },
      { input: turquoisePoolResized, left: 0, top: GROUND_Y - 60 },
      { input: springboardResized, left: 340, top: GROUND_Y - 140 },
      { input: obstacleResized, left: 720, top: GROUND_Y - 130 },
      { input: sparkleResized, left: 400, top: 180 },
      { input: sparkleResized, left: 500, top: 140 },
    ])
    .png()
    .toBuffer();

  // 3. Arrival Stage frame (Frame B)
  const seaPromontoryResized = await sharp(seaPromontoryPath)
    .resize(STAGE_WIDTH, Math.round(STAGE_WIDTH * (1024 / 3072)))
    .toBuffer();
  const archwayResized = await sharp(rainbowArchwayPath)
    .resize({ height: 460 })
    .toBuffer();
  const uncleResized = await sharp(unclePath)
    .resize({ height: 260 })
    .toBuffer();

  const farArrival = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  const frameB = await sharp(farArrival)
    .composite([
      { input: seaPromontoryResized, left: 0, top: GROUND_Y - 420 },
      { input: coastalShelfResized, left: 0, top: GROUND_Y - 50 },
      { input: floweredBorderResized, left: 0, top: GROUND_Y - 90 },
      { input: archwayResized, left: 700, top: GROUND_Y - 460 },
      { input: uncleResized, left: 770, top: GROUND_Y - 260 },
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

  const outPath = path.join(SEA_DIR, "contact-sheet.png");
  await sharp(contactSheet).toFile(outPath);
  console.log(`Saved contact sheet to ${outPath} (${STAGE_WIDTH * 2}x${STAGE_HEIGHT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
