import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { parseChangesetPackages, renderReleaseNotes, selectChangedPackages, selectLatestReleaseTag } from "./release-lib.mjs";

const root = resolve(import.meta.dirname, "..");
const help = `用法：pnpm release\n\n请先自行撰写并提交 Changeset。脚本确认变更日志后，升级统一版本、生成自动导入 API 清单、同步包导航、验证、提交并推送发布标签。GitHub Actions 会直接发布 npm 包。\n`;

function output(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 }).trim();
}

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} 失败（退出码 ${result.status}）`);
}

async function confirm(rl, question) {
  return (await rl.question(`${question} (输入 yes 继续)：`)).trim() === "yes";
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(help);
    return;
  }
  if (process.argv.length > 2) throw new Error(`未知参数：${process.argv.slice(2).join(" ")}`);
  if (output("git", ["status", "--porcelain"], process.cwd())) throw new Error("工作区有未提交内容，请先提交或移走这些改动");
  if (process.cwd() !== root) throw new Error(`请在仓库根目录运行：${root}`);
  if (output("git", ["branch", "--show-current"]) !== "main") throw new Error("发布必须从 main 分支执行");
  if (!output("git", ["remote"]).split("\n").includes("origin")) throw new Error("缺少 origin/main，请先配置 Git 远端");
  const remoteMain = output("git", ["ls-remote", "origin", "refs/heads/main"]).split("\t")[0];
  if (remoteMain !== output("git", ["rev-parse", "HEAD"])) throw new Error("本地 main 与 origin/main 不一致，请先同步后再发布");

  const packageNames = readdirSync(resolve(root, "packages"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(root, "packages", entry.name, "package.json")))
    .map((entry) => JSON.parse(readFileSync(resolve(root, "packages", entry.name, "package.json"), "utf8")))
    .filter((pkg) => !pkg.private)
    .map((pkg) => pkg.name)
    .sort();
  const previousVersions = new Set(
    packageNames.map((name) => JSON.parse(readFileSync(resolve(root, "packages", name.split("/")[1], "package.json"), "utf8")).version),
  );
  if (previousVersions.size !== 1) throw new Error("发布包版本不一致，请先修复后再发布");

  const previousTag = selectLatestReleaseTag(output("git", ["tag", "--list", "release/v*", "v*"]).split("\n"));
  const changedPaths = previousTag
    ? output("git", ["diff", "--name-only", `${previousTag}..HEAD`, "--", "packages"])
        .split("\n")
        .filter(Boolean)
    : [];
  const pendingChangesets = readdirSync(resolve(root, ".changeset"))
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => ({ name, content: readFileSync(resolve(root, ".changeset", name), "utf8") }));
  const pendingPackages = [...new Set(pendingChangesets.flatMap(({ content }) => parseChangesetPackages(content, packageNames)))];
  const changedPackages = selectChangedPackages(changedPaths, packageNames, !previousTag, pendingPackages);
  if (!changedPackages.length) throw new Error("上次发布后没有包代码变动或待发布 Changeset，不需要发布");

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(`上次发布：${previousTag || "首次发布"}\n本次涉及的包：${changedPackages.join(", ")}`);
    console.log(`待发布 Changeset：${pendingChangesets.map(({ name }) => name).join(", ") || "无"}`);
    if (!(await confirm(rl, "是否已经撰写并核对 Changeset 变更日志"))) throw new Error("请先完成 Changeset 变更日志");
    if (!pendingChangesets.length || !pendingPackages.length) throw new Error("没有有效的待发布 Changeset，请先运行 pnpm changeset 并提交");

    run("pnpm", ["exec", "changeset", "status"]);
    run("pnpm", ["exec", "changeset", "version"]);
    run("pnpm", ["install", "--lockfile-only"]);
    const version = JSON.parse(readFileSync(resolve(root, "packages/core/package.json"), "utf8")).version;
    const versions = new Set(
      packageNames.map((name) => JSON.parse(readFileSync(resolve(root, "packages", name.split("/")[1], "package.json"), "utf8")).version),
    );
    if (versions.size !== 1 || !versions.has(version) || previousVersions.has(version))
      throw new Error("Changesets 没有将所有发布包升级到同一新版本");

    run("pnpm", ["generate:apis"]);
    run("pnpm", ["sync:package-navigation"]);
    run("pnpm", ["test:release"]);
    run("pnpm", ["lint"]);
    run("pnpm", ["build"]);
    run("pnpm", ["typecheck"]);
    run("pnpm", ["test"]);
    const tag = `release/v${version}`;
    if (output("git", ["tag", "--list", tag])) throw new Error(`${tag} 标签已存在`);
    mkdirSync(resolve(root, "releases"), { recursive: true });
    writeFileSync(
      resolve(root, "releases", `v${version}.md`),
      renderReleaseNotes(
        version,
        pendingChangesets.map(({ content }) => content),
      ),
    );
    run("git", ["add", "--", ".changeset", "packages", "pnpm-lock.yaml", "releases"]);
    console.log(`\n准备提交 ${tag}：\n${output("git", ["diff", "--cached", "--stat"])}`);
    if (!(await confirm(rl, "提交、打标签并推送 main 和标签"))) {
      console.log("已取消推送。版本文件和发行说明留在工作区，供你检查。");
      return;
    }
    run("git", ["commit", "-m", `chore(release): v${version}`]);
    run("git", ["tag", tag]);
    run("git", ["push", "--atomic", "origin", "main", tag]);
    console.log(`已推送 ${tag}；GitHub Actions 会直接发布 npm 包。`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
