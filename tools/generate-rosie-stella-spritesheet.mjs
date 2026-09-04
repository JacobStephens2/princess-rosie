import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "../apps/web/public/assets/rosie-stella-spritesheet.png");

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Create an HTML page with a 1024x1024 canvas
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <canvas id="canvas" width="1024" height="1024"></canvas>
      </body>
    </html>
  `);

  const pngBase64 = await page.evaluate(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 1024, 1024);

    const FRAME_SIZE = 256;
    const COLS = 4;

    // Helper drawing routines for character parts
    function drawCharacter(ctx, x, y, state, frameIndex) {
      ctx.save();
      ctx.translate(x + 128, y + 128);

      // Frame-specific animation offsets
      let bodyY = 0;
      let bodyAngle = 0;
      let frontLegL = 0;
      let frontLegR = 0;
      let backLegL = 0;
      let backLegR = 0;
      let wingAngle = -0.3;
      let wingSpan = 1;
      let tailWiggle = 0;
      let rosieY = 0;
      let rosieArmAngle = 0;
      let rosieCrownAngle = 0;
      let eyeSurprised = false;
      let stellaMouthSmile = true;
      let starsEffect = false;

      if (state === "gallop") {
        // 6 frames (0..5)
        const t = (frameIndex / 6) * Math.PI * 2;
        bodyY = Math.sin(t * 2) * 5; // Bob twice per trot cycle
        bodyAngle = Math.sin(t) * 0.05;
        frontLegL = Math.sin(t) * 0.6;
        frontLegR = Math.sin(t + Math.PI) * 0.6;
        backLegL = Math.sin(t + Math.PI * 0.8) * 0.55;
        backLegR = Math.sin(t - Math.PI * 0.2) * 0.55;
        tailWiggle = Math.sin(t) * 0.2;
        rosieY = Math.sin(t * 2 + 0.5) * 3;
        wingAngle = -0.35 + Math.sin(t) * 0.15;
      } else if (state === "leap") {
        // 3 frames (6..8)
        if (frameIndex === 0) { // Launch stretch
          bodyY = -6;
          bodyAngle = -0.22; // Nose up
          frontLegL = -0.7; // Reaching forward
          frontLegR = -0.55;
          backLegL = 0.65; // Kicking back
          backLegR = 0.5;
          wingAngle = -0.7;
          wingSpan = 1.15;
          rosieY = -2;
          rosieArmAngle = -0.2;
        } else if (frameIndex === 1) { // Apex crest
          bodyY = -14;
          bodyAngle = -0.04; // Cresting horizontal
          frontLegL = -0.3; // Tucked gracefully
          frontLegR = -0.2;
          backLegL = 0.25;
          backLegR = 0.35;
          wingAngle = -0.95; // Wings high V
          wingSpan = 1.25;
          rosieY = -4;
          rosieArmAngle = -0.4;
        } else { // Arc descent
          bodyY = -4;
          bodyAngle = 0.12; // Nose slightly down
          frontLegL = 0.2;
          frontLegR = 0.35;
          backLegL = -0.15;
          backLegR = 0.1;
          wingAngle = -0.4;
          wingSpan = 1.05;
          rosieY = -1;
          rosieArmAngle = -0.1;
        }
      } else if (state === "flutter") {
        // 4 frames (9..12)
        const angles = [-1.0, -0.65, 0.1, -0.4];
        const scales = [1.2, 1.0, 0.75, 0.95];
        const bobs = [-6, -2, 4, 0];
        wingAngle = angles[frameIndex];
        wingSpan = scales[frameIndex];
        bodyY = bobs[frameIndex];
        bodyAngle = 0.02;
        frontLegL = 0.15;
        frontLegR = 0.25;
        backLegL = -0.2;
        backLegR = -0.1;
        tailWiggle = Math.sin(frameIndex) * 0.15;
        rosieY = bobs[frameIndex] * 0.5;
        starsEffect = true;
      } else if (state === "stumble") {
        // 3 frames (13..15)
        if (frameIndex === 0) { // Bump wobble left
          bodyY = 4;
          bodyAngle = 0.22; // Tilted back
          frontLegL = -0.4;
          frontLegR = 0.5;
          backLegL = -0.3;
          backLegR = 0.4;
          wingAngle = 0.2;
          rosieCrownAngle = 0.35; // Crown tilted
          rosieArmAngle = 0.4;
          eyeSurprised = true;
        } else if (frameIndex === 1) { // Wobble right
          bodyY = 6;
          bodyAngle = -0.18; // Tilted forward
          frontLegL = 0.4;
          frontLegR = -0.3;
          backLegL = 0.3;
          backLegR = -0.4;
          wingAngle = -0.6;
          rosieCrownAngle = -0.25;
          rosieArmAngle = 0.2;
          eyeSurprised = true;
        } else { // Recovery
          bodyY = 1;
          bodyAngle = 0.02;
          frontLegL = -0.1;
          frontLegR = 0.1;
          backLegL = 0.1;
          backLegR = -0.1;
          wingAngle = -0.3;
          rosieCrownAngle = 0.05;
          rosieArmAngle = 0;
          stellaMouthSmile = true;
        }
      }

      // Root character transform with scale
      ctx.scale(0.88, 0.88);
      ctx.translate(0, bodyY + 12);
      ctx.rotate(bodyAngle);

      // 1. Rainbow Tail
      const tailColors = ["#e95ca6", "#f4a25f", "#f5d75f", "#63c984", "#64bce2", "#9171d0"];
      tailColors.forEach((color, i) => {
        ctx.save();
        ctx.translate(-55, 12 + i * 3);
        ctx.rotate(-0.35 + i * 0.12 + tailWiggle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(-25, 0, 32, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 2. Far Wing (Behind body)
      ctx.save();
      ctx.translate(-15, -20);
      ctx.rotate(wingAngle - 0.15);
      ctx.scale(wingSpan, 0.85);
      ctx.fillStyle = "#a88be1";
      ctx.beginPath();
      ctx.ellipse(-15, -28, 48, 22, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Far Legs
      drawLeg(ctx, -26, 28, backLegR, "#ede4f2", "#d89f30");
      drawLeg(ctx, 32, 28, frontLegR, "#ede4f2", "#d89f30");

      // 4. Stella Body
      ctx.save();
      ctx.fillStyle = "#fffbf3";
      ctx.strokeStyle = "#d9b9d4";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 10, 70, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Flank heart marking
      ctx.fillStyle = "#f5c3da";
      ctx.beginPath();
      ctx.arc(-22, 5, 5, 0, Math.PI, true);
      ctx.arc(-14, 5, 5, 0, Math.PI, true);
      ctx.lineTo(-18, 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 5. Near Legs
      drawLeg(ctx, -14, 30, backLegL, "#fffbf3", "#f5d75f");
      drawLeg(ctx, 42, 30, frontLegL, "#fffbf3", "#f5d75f");

      // 6. Near Wing (In front of body, behind Rosie)
      ctx.save();
      ctx.translate(-5, -22);
      ctx.rotate(wingAngle);
      ctx.scale(wingSpan, 1);
      ctx.fillStyle = "#c7aff0";
      ctx.strokeStyle = "#a88be1";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(-10, -32, 54, 25, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wing feathers detail
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-8, -32, 22, 0.4, 2.4);
      ctx.stroke();
      ctx.restore();

      // 7. Stella Neck & Head
      ctx.save();
      ctx.fillStyle = "#fffbf3";
      ctx.strokeStyle = "#d9b9d4";
      ctx.lineWidth = 3.5;

      // Neck
      ctx.beginPath();
      ctx.ellipse(36, -8, 24, 44, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.ellipse(56, -32, 36, 26, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ear
      ctx.fillStyle = "#ffeaf4";
      ctx.strokeStyle = "#d9b9d4";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(42, -54);
      ctx.lineTo(52, -38);
      ctx.lineTo(34, -40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rainbow Horn
      const hornColors = ["#f164a9", "#f7a85b", "#f5d65d", "#63c985", "#5bbce3", "#9473d1"];
      hornColors.forEach((color, i) => {
        ctx.save();
        ctx.translate(56 + i * 2.8, -52 - i * 5.2);
        ctx.rotate(0.5);
        ctx.fillStyle = color;
        ctx.fillRect(-4 + i * 0.4, -4, 8 - i * 0.9, 7);
        ctx.restore();
      });

      // Mane curls
      const maneColors = ["#e95ca6", "#9e77d1", "#6dc9dc", "#f5d75f"];
      maneColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(32 - i * 4, -36 + i * 11, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Eye
      if (eyeSurprised) {
        ctx.fillStyle = "#3f3456";
        ctx.beginPath();
        ctx.arc(70, -36, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(69, -38, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#3f3456";
        ctx.beginPath();
        ctx.arc(68, -35, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(69.5, -36.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rosy cheek
      ctx.fillStyle = "#ffaec9";
      ctx.beginPath();
      ctx.arc(66, -26, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle smile
      ctx.strokeStyle = "#c66d91";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (stellaMouthSmile) {
        ctx.arc(78, -26, 6, 0.2, 1.8);
      } else {
        ctx.arc(78, -24, 4, 3.2, 5.8);
      }
      ctx.stroke();
      ctx.restore();

      // 8. Princess Rosie
      ctx.save();
      ctx.translate(-4, -18 + rosieY);

      // Rosie Dress
      ctx.fillStyle = "#e94f9b";
      ctx.strokeStyle = "#b83276";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, 14);
      ctx.lineTo(14, 14);
      ctx.lineTo(2, -22);
      ctx.lineTo(-12, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dress lace trim
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-12, 14, 3, 0, Math.PI);
      ctx.arc(-6, 14, 3, 0, Math.PI);
      ctx.arc(0, 14, 3, 0, Math.PI);
      ctx.arc(6, 14, 3, 0, Math.PI);
      ctx.stroke();

      // Rosie Arms
      ctx.save();
      ctx.translate(6, -10);
      ctx.rotate(rosieArmAngle);
      ctx.strokeStyle = "#ffd7bd";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16, 6);
      ctx.stroke();
      ctx.restore();

      // Rosie Hair Back / Ponytail
      ctx.fillStyle = "#f0c36a";
      ctx.beginPath();
      ctx.ellipse(-16, -28, 14, 22, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Rosie Head
      ctx.fillStyle = "#ffd7bd";
      ctx.beginPath();
      ctx.arc(0, -32, 13, 0, Math.PI * 2);
      ctx.fill();

      // Rosie Hair Front
      ctx.fillStyle = "#f0c36a";
      ctx.beginPath();
      ctx.arc(-3, -38, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -38, 8, 0, Math.PI * 2);
      ctx.fill();

      // Rosie Rosy Cheek & Face
      ctx.fillStyle = "#f48bb3";
      ctx.beginPath();
      ctx.arc(6, -30, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Rosie Eye
      ctx.fillStyle = "#3f3456";
      ctx.beginPath();
      ctx.arc(5, -33, 2, 0, Math.PI * 2);
      ctx.fill();

      // Rosie Smile
      ctx.strokeStyle = "#c66d91";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(6, -28, 3, 0.2, 2.1);
      ctx.stroke();

      // Rosie Gold Crown
      ctx.save();
      ctx.translate(0, -45);
      ctx.rotate(rosieCrownAngle);
      ctx.fillStyle = "#ffd65e";
      ctx.strokeStyle = "#d18a2a";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-8, 6);
      ctx.lineTo(8, 6);
      ctx.lineTo(7, -4);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, -7);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-7, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // Rosie

      // Magical sparkles during flutter
      if (starsEffect) {
        ctx.fillStyle = "#fff48f";
        ctx.beginPath();
        ctx.arc(-35, -45, 3, 0, Math.PI * 2);
        ctx.arc(-48, -25, 2.5, 0, Math.PI * 2);
        ctx.arc(20, -55, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // Character
    }

    function drawLeg(ctx, hipX, hipY, angle, bodyColor, hoofColor) {
      ctx.save();
      ctx.translate(hipX, hipY);
      ctx.rotate(angle);

      // Upper leg
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 14, 7.5, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hoof
      ctx.fillStyle = hoofColor;
      ctx.beginPath();
      ctx.roundRect(-7, 26, 14, 9, 3);
      ctx.fill();

      ctx.restore();
    }

    // 16 frames:
    // Frames 0..5: Gallop
    // Frames 6..8: Leap
    // Frames 9..12: Flutter
    // Frames 13..15: Stumble
    const frameDefs = [
      { state: "gallop", subIndex: 0 },
      { state: "gallop", subIndex: 1 },
      { state: "gallop", subIndex: 2 },
      { state: "gallop", subIndex: 3 },
      { state: "gallop", subIndex: 4 },
      { state: "gallop", subIndex: 5 },
      { state: "leap", subIndex: 0 },
      { state: "leap", subIndex: 1 },
      { state: "leap", subIndex: 2 },
      { state: "flutter", subIndex: 0 },
      { state: "flutter", subIndex: 1 },
      { state: "flutter", subIndex: 2 },
      { state: "flutter", subIndex: 3 },
      { state: "stumble", subIndex: 0 },
      { state: "stumble", subIndex: 1 },
      { state: "stumble", subIndex: 2 },
    ];

    frameDefs.forEach((def, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const frameX = col * FRAME_SIZE;
      const frameY = row * FRAME_SIZE;

      drawCharacter(ctx, frameX, frameY, def.state, def.subIndex);
    });

    return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
  });

  await browser.close();

  const buffer = Buffer.from(pngBase64, "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated sprite sheet (${buffer.length} bytes) at ${outputPath}`);
}

generate().catch((err) => {
  console.error("Failed to generate sprite sheet:", err);
  process.exit(1);
});
