import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const destination = process.argv[2];
if (!destination || process.argv.length !== 3) throw new Error("用法：node scripts/pack-release.mjs <产物目录>");

const packages = readdirSync(resolve(root, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(root, "packages", entry.name, "package.json")))
  .map((entry) => ({
    directory: entry.name,
    manifest: JSON.parse(readFileSync(resolve(root, "packages", entry.name, "package.json"), "utf8")),
  }))
  .filter(({ manifest }) => !manifest.private)
  .sort((a, b) => a.directory.localeCompare(b.directory));
const versions = new Set(packages.map(({ manifest }) => manifest.version));
if (versions.size !== 1) throw new Error("发布包版本不一致");

mkdirSync(destination, { recursive: true });
for (const { directory, manifest } of packages) {
  const result = spawnSync("pnpm", ["--dir", resolve(root, "packages", directory), "pack", "--pack-destination", destination], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`打包 ${manifest.name} 失败（退出码 ${result.status}）`);
  const tarball = resolve(destination, `slux-${directory}-${manifest.version}.tgz`);
  if (!existsSync(tarball)) throw new Error(`缺少打包产物：${tarball}`);
}

const output = process.env.GITHUB_OUTPUT;
if (output) {
  appendFileSync(output, `packages=${JSON.stringify(packages.map(({ directory }) => directory))}\n`);
  appendFileSync(output, `version=${[...versions][0]}\n`);
}
console.log(`已打包 ${packages.length} 个 @slux 包，版本 ${[...versions][0]}`);
