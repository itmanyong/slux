import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
  parseAiDraft,
  parseChangesetPackages,
  renderChangeset,
  renderReleaseNotes,
  selectChangedPackages,
  selectLatestReleaseTag,
} from "./release-lib.mjs";

const packages = ["@slux/core", "@slux/react", "@slux/shared"];

test("首次发布包含全部包，后续发布只给实际改动包写 Changeset", () => {
  assert.deepEqual(selectChangedPackages([], packages, true), packages);
  assert.deepEqual(
    selectChangedPackages(["packages/core/src/index.ts", "packages/core/README.md", "apps/website/docs/index.mdx"], packages, false),
    ["@slux/core"],
  );
  assert.deepEqual(selectChangedPackages([], packages, false, ["@slux/react"]), ["@slux/react"]);
});

test("后续发布以最新版本标签为基线，也识别首次手动发布标签", () => {
  assert.equal(selectLatestReleaseTag(["v0.1.0", "release/v0.2.0", "release/v0.1.5", "invalid"]), "release/v0.2.0");
  assert.equal(selectLatestReleaseTag(["v0.1.0"]), "v0.1.0");
  assert.equal(selectLatestReleaseTag([""]), "");
});

test("已有 Changeset 的包会被识别，README 文本不会冒充变更", () => {
  assert.deepEqual(parseChangesetPackages("---\n\"@slux/core\": patch\n'@slux/react': minor\n---\n\n修复\n", packages), [
    "@slux/core",
    "@slux/react",
  ]);
  assert.deepEqual(parseChangesetPackages("# Changesets\n@slux/core: major", packages), []);
});

test("AI 返回的说明必须有可用摘要和亮点", () => {
  assert.deepEqual(parseAiDraft('```json\n{"summary":"修复订阅清理","highlights":["修复卸载后的重复通知"],"migration":[]}\n```'), {
    summary: "修复订阅清理",
    highlights: ["修复卸载后的重复通知"],
    migration: [],
  });
  assert.throws(() => parseAiDraft('{"summary":"","highlights":[],"migration":[]}'), /摘要/);
});

test("Changeset 写入所选包，发行说明包含版本和迁移提示", () => {
  assert.match(renderChangeset(["@slux/core", "@slux/react"], "minor", "新增订阅 API"), /"@slux\/core": minor\n"@slux\/react": minor/);
  const notes = renderReleaseNotes("0.1.0", {
    summary: "新增订阅 API",
    highlights: ["支持组件卸载时清理订阅"],
    migration: ["升级后检查自定义订阅包装器"],
  });
  assert.match(notes, /^# v0\.1\.0\n/);
  assert.match(notes, /## 升级提示\n- 升级后检查自定义订阅包装器/);
});

test("Changesets 固定分组会把所有 @slux 包纳入同一次升级", () => {
  const root = resolve(import.meta.dirname, "..");
  const dir = mkdtempSync(resolve(tmpdir(), "slux-changesets-"));
  try {
    mkdirSync(resolve(dir, ".changeset"));
    copyFileSync(resolve(root, ".changeset/config.json"), resolve(dir, ".changeset/config.json"));
    writeFileSync(resolve(dir, "package.json"), JSON.stringify({ private: true, workspaces: ["packages/*"] }));
    writeFileSync(resolve(dir, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');
    for (const name of ["a", "b", "c"]) {
      mkdirSync(resolve(dir, "packages", name), { recursive: true });
      writeFileSync(resolve(dir, "packages", name, "package.json"), JSON.stringify({ name: `@slux/${name}`, version: "0.0.1" }));
    }
    mkdirSync(resolve(dir, "packages", "example"), { recursive: true });
    writeFileSync(
      resolve(dir, "packages", "example", "package.json"),
      JSON.stringify({ name: "@slux/example", version: "0.0.1", private: true }),
    );
    writeFileSync(resolve(dir, ".changeset", "sample.md"), renderChangeset(["@slux/a"], "minor", "新增能力"));
    spawnSync("git", ["init", "-q", "-b", "main", dir], { encoding: "utf8" });
    spawnSync("git", ["-C", dir, "add", "."], { encoding: "utf8" });
    spawnSync("git", ["-C", dir, "-c", "user.name=Release Test", "-c", "user.email=release@example.com", "commit", "-qm", "fixture"], {
      encoding: "utf8",
    });
    const cli = resolve(root, "node_modules/@changesets/cli/bin.js");
    const result = spawnSync(process.execPath, [cli, "status"], { cwd: dir, encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /@slux\/a/);
    assert.match(result.stdout, /@slux\/b/);
    assert.match(result.stdout, /@slux\/c/);
    assert.doesNotMatch(result.stdout, /@slux\/example/);
    const version = spawnSync(process.execPath, [cli, "version"], { cwd: dir, encoding: "utf8" });
    assert.equal(version.status, 0, `${version.stdout}\n${version.stderr}`);
    const versions = ["a", "b", "c"].map((name) => JSON.parse(readFileSync(resolve(dir, "packages", name, "package.json"), "utf8")).version);
    assert.deepEqual(versions, ["0.1.0", "0.1.0", "0.1.0"]);
    assert.equal(JSON.parse(readFileSync(resolve(dir, "packages/example/package.json"), "utf8")).version, "0.0.1");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
