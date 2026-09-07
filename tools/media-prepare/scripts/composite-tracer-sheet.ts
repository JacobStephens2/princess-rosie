import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateContactSheet } from "./composite-contact-sheet";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const GARDEN_DIR = path.join(REPO_ROOT, "shared/edition/source-media/garden");
const SHARED_DIR = path.join(REPO_ROOT, "shared/edition/source-media/shared");
const JOURNEY_DIR = path.join(REPO_ROOT, "shared/edition/source-media/journey");

const STAGE_WIDTH = 1280;
const GROUND_Y = 560;

async function main() {
  const sparkle = path.join(GARDEN_DIR, "cutouts/star-sparkle.png");

  await generateContactSheet({
    farLayerPath: path.join(GARDEN_DIR, "far/far-layer.png"),
    outputPath: path.join(GARDEN_DIR, "contact-sheet.png"),
    frameAElements: [
      { path: path.join(SHARED_DIR, "cloud-bank.png"), resize: { width: 500 }, left: 60, top: 30 },
      { path: path.join(SHARED_DIR, "cypress-tree.png"), resize: { height: 420 }, left: 750, top: GROUND_Y - 420 },
      { path: path.join(GARDEN_DIR, "middle/balustrade-run.png"), resize: { height: 320 }, left: 100, top: GROUND_Y - 300 },
      { path: path.join(GARDEN_DIR, "middle/column-ribbon.png"), resize: { height: 480 }, left: 950, top: GROUND_Y - 480 },
      { path: path.join(GARDEN_DIR, "near/border-strip.png"), resize: { width: STAGE_WIDTH, height: 220 }, left: 0, top: GROUND_Y - 60 },
      { path: path.join(GARDEN_DIR, "cutouts/giant-rose.png"), resize: { height: 140 }, left: 340, top: GROUND_Y - 140 },
      { path: path.join(GARDEN_DIR, "cutouts/rose-bush.png"), resize: { height: 130 }, left: 720, top: GROUND_Y - 130 },
      { path: sparkle, resize: { height: 70 }, left: 400, top: 180 },
      { path: sparkle, resize: { height: 70 }, left: 500, top: 140 },
    ],
    frameBElements: [
      { path: path.join(GARDEN_DIR, "middle/arch-cluster.png"), resize: { width: STAGE_WIDTH, height: Math.round(STAGE_WIDTH * (1024 / 3072)) }, left: 0, top: GROUND_Y - 420 },
      { path: path.join(GARDEN_DIR, "near/terrace-edge.png"), resize: { width: STAGE_WIDTH, height: 200 }, left: 0, top: GROUND_Y - 40 },
      { path: path.join(SHARED_DIR, "rainbow-archway.png"), resize: { height: 460 }, left: 700, top: GROUND_Y - 460 },
      { path: path.join(JOURNEY_DIR, "family-guest-mom.png"), resize: { height: 260 }, left: 770, top: GROUND_Y - 260 },
      { path: sparkle, resize: { height: 70 }, left: 780, top: 120 },
    ],
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
