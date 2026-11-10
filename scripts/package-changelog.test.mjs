import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { parseReleaseEntries } from "./release-lib.mjs";
import { renderPackageVersion, writePackageChangelogs } from "./package-changelog.mjs";
import { versionPackages } from "./version-packages.mjs";
import { regenerateChangelogs } from "./generate-changelogs.mjs";

test("Changeset 在入口拒绝缺失或未知 scope，禁止记录未声明的其他包", () => {
  const packages = ["@slux/core", "@slux/react"];
  assert.throws(() => parseReleaseEntries(["- 修复订阅"], packages), /type\(scope\)/);
  assert.throws(() => parseReleaseEntries(["- fix: 修复订阅"], packages), /type\(scope\)/);
  assert.throws(() => parseReleaseEntries(["- fix(croe): 修复订阅"], packages), /未知变更 scope/);
  assert.throws(() => parseReleaseEntries(['---\n"@slux/core": patch\n---\n- fix(react): 修复订阅'], packages), /未声明 @slux\/react/);
  const entries = parseReleaseEntries(
    ['---\n"@slux/core": patch\n"@slux/react": patch\n---\n- fix(core,react): 释放订阅\n- ci(release): 调整发布目录'],
    packages,
  );
  const core = { name: "@slux/core", version: "0.2.0" };
  const output = renderPackageVersion(core, [{ ...core, version: "0.1.0" }], [core], entries);
  assert.match(output, /^## 0\.2\.0\n\n### Bug Fixes 🐞\n\n- fix\(core\): 释放订阅/);
  assert.doesNotMatch(output, /react|release|调整发布|# @slux/);
});

test("固定组跟随版本与真实依赖变化合为一条记录，未升级包不重写", () => {
  const cwd = mkdtempSync(resolve(tmpdir(), "slux-package-changelog-"));
  try {
    const before = [
      { name: "@slux/core", version: "0.1.0" },
      { name: "@slux/shared", version: "0.1.0" },
      {
        name: "@slux/react",
        version: "0.1.0",
        peerDependencies: { "@slux/core": "workspace:^", "@slux/shared": "workspace:^" },
        devDependencies: { "@slux/devtools": "workspace:*" },
      },
    ];
    const after = [{ ...before[0], version: "0.1.1" }, before[1], { ...before[2], version: "0.1.1" }];
    const entries = parseReleaseEntries(["- ci(release): 修复发布目录"]);
    const result = renderPackageVersion(after[2], before, after, entries);
    assert.match(result, /chore\(react\): 跟随统一版本升级至 0\.1\.1；更新本包内部依赖：@slux\/core（\^0\.1\.0 → \^0\.1\.1）/);
    assert.equal(result.match(/^- /gm).length, 1);
    assert.doesNotMatch(result, /shared|devtools|修复发布目录/);
    for (const name of ["core", "shared", "react"]) mkdirSync(resolve(cwd, "packages", name), { recursive: true });
    const shared = resolve(cwd, "packages/shared/CHANGELOG.md");
    writeFileSync(shared, "## 0.1.0\n\n保持原样\n");
    writePackageChangelogs(cwd, before, after, entries);
    assert.equal(readFileSync(shared, "utf8"), "## 0.1.0\n\n保持原样\n");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("统一升版调用真实 Changesets，生成归属正确的日志，历史重生成幂等且不再升版", () => {
  const root = resolve(import.meta.dirname, "..");
  const cwd = mkdtempSync(resolve(tmpdir(), "slux-version-packages-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
  const commit = (message) => {
    git("add", ".");
    git("-c", "user.name=Release Test", "-c", "user.email=release@example.com", "commit", "-qm", message);
  };
  try {
    mkdirSync(resolve(cwd, ".changeset"));
    mkdirSync(resolve(cwd, "releases/sources"), { recursive: true });
    copyFileSync(resolve(root, ".changeset/config.json"), resolve(cwd, ".changeset/config.json"));
    writeFileSync(resolve(cwd, "package.json"), JSON.stringify({ private: true, workspaces: ["packages/*"] }));
    writeFileSync(resolve(cwd, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');
    for (const name of ["core", "react", "shared"]) {
      mkdirSync(resolve(cwd, "packages", name), { recursive: true });
      writeFileSync(
        resolve(cwd, "packages", name, "package.json"),
        JSON.stringify({
          name: `@slux/${name}`,
          version: "0.1.0",
          ...(name === "react" && { peerDependencies: { "@slux/core": "workspace:^" } }),
        }),
      );
    }
    writeFileSync(
      resolve(cwd, "releases/sources/v0.1.0.md"),
      "### New Features 🎉\n\n- feat(core): 提供响应式信号\n- feat(react): 提供 React 订阅\n- feat(shared): 提供共享工具\n",
    );
    git("init", "-q", "-b", "main");
    commit("feat(repo): initial publication");
    git("tag", "v0.1.0");
    writeFileSync(
      resolve(cwd, ".changeset/fix.md"),
      '---\n"@slux/core": patch\n---\n\n### Bug Fixes 🐞\n\n- fix(core): 释放订阅\n\n### Other Changes\n\n- ci(release): 修复发布目录\n',
    );
    commit("fix(core): release subscription");
    const version = versionPackages(cwd, resolve(root, "node_modules/@changesets/cli/bin.js"));
    assert.equal(version, "0.1.1");
    const core = readFileSync(resolve(cwd, "packages/core/CHANGELOG.md"), "utf8");
    const react = readFileSync(resolve(cwd, "packages/react/CHANGELOG.md"), "utf8");
    const shared = readFileSync(resolve(cwd, "packages/shared/CHANGELOG.md"), "utf8");
    assert.match(core, /^## 0\.1\.1\n\n### Bug Fixes 🐞\n\n- fix\(core\): 释放订阅/);
    assert.doesNotMatch(core, /ci\(release\)|Patch Changes|Minor Changes|^- \w+: ###/m);
    assert.match(react, /chore\(react\): 跟随统一版本升级/);
    assert.doesNotMatch(react, /fix\(core\)|修复发布目录/);
    assert.match(shared, /chore\(shared\): 跟随统一版本升级/);
    assert.throws(() => versionPackages(cwd, resolve(root, "node_modules/@changesets/cli/bin.js")), /缺少变更说明/);
    assert.equal(readFileSync(resolve(cwd, "packages/core/CHANGELOG.md"), "utf8"), core);
    commit("chore(release): v0.1.1");
    git("tag", "release/v0.1.1");
    regenerateChangelogs(cwd);
    const paths = [
      "CHANGELOG.md",
      "releases/v0.1.0.md",
      "releases/v0.1.1.md",
      "packages/core/CHANGELOG.md",
      "packages/react/CHANGELOG.md",
      "packages/shared/CHANGELOG.md",
    ];
    const snapshot = paths.map((path) => readFileSync(resolve(cwd, path), "utf8"));
    regenerateChangelogs(cwd);
    assert.deepEqual(
      paths.map((path) => readFileSync(resolve(cwd, path), "utf8")),
      snapshot,
    );
    assert.match(snapshot[0], /^## v0\.1\.1/);
    assert.match(snapshot[3], /## 0\.1\.0\n\n### New Features 🎉\n\n- feat\(core\): 提供响应式信号/);
    assert.equal(JSON.parse(readFileSync(resolve(cwd, "packages/core/package.json"), "utf8")).version, "0.1.1");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
