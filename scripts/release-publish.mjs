import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getPublishedPackage, verifyPublishedTarball } from "./release-registry.mjs";

export async function publishPackage(directory, name, version, registry) {
  const filename = `${name.slice(1).replace("/", "-")}-${version}.tgz`;
  const tarball = resolve(directory, filename);
  const data = readFileSync(tarball);
  const manifest = await getPublishedPackage(name, version, registry);
  if (manifest) {
    verifyPublishedTarball(data, manifest);
    console.log(`${name}@${version} 已发布，产物与 npm 一致，跳过重复发布。`);
    return "skipped";
  } else {
    const result = spawnSync("npm", ["publish", tarball, "--access", "public", "--tag", "latest", "--provenance"], { stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`发布 ${name}@${version} 失败（退出码 ${result.status}）`);
    return "published";
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, name, version] = process.argv.slice(2);
  if (process.argv.length !== 5 || !/^@slux\/[a-z][a-z0-9-]*$/.test(name || "") || !/^\d+\.\d+\.\d+$/.test(version || "")) {
    throw new Error("用法：node scripts/release-publish.mjs <产物目录> @slux/包名 X.Y.Z");
  }
  await publishPackage(directory, name, version);
}
