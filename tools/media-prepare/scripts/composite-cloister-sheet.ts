import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const CLOISTER_DIR = path.join(REPO_ROOT, "shared/edition/source-media/cloister");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const GROUND_Y = 560;

  // Paths
  const farLayerPath = path.join(CLOISTER_DIR, "far/far-layer.png");
  const cloisterArcadePath = path.join(CLOISTER_DIR, "middle/cloister-arcade.png");
  const cloudColonnadePath = path.join(CLOISTER_DIR, "middle/cloud-colonnade-pavilion.png");
  const sunlitBalustradePath = path.join(CLOISTER_DIR, "middle/sunlit-stone-balustrade.png");
  const stonePlanterPath = path.join(SHARED_DIR, "stone-planter.png");
  const gardenLanternPath = path.join(SHARED_DIR, "garden-lantern.png");
  const cloudGroundPath = path.join(CLOISTER_DIR, "near/soft-cloud-ground.png");
  const steppingStonesPath = path.join(CLOISTER_DIR, "near/cloud-stepping-stones.png");
  const archCanopyPath = path.join(CLOISTER_DIR, "near/sunlit-arch-canopy.png");
  const cloudBankPath = path.join(SHARED_DIR, "cloud-bank.png");
  const softCloudPath = path.join(CLOISTER_DIR, "cutouts/soft-cloud.png");
  const cloudUpdraftPath = path.join(CLOISTER_DIR, "cutouts/cloud-updraft.png");
  const starSparklePath = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");
  const rainbowArchwayPath = path.join(SHARED_DIR, "rainbow-archway.png");
  const beasleyPath = path.join(JOURNEY_DIR, "family-guest-beasley.png");

  // Verify all source assets exist
  const requiredFiles = [
    farLayerPath, cloisterArcadePath, cloudColonnadePath, sunlitBalustradePath,
    stonePlanterPath, gardenLanternPath, cloudGroundPath, steppingStonesPath, archCanopyPath,
    cloudBankPath, softCloudPath, cloudUpdraftPath,
    starSparklePath, rainbowArchwayPath, beasleyPath,
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
  const colonnadeResized = await sharp(cloudColonnadePath)
    .resize({ height: 360 })
    .toBuffer();
  const balustradeResized = await sharp(sunlitBalustradePath)
    .resize({ height: 260 })
    .toBuffer();
  const stonePlanterResized = await sharp(stonePlanterPath)
    .resize({ height: 180 })
    .toBuffer();
  const gardenLanternResized = await sharp(gardenLanternPath)
    .resize({ height: 200 })
    .toBuffer();
  const cloudBankResized = await sharp(cloudBankPath)
    .resize({ width: 500 })
    .toBuffer();
  const cloudGroundResized = await sharp(cloudGroundPath)
    .resize(STAGE_WIDTH, 180)
    .toBuffer();
  const steppingStonesResized = await sharp(steppingStonesPath)
    .resize(STAGE_WIDTH, 200)
    .toBuffer();
  const archCanopyResized = await sharp(archCanopyPath)
    .resize(STAGE_WIDTH, 220)
    .toBuffer();
  const obstacleResized = await sharp(softCloudPath)
    .resize({ height: 110 })
    .toBuffer();
  const springboardResized = await sharp(cloudUpdraftPath)
    .resize({ height: 130 })
    .toBuffer();
  const sparkleResized = await sharp(starSparklePath)
    .resize({ height: 70 })
    .toBuffer();

  const frameA = await sharp(farResized)
    .composite([
      { input: cloudBankResized, left: 60, top: 40 },
      { input: colonnadeResized, left: 100, top: GROUND_Y - 360 },
      { input: stonePlanterResized, left: 540, top: GROUND_Y - 180 },
      { input: balustradeResized, left: 740, top: GROUND_Y - 260 },
      { input: gardenLanternResized, left: 1100, top: GROUND_Y - 200 },
      { input: cloudGroundResized, left: 0, top: GROUND_Y - 60 },
      { input: steppingStonesResized, left: 0, top: GROUND_Y - 80 },
      { input: archCanopyResized, left: 0, top: 0 },
      { input: springboardResized, left: 340, top: GROUND_Y - 130 },
      { input: obstacleResized, left: 700, top: GROUND_Y - 110 },
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
  const beasleyResized = await sharp(beasleyPath)
    .resize({ height: 240 })
    .toBuffer();

  const farArrival = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  const frameB = await sharp(farArrival)
    .composite([
      { input: cloisterArcadeResized, left: 0, top: GROUND_Y - 420 },
      { input: cloudGroundResized, left: 0, top: GROUND_Y - 60 },
      { input: steppingStonesResized, left: 0, top: GROUND_Y - 80 },
      { input: archCanopyResized, left: 0, top: 0 },
      { input: archwayResized, left: 700, top: GROUND_Y - 460 },
      { input: beasleyResized, left: 770, top: GROUND_Y - 240 },
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

  const outPath = path.join(CLOISTER_DIR, "contact-sheet.png");
  await sharp(contactSheet).toFile(outPath);
  console.log(`Saved contact sheet to ${outPath} (${STAGE_WIDTH * 2}x${STAGE_HEIGHT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
