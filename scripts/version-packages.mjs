import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseReleaseEntries, renderEntrySections, selectLatestReleaseTag } from "./release-lib.mjs";
import { collectReleaseHistory, writeReleaseNotes } from "./release-notes.mjs";
import { readPackageManifests, writePackageChangelogs } from "./package-changelog.mjs";

const root = resolve(import.meta.dirname, "..");

export function versionPackages(cwd = root, changesetCli = resolve(root, "node_modules/@changesets/cli/bin.js")) {
  const before = readPackageManifests(cwd);
  const changesets = readdirSync(resolve(cwd, ".changeset"))
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => ({ name, content: readFileSync(resolve(cwd, ".changeset", name), "utf8") }));
  const entries = parseReleaseEntries(
    changesets,
    before.map(({ name }) => name),
  );
  const previousTag = selectLatestReleaseTag(execFileSync("git", ["tag", "--merged", "HEAD"], { cwd, encoding: "utf8" }).trim().split("\n"));
  const { commits } = collectReleaseHistory(cwd, previousTag);
  const result = spawnSync(process.execPath, [changesetCli, "version"], { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Changesets 升版失败（退出码 ${result.status}）`);
  const after = readPackageManifests(cwd);
  const version = after[0]?.version;
  if (!version || after.some((manifest) => manifest.version !== version) || before.some((manifest) => manifest.version === version)) {
    throw new Error("Changesets 没有将所有发布包升级到同一新版本");
  }
  const source = `${renderEntrySections(entries)}\n`;
  mkdirSync(resolve(cwd, "releases/sources"), { recursive: true });
  writeFileSync(resolve(cwd, "releases/sources", `v${version}.md`), source);
  writeReleaseNotes(cwd, version, [source], { commits, previousTag });
  writePackageChangelogs(cwd, before, after, entries);
  console.log(`已同步 ${after.length} 个包的版本、专属 CHANGELOG、发行说明及根 CHANGELOG：${version}`);
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    versionPackages();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
