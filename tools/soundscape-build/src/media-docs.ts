import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isErrnoCode, publishArtifactsAtomically } from "./artifacts";

const MEDIA_DOCS_START = "<!-- soundscape-build:start -->";
const MEDIA_DOCS_END = "<!-- soundscape-build:end -->";

function hasProhibitedSecretField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasProhibitedSecretField);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
    /(?:api.?key|credential|secret|key.?file)/i.test(key) || hasProhibitedSecretField(child)
  );
}

async function renderMediaDocsSection(outputRoot: string): Promise<string> {
  const provenanceRoot = join(outputRoot, "provenance");
  let filenames: string[];
  try {
    filenames = (await readdir(provenanceRoot))
      .filter((filename) => filename.endsWith(".json"))
      .sort();
  } catch (error) {
    if (isErrnoCode(error, "ENOENT")) filenames = [];
    else throw error;
  }
  if (filenames.length === 0) {
    throw new Error("No approved soundscape provenance is available");
  }

  const provenanceEntries: Array<Record<string, unknown>> = [];
  for (const filename of filenames) {
    const provenance = JSON.parse(
      await readFile(join(provenanceRoot, filename), "utf8"),
    ) as Record<string, unknown>;
    if (hasProhibitedSecretField(provenance)) {
      throw new Error("Soundscape provenance contains prohibited secret material");
    }
    provenanceEntries.push(provenance);
  }

  const lines = [
    MEDIA_DOCS_START,
    "## Fairytale Soundscape",
    "",
    "Credit: ElevenLabs Sound Effects API. This project documentation records the provider; No in-game provider credit is added.",
  ];
  for (
    const provenance of provenanceEntries.sort((left, right) =>
      String(left.cueId).localeCompare(String(right.cueId)))
  ) {
    const parameters = provenance.parameters as Record<string, unknown> | undefined;
    const processing = Array.isArray(provenance.processing)
      ? provenance.processing.map(String).join(", ")
      : "not recorded";
    lines.push(
      "",
      `### ${String(provenance.cueId)}`,
      "",
      `> ${String(parameters?.prompt ?? "Prompt not recorded.")}`,
      "",
      `Parameters: ${String(parameters?.durationSeconds)} seconds, prompt influence ${String(parameters?.promptInfluence)}, looping ${parameters?.loop ? "on" : "off"}, source format \`${String(parameters?.sourceFormat)}\`.`,
      "",
      `Production treatment: ${processing}.`,
      "",
      `Selection: ${String(provenance.selectionReason ?? "Not recorded.")}`,
      "",
      `Source master: \`${String(provenance.sourceMasterId)}\``,
    );
  }
  lines.push("", MEDIA_DOCS_END);
  return `${lines.join("\n")}\n`;
}

export async function manageMediaDocs(args: {
  outputRoot: string;
  mediaDocPath: string;
  mode: "generate" | "validate";
}): Promise<void> {
  const expectedSection = await renderMediaDocsSection(args.outputRoot);
  let current = "";
  try {
    current = await readFile(args.mediaDocPath, "utf8");
  } catch (error) {
    if (!isErrnoCode(error, "ENOENT")) throw error;
  }
  const start = current.indexOf(MEDIA_DOCS_START);
  const endMarker = current.indexOf(MEDIA_DOCS_END);
  const end = endMarker < 0 ? -1 : endMarker + MEDIA_DOCS_END.length;
  if (args.mode === "validate") {
    if (start < 0 || end < start || `${current.slice(start, end)}\n` !== expectedSection) {
      throw new Error("Fairytale Soundscape media documentation is stale or incomplete");
    }
    return;
  }

  const prefix = start >= 0 ? current.slice(0, start).trimEnd() : current.trimEnd();
  const suffix = start >= 0 && end >= start ? current.slice(end).trimStart() : "";
  const next = [prefix, expectedSection.trimEnd(), suffix]
    .filter((part) => part.length > 0)
    .join("\n\n");
  await publishArtifactsAtomically(dirname(args.mediaDocPath), [{
    path: args.mediaDocPath,
    contents: `${next}\n`,
  }]);
}
