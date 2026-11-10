import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { describeTarball, downloadPublishedTarball, getPublishedPackage } from "./release-registry.mjs";

const root = resolve(import.meta.dirname, "..");
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { "registry-only": { type: "boolean" }, version: { type: "string" } },
});
const destination = positionals[0] && resolve(positionals[0]);
const registryOnly = values["registry-only"];
if (!destination || positionals.length !== 1 || (values.version && (!registryOnly || !/^\d+\.\d+\.\d+$/.test(values.version))))
  throw new Error("用法：node scripts/pack-release.mjs <产物目录> [--registry-only [--version X.Y.Z]]");

const packages = readdirSync(resolve(root, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(root, "packages", entry.name, "package.json")))
  .map((entry) => ({
    directory: entry.name,
    manifest: JSON.parse(readFileSync(resolve(root, "packages", entry.name, "package.json"), "utf8")),
  }))
  .filter(({ manifest }) => !manifest.private)
  .sort((a, b) => a.directory.localeCompare(b.directory));
if (values.version) for (const { manifest } of packages) manifest.version = values.version;
const versions = new Set(packages.map(({ manifest }) => manifest.version));
if (versions.size !== 1) throw new Error("发布包版本不一致");

mkdirSync(destination, { recursive: true });
const expectedTarballs = new Set(packages.map(({ directory, manifest }) => `slux-${directory}-${manifest.version}.tgz`));
const unexpectedTarballs = readdirSync(destination).filter((name) => name.endsWith(".tgz") && !expectedTarballs.has(name));
if (unexpectedTarballs.length) throw new Error(`产物目录含有其他版本包，请使用独立目录：${unexpectedTarballs.join(", ")}`);
const assets = [];
for (const { directory, manifest } of packages) {
  const filename = `slux-${directory}-${manifest.version}.tgz`;
  const tarball = resolve(destination, filename);
  const published = await getPublishedPackage(manifest.name, manifest.version);
  if (published) {
    writeFileSync(tarball, await downloadPublishedTarball(published));
    console.log(`复用 npm 已发布产物：${manifest.name}@${manifest.version}`);
  } else {
    if (registryOnly) throw new Error(`${manifest.name}@${manifest.version} 尚未发布，无法补齐历史附件`);
    const result = spawnSync("pnpm", ["--dir", resolve(root, "packages", directory), "pack", "--pack-destination", destination], {
      cwd: root,
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`打包 ${manifest.name} 失败（退出码 ${result.status}）`);
  }
  if (!existsSync(tarball)) throw new Error(`缺少打包产物：${tarball}`);
  assets.push(describeTarball(manifest.name, manifest.version, filename, readFileSync(tarball)));
}
writeFileSync(resolve(destination, "release-manifest.json"), `${JSON.stringify({ version: [...versions][0], packages: assets }, null, 2)}\n`);
writeFileSync(resolve(destination, "SHA256SUMS"), `${assets.map(({ sha256, filename }) => `${sha256}  ${filename}`).join("\n")}\n`);

const output = process.env.GITHUB_OUTPUT;
if (output) {
  appendFileSync(output, `packages=${JSON.stringify(packages.map(({ directory }) => directory))}\n`);
  appendFileSync(output, `version=${[...versions][0]}\n`);
}
console.log(`已打包 ${packages.length} 个 @slux 包，版本 ${[...versions][0]}`);
