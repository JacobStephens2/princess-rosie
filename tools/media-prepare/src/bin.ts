import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runMediaPrepareCli } from "./cli";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const suppliedOptions = process.argv.slice(2);
const options = [...suppliedOptions];

function provideDefault(option: string, value: string): void {
  if (!options.includes(option)) {
    options.push(option, value);
  }
}

provideDefault(
  "--media-manifest",
  join(repositoryRoot, "shared", "edition", "media.json"),
);
provideDefault(
  "--source-root",
  join(repositoryRoot, "shared", "edition"),
);
provideDefault(
  "--output-dir",
  join(repositoryRoot, "apps", "web", "public", "assets", "derivatives"),
);
provideDefault(
  "--manifest-output",
  join(repositoryRoot, "apps", "web", "public", "assets", "derivative-manifest.json"),
);
provideDefault(
  "--web-asset-prefix",
  "/assets/derivatives/",
);

const result = await runMediaPrepareCli({
  argv: options,
});
process.exitCode = result.exitCode;
