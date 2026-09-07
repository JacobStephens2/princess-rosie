import { mkdtemp, rm, readFile, stat, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { prepareMedia } from "../src/prepare";
import { runMediaPrepareCli } from "../src/cli";

describe("prepareMedia", () => {
  test("carries through ids and roles, emits WebP derivatives, and emits derivative manifest", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const outputDir = join(tempDir, "derivatives");
      const manifestPath = join(tempDir, "media.json");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      await sharp({
        create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
      })
        .png()
        .toFile(join(tempDir, "test-illustration.png"));

      const fixtureManifest = {
        media: [
          {
            id: "test.opening",
            role: "illustration",
            path: "test-illustration.png",
          },
        ],
      };
      await sharp({
        create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
      })
        .png()
        .toFile(join(tempDir, "test-layer.png"));
      fixtureManifest.media.push({
        id: "test.layer",
        role: "illustration-layer",
        path: "test-layer.png",
      });

      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      const result = await prepareMedia({
        mediaManifestPath: manifestPath,
        sourceRoot: tempDir,
        outputDir,
        manifestOutputPath: derivativeManifestPath,
      });

      expect(result.derivatives).toHaveLength(2);
      expect(result.derivatives[0]?.id).toBe("test.opening");
      expect(result.derivatives[0]?.role).toBe("illustration");
      expect(result.derivatives[0]?.path).toMatch(/\.webp$/);
      expect(result.derivatives[1]?.id).toBe("test.layer");
      expect(result.derivatives[1]?.role).toBe("illustration-layer");

      const savedManifestRaw = await readFile(derivativeManifestPath, "utf8");
      const savedManifest = JSON.parse(savedManifestRaw);
      expect(savedManifest.derivatives).toHaveLength(2);
      expect(savedManifest.derivatives[0].id).toBe("test.opening");
      expect(savedManifest.derivatives[0].role).toBe("illustration");

      // Verify the emitted WebP file actually exists and is valid WebP
      const derivativeFilePath = join(outputDir, `${result.derivatives[0]?.id}.webp`);
      const meta = await sharp(derivativeFilePath).metadata();
      expect(meta.format).toBe("webp");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("fails naming the asset id when a source is missing", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const manifestPath = join(tempDir, "media.json");
      const outputDir = join(tempDir, "derivatives");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      const fixtureManifest = {
        media: [
          {
            id: "missing.sample-asset",
            role: "illustration",
            path: "non-existent.png",
          },
        ],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      await expect(
        prepareMedia({
          mediaManifestPath: manifestPath,
          sourceRoot: tempDir,
          outputDir,
          manifestOutputPath: derivativeManifestPath,
        }),
      ).rejects.toThrow("missing.sample-asset");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("fails naming the asset id when a source is corrupt or unreadable", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const manifestPath = join(tempDir, "media.json");
      const outputDir = join(tempDir, "derivatives");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");
      const corruptFilePath = join(tempDir, "corrupt.png");

      // Write invalid, corrupt image bytes
      await writeFile(corruptFilePath, Buffer.from("not a valid image byte stream"));

      const fixtureManifest = {
        media: [
          {
            id: "corrupt.sample-asset",
            role: "illustration",
            path: "corrupt.png",
          },
        ],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      await expect(
        prepareMedia({
          mediaManifestPath: manifestPath,
          sourceRoot: tempDir,
          outputDir,
          manifestOutputPath: derivativeManifestPath,
        }),
      ).rejects.toThrow("corrupt.sample-asset");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("derives full-height layers and paintings at 1× Stage resolution height (720 px)", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const outputDir = join(tempDir, "derivatives");
      const manifestPath = join(tempDir, "media.json");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      // Source illustration: 1680x944
      await sharp({
        create: { width: 1680, height: 944, channels: 4, background: { r: 100, g: 150, b: 200, alpha: 1 } },
      })
        .png()
        .toFile(join(tempDir, "full-painting.png"));

      // Source illustration-layer: 1672x941
      await sharp({
        create: { width: 1672, height: 941, channels: 4, background: { r: 50, g: 100, b: 150, alpha: 1 } },
      })
        .png()
        .toFile(join(tempDir, "full-layer.png"));

      const fixtureManifest = {
        media: [
          { id: "test.painting", role: "illustration", path: "full-painting.png" },
          { id: "test.scenery-layer", role: "illustration-layer", path: "full-layer.png" },
        ],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      const result = await prepareMedia({
        mediaManifestPath: manifestPath,
        sourceRoot: tempDir,
        outputDir,
        manifestOutputPath: derivativeManifestPath,
      });

      expect(result.derivatives).toHaveLength(2);
      // Heights must be at Stage resolution (720 px)
      expect(result.derivatives[0]?.height).toBe(720);
      expect(result.derivatives[0]?.width).toBe(Math.round((1680 * 720) / 944)); // 1281

      expect(result.derivatives[1]?.height).toBe(720);
      expect(result.derivatives[1]?.width).toBe(Math.round((1672 * 720) / 941)); // 1280

      // Verify the actual generated WebP files match the manifest
      const paintingMeta = await sharp(join(outputDir, "test.painting.webp")).metadata();
      expect(paintingMeta.height).toBe(720);
      expect(paintingMeta.width).toBe(1281);

      const layerMeta = await sharp(join(outputDir, "test.scenery-layer.webp")).metadata();
      expect(layerMeta.height).toBe(720);
      expect(layerMeta.width).toBe(1279);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("preserves alpha for character-layer and treatment roles and scales cutouts to size budget", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const outputDir = join(tempDir, "derivatives");
      const manifestPath = join(tempDir, "media.json");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      // Character-layer with transparent pixels (e.g., Mom cutout: 1024x1536)
      await sharp({
        create: { width: 1024, height: 1536, channels: 4, background: { r: 255, g: 100, b: 100, alpha: 0.5 } },
      })
        .png()
        .toFile(join(tempDir, "family-guest-mom.png"));

      // Treatment with transparent pixels (e.g., Rainbow path: 1536x1024)
      await sharp({
        create: { width: 1536, height: 1024, channels: 4, background: { r: 100, g: 255, b: 100, alpha: 0.25 } },
      })
        .png()
        .toFile(join(tempDir, "rainbow-path.png"));

      // Sprite cutout (e.g., Birthday star: 1024x1024)
      await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 215, b: 0, alpha: 0.8 } },
      })
        .png()
        .toFile(join(tempDir, "birthday-star.png"));

      // Rosie & Stella character cutout: 1536x1024
      await sharp({
        create: { width: 1536, height: 1024, channels: 4, background: { r: 200, g: 150, b: 255, alpha: 0.9 } },
      })
        .png()
        .toFile(join(tempDir, "rosie-stella.png"));

      const fixtureManifest = {
        media: [
          { id: "family-guest.mom", role: "character-layer", path: "family-guest-mom.png" },
          { id: "flight.rosie-stella", role: "character-layer", path: "rosie-stella.png" },
          { id: "flight.rosie-stella-back-wing", role: "character-layer", path: "rosie-stella.png" },
          { id: "flight.rosie-stella-body", role: "character-layer", path: "rosie-stella.png" },
          { id: "flight.rosie-stella-front-wing", role: "character-layer", path: "rosie-stella.png" },
          { id: "journey.rainbow-path", role: "treatment", path: "rainbow-path.png" },
          { id: "journey.birthday-star", role: "sprite", path: "birthday-star.png" },
        ],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      const result = await prepareMedia({
        mediaManifestPath: manifestPath,
        sourceRoot: tempDir,
        outputDir,
        manifestOutputPath: derivativeManifestPath,
      });

      // Character cutout: scaled down according to budget (504 height)
      const momDerivative = result.derivatives.find((d) => d.id === "family-guest.mom");
      expect(momDerivative).toBeDefined();
      expect(momDerivative?.height).toBe(504);
      expect(momDerivative?.width).toBe(336);

      const momMeta = await sharp(join(outputDir, "family-guest.mom.webp")).metadata();
      expect(momMeta.hasAlpha).toBe(true);
      expect(momMeta.height).toBe(504);
      expect(momMeta.width).toBe(336);

      // Rosie & Stella player character cutout: 256 height budget (384x256)
      const rosieDerivative = result.derivatives.find((d) => d.id === "flight.rosie-stella");
      expect(rosieDerivative).toBeDefined();
      expect(rosieDerivative?.height).toBe(256);
      expect(rosieDerivative?.width).toBe(384);

      const rosieMeta = await sharp(join(outputDir, "flight.rosie-stella.webp")).metadata();
      expect(rosieMeta.hasAlpha).toBe(true);
      expect(rosieMeta.height).toBe(256);
      expect(rosieMeta.width).toBe(384);

      // Rosie & Stella puppet pieces (back wing, body, front wing) also sized at 256 height budget
      const bodyDerivative = result.derivatives.find((d) => d.id === "flight.rosie-stella-body");
      expect(bodyDerivative).toBeDefined();
      expect(bodyDerivative?.height).toBe(256);
      expect(bodyDerivative?.width).toBe(384);

      const bodyMeta = await sharp(join(outputDir, "flight.rosie-stella-body.webp")).metadata();
      expect(bodyMeta.hasAlpha).toBe(true);
      expect(bodyMeta.height).toBe(256);
      expect(bodyMeta.width).toBe(384);

      // Treatment cutout: scaled to budget (max width 768)
      const pathDerivative = result.derivatives.find((d) => d.id === "journey.rainbow-path");
      expect(pathDerivative).toBeDefined();
      expect(pathDerivative?.width).toBe(768);
      expect(pathDerivative?.height).toBe(512);

      const pathMeta = await sharp(join(outputDir, "journey.rainbow-path.webp")).metadata();
      expect(pathMeta.hasAlpha).toBe(true);

      // Sprite cutout: scaled to budget (128x128)
      const starDerivative = result.derivatives.find((d) => d.id === "journey.birthday-star");
      expect(starDerivative).toBeDefined();
      expect(starDerivative?.width).toBe(128);
      expect(starDerivative?.height).toBe(128);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("caps every derivative width under the texture cap of 4096 px", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const outputDir = join(tempDir, "derivatives");
      const manifestPath = join(tempDir, "media.json");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      // An ultra-wide layer source: 6000x1000
      await sharp({
        create: { width: 6000, height: 1000, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 1 } },
      })
        .png()
        .toFile(join(tempDir, "wide-layer.png"));

      const fixtureManifest = {
        media: [
          { id: "test.wide-layer", role: "illustration-layer", path: "wide-layer.png" },
        ],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      const result = await prepareMedia({
        mediaManifestPath: manifestPath,
        sourceRoot: tempDir,
        outputDir,
        manifestOutputPath: derivativeManifestPath,
      });

      const derivative = result.derivatives[0]!;
      expect(derivative.width).toBeLessThan(4096);
      expect(derivative.width).toBe(4095);

      const meta = await sharp(join(outputDir, `${derivative.id}.webp`)).metadata();
      expect(meta.width).toBeLessThan(4096);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("is idempotent: subsequent runs modify nothing on disk", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const outputDir = join(tempDir, "derivatives");
      const manifestPath = join(tempDir, "media.json");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      await sharp({
        create: { width: 400, height: 300, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 1 } },
      })
        .png()
        .toFile(join(tempDir, "source.png"));

      const fixtureManifest = {
        media: [{ id: "test.item", role: "illustration", path: "source.png" }],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      // First run
      const result1 = await prepareMedia({
        mediaManifestPath: manifestPath,
        sourceRoot: tempDir,
        outputDir,
        manifestOutputPath: derivativeManifestPath,
      });

      const derivativePath = join(outputDir, "test.item.webp");
      const stat1Derivative = await stat(derivativePath);
      const stat1Manifest = await stat(derivativeManifestPath);

      // Brief delay to ensure mtime would differ if written
      await setTimeout(50);

      // Second run
      const result2 = await prepareMedia({
        mediaManifestPath: manifestPath,
        sourceRoot: tempDir,
        outputDir,
        manifestOutputPath: derivativeManifestPath,
      });

      const stat2Derivative = await stat(derivativePath);
      const stat2Manifest = await stat(derivativeManifestPath);

      expect(stat2Derivative.mtimeMs).toBe(stat1Derivative.mtimeMs);
      expect(stat2Manifest.mtimeMs).toBe(stat1Manifest.mtimeMs);
      expect(result2).toEqual(result1);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("CLI parses arguments and prepares media successfully", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const outputDir = join(tempDir, "derivatives");
      const manifestPath = join(tempDir, "media.json");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      await sharp({
        create: { width: 200, height: 200, channels: 4, background: { r: 20, g: 30, b: 40, alpha: 1 } },
      })
        .png()
        .toFile(join(tempDir, "cli-source.png"));

      const fixtureManifest = {
        media: [{ id: "cli.test", role: "illustration", path: "cli-source.png" }],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      const logs: string[] = [];
      const result = await runMediaPrepareCli({
        argv: [
          "--media-manifest",
          manifestPath,
          "--source-root",
          tempDir,
          "--output-dir",
          outputDir,
          "--manifest-output",
          derivativeManifestPath,
          "--web-asset-prefix",
          "/custom/derivatives/",
        ],
        stdout: (msg) => logs.push(msg),
      });

      expect(result.exitCode).toBe(0);
      expect(logs.some((l) => l.includes("Prepared 1 derivative(s)"))).toBe(true);

      const generated = JSON.parse(await readFile(derivativeManifestPath, "utf8"));
      expect(generated.derivatives[0].path).toBe("/custom/derivatives/cli.test.webp");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("scales set-piece to stage height and cutout to cutout sizing budget", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "media-prepare-test-"));
    try {
      const outputDir = join(tempDir, "derivatives");
      const manifestPath = join(tempDir, "media.json");
      const derivativeManifestPath = join(tempDir, "derivative-manifest.json");

      // Set Piece: 1536x1024
      await sharp({
        create: { width: 1536, height: 1024, channels: 4, background: { r: 100, g: 200, b: 100, alpha: 0.8 } },
      })
        .png()
        .toFile(join(tempDir, "column-ribbon.png"));

      // Obstacle cutout: 1024x1024
      await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 50, b: 150, alpha: 0.9 } },
      })
        .png()
        .toFile(join(tempDir, "rose-bush.png"));

      // Archway cutout: 1024x1536
      await sharp({
        create: { width: 1024, height: 1536, channels: 4, background: { r: 255, g: 215, b: 0, alpha: 0.9 } },
      })
        .png()
        .toFile(join(tempDir, "rainbow-archway.png"));

      const fixtureManifest = {
        media: [
          { id: "garden.column-ribbon", role: "set-piece", path: "column-ribbon.png" },
          { id: "garden.rose-bush", role: "cutout", path: "rose-bush.png" },
          { id: "shared.rainbow-archway", role: "cutout", path: "rainbow-archway.png" },
        ],
      };
      await writeFile(manifestPath, JSON.stringify(fixtureManifest));

      const result = await prepareMedia({
        mediaManifestPath: manifestPath,
        sourceRoot: tempDir,
        outputDir,
        manifestOutputPath: derivativeManifestPath,
      });

      expect(result.derivatives).toHaveLength(3);
      // Set piece scaled to STAGE_HEIGHT (720)
      expect(result.derivatives[0]?.id).toBe("garden.column-ribbon");
      expect(result.derivatives[0]?.height).toBe(720);
      expect(result.derivatives[0]?.width).toBe(Math.round((1536 * 720) / 1024)); // 1080

      // Obstacle cutout scaled to maxDim 256
      expect(result.derivatives[1]?.id).toBe("garden.rose-bush");
      expect(result.derivatives[1]?.width).toBe(256);
      expect(result.derivatives[1]?.height).toBe(256);

      // Archway cutout scaled to maxDim 512
      expect(result.derivatives[2]?.id).toBe("shared.rainbow-archway");
      expect(result.derivatives[2]?.height).toBe(512);
      expect(result.derivatives[2]?.width).toBe(Math.round((1024 * 512) / 1536)); // 341
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("CLI returns non-zero exitCode on missing arguments", async () => {
    const errors: string[] = [];
    const result = await runMediaPrepareCli({
      argv: ["--media-manifest", "some/path"],
      stderr: (msg) => errors.push(msg),
    });

    expect(result.exitCode).toBe(1);
    expect(errors.some((e) => e.includes("Missing required arguments"))).toBe(true);
  });
});
