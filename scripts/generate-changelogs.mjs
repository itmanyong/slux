import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseReleaseEntries } from "./release-lib.mjs";
import { collectReleaseHistory, writeReleaseNotes } from "./release-notes.mjs";
import { readPackageManifests, writePackageChangelogs } from "./package-changelog.mjs";

const root = resolve(import.meta.dirname, "..");

export function regenerateChangelogs(cwd = root) {
  const tags = execFileSync("git", ["tag", "--merged", "HEAD"], {
    cwd,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .map((tag) => ({
      tag,
      version: tag
        .match(/^(?:release\/)?v(\d+)\.(\d+)\.(\d+)$/)
        ?.slice(1)
        .map(Number),
    }))
    .filter(({ version }) => version)
    .sort((a, b) => a.version[0] - b.version[0] || a.version[1] - b.version[1] || a.version[2] - b.version[2]);
  let before = [];
  let previousTag = "";
  for (const { tag, version: parts } of tags) {
    const version = parts.join(".");
    const after = readPackageManifests(cwd, tag);
    const source = readFileSync(resolve(cwd, "releases/sources", `v${version}.md`), "utf8");
    const entries = parseReleaseEntries(
      [source],
      after.map(({ name }) => name),
    );
    const { commits } = collectReleaseHistory(cwd, previousTag, tag);
    writeReleaseNotes(cwd, version, [source], { commits, previousTag, tag });
    writePackageChangelogs(cwd, before, after, entries);
    before = after;
    previousTag = tag;
    console.log(`已重生成 ${tag} 的发行说明、根及 ${after.length} 个包的 CHANGELOG`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    regenerateChangelogs();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
