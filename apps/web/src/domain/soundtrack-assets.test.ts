import { describe, expect, test } from "vitest";
import { join } from "node:path";
import { lstat, stat, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { DEFAULT_SOUNDTRACK_CATALOG } from "./soundtrack-rotation";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const audioDir = join(repoRoot, "apps/web/public/assets/audio");

describe("Production Audio Asset Bundle", () => {
  const allTracks = [
    ...DEFAULT_SOUNDTRACK_CATALOG.flightTracks,
    DEFAULT_SOUNDTRACK_CATALOG.celebrationTheme,
  ];

  test("all catalog soundtrack files exist as distinct non-symlink production assets", async () => {
    let totalBytes = 0;

    for (const track of allTracks) {
      const filename = track.src.replace("/assets/audio/", "");
      const fullPath = join(audioDir, filename);

      const linkStat = await lstat(fullPath);
      expect(
        linkStat.isSymbolicLink(),
        `Expected ${filename} to be an authentic file, not a symlink`,
      ).toBe(false);

      const fileStat = await stat(fullPath);
      expect(fileStat.size, `Expected ${filename} to be a valid audio file > 100KB`).toBeGreaterThan(100_000);
      totalBytes += fileStat.size;

      // Verify file starts with valid MP3 frame sync / ID3 header
      const header = Buffer.alloc(4);
      const fd = await readFile(fullPath);
      fd.copy(header, 0, 0, 4);
      const b0 = header[0] ?? 0;
      const b1 = header[1] ?? 0;
      const b2 = header[2] ?? 0;
      const isId3 = b0 === 0x49 && b1 === 0x44 && b2 === 0x33; // "ID3"
      const isSyncWord = b0 === 0xff && (b1 & 0xe0) === 0xe0; // MPEG sync
      expect(isId3 || isSyncWord, `Expected valid MP3 audio header in ${filename}`).toBe(true);
    }

    // ADR-0024 constraint: total audio asset payload under ~10 MB (bounded within 15 MB)
    expect(totalBytes).toBeLessThan(15 * 1024 * 1024);
  });
});
