import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const LACEWOOD_DIR = path.join(REPO_ROOT, "shared/edition/source-media/lacewood");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const GROUND_Y = 560;

  // Paths
  const farLayerPath = path.join(LACEWOOD_DIR, "far/far-layer.png");
  const lacePavilionPath = path.join(LACEWOOD_DIR, "middle/lace-pavilion.png");
  const laceRibbonTreePath = path.join(LACEWOOD_DIR, "middle/lace-ribbon-tree.png");
  const pillarLanternRowPath = path.join(LACEWOOD_DIR, "middle/pillar-lantern-row.png");
  const gardenLanternPath = path.join(SHARED_DIR, "garden-lantern.png");
  const stoneTileGroundPath = path.join(LACEWOOD_DIR, "near/stone-tile-ground.png");
  const roseWoodlandBorderPath = path.join(LACEWOOD_DIR, "near/rose-woodland-border.png");
  const canopyArchPath = path.join(LACEWOOD_DIR, "near/canopy-arch.png");
  const cypressPath = path.join(SHARED_DIR, "cypress-tree.png");
  const cloudBankPath = path.join(SHARED_DIR, "cloud-bank.png");
  const silverRibbonPath = path.join(LACEWOOD_DIR, "cutouts/silver-ribbon.png");
  const laceSproutPath = path.join(LACEWOOD_DIR, "cutouts/lace-sprout.png");
  const starSparklePath = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");
  const rainbowArchwayPath = path.join(SHARED_DIR, "rainbow-archway.png");
  const gramPath = path.join(JOURNEY_DIR, "family-guest-gram.png");

  // Verify all source assets exist
  const requiredFiles = [
    farLayerPath, lacePavilionPath, laceRibbonTreePath, pillarLanternRowPath,
    gardenLanternPath, stoneTileGroundPath, roseWoodlandBorderPath, canopyArchPath,
    cypressPath, cloudBankPath, silverRibbonPath, laceSproutPath,
    starSparklePath, rainbowArchwayPath, gramPath,
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
  const pillarLanternResized = await sharp(pillarLanternRowPath)
    .resize({ height: 320 })
    .toBuffer();
  const treeResized = await sharp(laceRibbonTreePath)
    .resize({ height: 480 })
    .toBuffer();
  const gardenLanternResized = await sharp(gardenLanternPath)
    .resize({ height: 200 })
    .toBuffer();
  const cypressResized = await sharp(cypressPath)
    .resize({ height: 420 })
    .toBuffer();
  const cloudResized = await sharp(cloudBankPath)
    .resize({ width: 500 })
    .toBuffer();
  const stoneTileResized = await sharp(stoneTileGroundPath)
    .resize(STAGE_WIDTH, 200)
    .toBuffer();
  const roseWoodlandResized = await sharp(roseWoodlandBorderPath)
    .resize(STAGE_WIDTH, 180)
    .toBuffer();
  const canopyResized = await sharp(canopyArchPath)
    .resize(STAGE_WIDTH, 220)
    .toBuffer();
  const obstacleResized = await sharp(silverRibbonPath)
    .resize({ height: 130 })
    .toBuffer();
  const springboardResized = await sharp(laceSproutPath)
    .resize({ height: 140 })
    .toBuffer();
  const sparkleResized = await sharp(starSparklePath)
    .resize({ height: 70 })
    .toBuffer();

  const frameA = await sharp(farResized)
    .composite([
      { input: cloudResized, left: 60, top: 30 },
      { input: cypressResized, left: 750, top: GROUND_Y - 420 },
      { input: pillarLanternResized, left: 80, top: GROUND_Y - 300 },
      { input: gardenLanternResized, left: 540, top: GROUND_Y - 200 },
      { input: treeResized, left: 950, top: GROUND_Y - 480 },
      { input: stoneTileResized, left: 0, top: GROUND_Y - 50 },
      { input: roseWoodlandResized, left: 0, top: GROUND_Y - 90 },
      { input: canopyResized, left: 0, top: 0 },
      { input: springboardResized, left: 340, top: GROUND_Y - 140 },
      { input: obstacleResized, left: 720, top: GROUND_Y - 130 },
      { input: sparkleResized, left: 400, top: 180 },
      { input: sparkleResized, left: 500, top: 140 },
    ])
    .png()
    .toBuffer();

  // 3. Arrival Stage frame (Frame B)
  const lacePavilionResized = await sharp(lacePavilionPath)
    .resize(STAGE_WIDTH, Math.round(STAGE_WIDTH * (1024 / 3072)))
    .toBuffer();
  const archwayResized = await sharp(rainbowArchwayPath)
    .resize({ height: 460 })
    .toBuffer();
  const gramResized = await sharp(gramPath)
    .resize({ height: 260 })
    .toBuffer();

  const farArrival = await sharp(farLayerPath)
    .resize(Math.round(3072 * (720 / 1024)), 720)
    .extract({ left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT })
    .toBuffer();

  const frameB = await sharp(farArrival)
    .composite([
      { input: lacePavilionResized, left: 0, top: GROUND_Y - 420 },
      { input: stoneTileResized, left: 0, top: GROUND_Y - 50 },
      { input: roseWoodlandResized, left: 0, top: GROUND_Y - 90 },
      { input: canopyResized, left: 0, top: 0 },
      { input: archwayResized, left: 700, top: GROUND_Y - 460 },
      { input: gramResized, left: 770, top: GROUND_Y - 260 },
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

  const outPath = path.join(LACEWOOD_DIR, "contact-sheet.png");
  await sharp(contactSheet).toFile(outPath);
  console.log(`Saved contact sheet to ${outPath} (${STAGE_WIDTH * 2}x${STAGE_HEIGHT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
