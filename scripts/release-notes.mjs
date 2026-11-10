import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { renderChangelog, renderReleaseNotes, selectLatestReleaseTag } from "./release-lib.mjs";

const root = resolve(import.meta.dirname, "..");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).trim();
}

export function collectReleaseHistory(cwd, previousTag, ref = "HEAD") {
  const range = previousTag ? `${previousTag}..${ref}` : ref;
  const commits = git(cwd, ["log", "--no-merges", "--reverse", "--format=%H%x09%s", range])
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, ...subject] = line.split("\t");
      return { hash, subject: subject.join("\t") };
    });
  const paths = new Set();
  for (const { hash } of commits) {
    for (const path of git(cwd, [
      "diff-tree",
      "--root",
      "--no-commit-id",
      "--diff-filter=AD",
      "--name-only",
      "-r",
      hash,
      "--",
      ".changeset",
    ]).split("\n")) {
      if (path.endsWith(".md") && path !== ".changeset/README.md") paths.add(path);
    }
  }
  // 读取删除前的最后一版，也覆盖上一标签前已存在、这次才被消费的 Changeset。
  const changesets = [...paths].map((path) => {
    const lastEdit = git(cwd, ["log", "-1", "--diff-filter=AM", "--format=%H", ref, "--", path]);
    return { name: path, content: git(cwd, ["show", `${lastEdit}:${path}`]) };
  });
  return { commits, changesets };
}

export function writeReleaseNotes(cwd, version, changesets, options) {
  const directory = resolve(cwd, "releases");
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, `v${version}.md`), renderReleaseNotes(version, changesets, options));
  const releases = readdirSync(directory)
    .filter((name) => /^v\d+\.\d+\.\d+\.md$/.test(name))
    .map((name) => ({ version: name.slice(1, -3), content: readFileSync(resolve(directory, name), "utf8") }));
  writeFileSync(resolve(cwd, "CHANGELOG.md"), renderChangelog(releases));
}

function main() {
  const { values } = parseArgs({
    options: {
      version: { type: "string" },
      from: { type: "string" },
      to: { type: "string", default: "HEAD" },
      tag: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.log(
      "用法：pnpm release:notes --version X.Y.Z [--from 上一标签] [--to 当前标签或HEAD] [--tag 发布标签]\n根据真实 Git 提交和该区间的 Changeset 生成 releases/vX.Y.Z.md 与根 CHANGELOG.md；不升级包版本、不发布。",
    );
    return;
  }
  if (!/^\d+\.\d+\.\d+$/.test(values.version || "")) throw new Error("请指定 --version X.Y.Z");
  const tags = git(root, ["tag", "--merged", values.to])
    .split("\n")
    .filter((tag) => tag !== `v${values.version}` && tag !== `release/v${values.version}`);
  const previousTag = values.from ?? selectLatestReleaseTag(tags);
  const history = collectReleaseHistory(root, previousTag, values.to);
  const sourcePath = resolve(root, "releases/sources", `v${values.version}.md`);
  if (existsSync(sourcePath)) history.changesets = [readFileSync(sourcePath, "utf8")];
  const tag =
    values.tag || ([`v${values.version}`, `release/v${values.version}`].includes(values.to) ? values.to : `release/v${values.version}`);
  writeReleaseNotes(root, values.version, history.changesets, { ...history, previousTag, tag });
  console.log(`已生成 releases/v${values.version}.md 和 CHANGELOG.md（${history.commits.length} 个真实提交）`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
