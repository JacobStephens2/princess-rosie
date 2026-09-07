import sharp from "sharp";
import fs from "node:fs";

export interface SheetElement {
  path: string;
  left: number;
  top: number;
  resize?: { width?: number; height?: number };
}

export interface ContactSheetOptions {
  stageWidth?: number;
  stageHeight?: number;
  groundY?: number;
  farLayerPath: string;
  outputPath: string;
  frameAElements: SheetElement[];
  frameBElements: SheetElement[];
}

export async function generateContactSheet(options: ContactSheetOptions): Promise<void> {
  const stageWidth = options.stageWidth ?? 1280;
  const stageHeight = options.stageHeight ?? 720;

  // 1. Verify required source assets exist
  const allFiles = [
    options.farLayerPath,
    ...options.frameAElements.map((e) => e.path),
    ...options.frameBElements.map((e) => e.path),
  ];
  for (const f of allFiles) {
    if (!fs.existsSync(f)) {
      throw new Error(`Missing asset for contact sheet: ${f}`);
    }
  }

  // 2. Prepare far layer slices
  const farFlight = await sharp(options.farLayerPath)
    .resize(Math.round(3072 * (stageHeight / 1024)), stageHeight)
    .extract({ left: 880, top: 0, width: stageWidth, height: stageHeight })
    .toBuffer();

  const farArrival = await sharp(options.farLayerPath)
    .resize(Math.round(3072 * (stageHeight / 1024)), stageHeight)
    .extract({ left: 0, top: 0, width: stageWidth, height: stageHeight })
    .toBuffer();

  // 3. Helper to resize elements
  async function prepareOverlays(elements: SheetElement[]) {
    return Promise.all(
      elements.map(async (elem) => {
        let input: Buffer;
        if (elem.resize) {
          input = await sharp(elem.path).resize(elem.resize).toBuffer();
        } else {
          input = await sharp(elem.path).toBuffer();
        }
        return {
          input,
          left: elem.left,
          top: elem.top,
        };
      })
    );
  }

  // 4. Composite Flight Stage (Frame A)
  const frameAOverlays = await prepareOverlays(options.frameAElements);
  const frameA = await sharp(farFlight).composite(frameAOverlays).png().toBuffer();

  // 5. Composite Arrival Stage (Frame B)
  const frameBOverlays = await prepareOverlays(options.frameBElements);
  const frameB = await sharp(farArrival).composite(frameBOverlays).png().toBuffer();

  // 6. Combine side-by-side into contact sheet
  const contactSheet = await sharp({
    create: {
      width: stageWidth * 2,
      height: stageHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: frameA, left: 0, top: 0 },
      { input: frameB, left: stageWidth, top: 0 },
    ])
    .png()
    .toBuffer();

  await sharp(contactSheet).toFile(options.outputPath);
  console.log(`Saved contact sheet to ${options.outputPath} (${stageWidth * 2}x${stageHeight})`);
}
