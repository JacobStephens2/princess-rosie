import path from "node:path";
import { generateContactSheet, REPO_ROOT, STAGE_WIDTH, GROUND_Y } from "./composite-contact-sheet";

const SEA_DIR = path.join(REPO_ROOT, "shared/edition/source-media/sapphire-sea");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

async function main() {
  const coastalShelf = { path: path.join(SEA_DIR, "near/coastal-shelf-ground.png"), resize: { width: STAGE_WIDTH, height: 200 }, left: 0, top: GROUND_Y - 50 };
  const floweredBorder = { path: path.join(SEA_DIR, "near/flowered-rock-border.png"), resize: { width: STAGE_WIDTH, height: 180 }, left: 0, top: GROUND_Y - 90 };
  const sparkle = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");

  await generateContactSheet({
    farLayerPath: path.join(SEA_DIR, "far/far-layer.png"),
    outputPath: path.join(SEA_DIR, "contact-sheet.png"),
    frameAElements: [
      { path: path.join(SHARED_DIR, "cloud-bank.png"), resize: { width: 500 }, left: 60, top: 30 },
      { path: path.join(SHARED_DIR, "cypress-tree.png"), resize: { height: 420 }, left: 780, top: GROUND_Y - 420 },
      { path: path.join(SEA_DIR, "middle/coral-tide-terrace.png"), resize: { height: 320 }, left: 60, top: GROUND_Y - 300 },
      { path: path.join(SHARED_DIR, "flowered-coastal-rock.png"), resize: { height: 180 }, left: 540, top: GROUND_Y - 180 },
      { path: path.join(SEA_DIR, "middle/limestone-sea-stack.png"), resize: { height: 460 }, left: 950, top: GROUND_Y - 460 },
      coastalShelf,
      floweredBorder,
      { path: path.join(SEA_DIR, "near/turquoise-shallows-pool.png"), resize: { width: STAGE_WIDTH, height: 200 }, left: 0, top: GROUND_Y - 60 },
      { path: path.join(SEA_DIR, "cutouts/sea-geyser.png"), resize: { height: 140 }, left: 340, top: GROUND_Y - 140 },
      { path: path.join(SEA_DIR, "cutouts/wave-crest.png"), resize: { height: 130 }, left: 720, top: GROUND_Y - 130 },
      { path: sparkle, resize: { height: 70 }, left: 400, top: 180 },
      { path: sparkle, resize: { height: 70 }, left: 500, top: 140 },
    ],
    frameBElements: [
      { path: path.join(SEA_DIR, "middle/sea-promontory.png"), resize: { width: STAGE_WIDTH, height: Math.round(STAGE_WIDTH * (1024 / 3072)) }, left: 0, top: GROUND_Y - 420 },
      coastalShelf,
      floweredBorder,
      { path: path.join(SHARED_DIR, "rainbow-archway.png"), resize: { height: 460 }, left: 700, top: GROUND_Y - 460 },
      { path: path.join(JOURNEY_DIR, "family-guest-uncle.png"), resize: { height: 260 }, left: 770, top: GROUND_Y - 260 },
      { path: sparkle, resize: { height: 70 }, left: 780, top: 120 },
    ],
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
