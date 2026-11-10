import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { classifyCommit, renderReleaseNotes } from "./release-lib.mjs";
import { collectPackageChangelogNotes, collectReleaseHistory, writeReleaseNotes } from "./release-notes.mjs";

test("分类说明保留 Changeset 细节和真实提交链接，省略空分类，不凭空生成 PR", () => {
  const content =
    '---\n"@slux/core": minor\n---\n\n### New Features 🎉\n\n- 新增订阅。\n  - 卸载组件时清理。\n\n### Document\n\n- 补充订阅示例。';
  const notes = renderReleaseNotes("0.2.0", [content, content], {
    previousTag: "release/v0.1.1",
    commits: [
      { hash: "abc1234", subject: "fix(core): clear observers" },
      { hash: "bcd2345", subject: "docs: explain cleanup" },
      { hash: "cde3456", subject: "chore(release): v0.2.0" },
    ],
  });
  assert.match(notes, /### New Features 🎉\n\n- 新增订阅。\n {2}- 卸载组件时清理。/);
  assert.equal(notes.match(/新增订阅/g).length, 1);
  assert.match(notes, /### Bug Fixes 🐞/);
  assert.match(notes, /commit\/abc1234/);
  assert.match(notes, /compare\/release\/v0.1.1\.\.\.release\/v0.2.0/);
  assert.match(notes, /<summary>相关提交（1）<\/summary>/);
  assert.doesNotMatch(notes, /Performance|Refactor|Other Changes|pull\/|cde3456|"@slux/);
  assert.equal(classifyCommit("feat(core)!: change API"), "New Features");
  assert.equal(classifyCommit("perf: reduce allocations"), "Performance");
  assert.equal(classifyCommit("refactor(core): simplify subscription"), "Refactor");
  assert.equal(classifyCommit("build: update config"), "Other Changes");
});

test("真实 Git 区间还原已删除 Changeset 的最终修订，包括上一版本前已提交的记录", () => {
  const cwd = mkdtempSync(resolve(tmpdir(), "slux-release-history-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  const commit = (message) => {
    git("add", ".");
    git("-c", "user.name=Release Test", "-c", "user.email=release@example.com", "commit", "-qm", message);
  };
  try {
    git("init", "-q", "-b", "main");
    mkdirSync(resolve(cwd, ".changeset"));
    writeFileSync(resolve(cwd, ".changeset/early.md"), '---\n"@slux/core": patch\n---\n\n待发布的更改');
    commit("fix: previous change");
    git("tag", "release/v0.1.0");
    writeFileSync(resolve(cwd, ".changeset/new.md"), '---\n"@slux/core": minor\n---\n\n最初的说明');
    commit("feat(core): add subscription");
    writeFileSync(resolve(cwd, ".changeset/new.md"), '---\n"@slux/core": minor\n---\n\n核对后的详细说明');
    commit("docs: refine changeset");
    rmSync(resolve(cwd, ".changeset/new.md"));
    rmSync(resolve(cwd, ".changeset/early.md"));
    mkdirSync(resolve(cwd, "packages/core"), { recursive: true });
    writeFileSync(
      resolve(cwd, "packages/core/CHANGELOG.md"),
      "# @slux/core\n\n## 0.2.0\n\n### Minor Changes\n\n- abc1234: 功能详情\n\n- Updated dependencies [abc1234]\n  - @slux/shared@0.2.0\n\n## 0.1.0\n\n旧说明\n",
    );
    commit("chore(release): v0.2.0");
    git("tag", "release/v0.2.0");
    const history = collectReleaseHistory(cwd, "release/v0.1.0", "release/v0.2.0");
    assert.equal(history.commits.length, 3);
    assert.equal(history.changesets.length, 2);
    assert.ok(history.changesets.some(({ content }) => content.includes("核对后的详细说明")));
    assert.ok(history.changesets.some(({ content }) => content.includes("待发布的更改")));
    assert.deepEqual(collectPackageChangelogNotes(cwd, "0.2.0", "release/v0.2.0"), ["- 功能详情"]);
    writeReleaseNotes(cwd, "0.2.0", history.changesets, { ...history, previousTag: "release/v0.1.0" });
    const first = readFileSync(resolve(cwd, "CHANGELOG.md"), "utf8");
    writeReleaseNotes(cwd, "0.2.0", history.changesets, { ...history, previousTag: "release/v0.1.0" });
    assert.equal(readFileSync(resolve(cwd, "CHANGELOG.md"), "utf8"), first);
    assert.equal(first.match(/^## v0.2.0$/gm).length, 1);
    assert.doesNotMatch(first, /previous change|旧说明|最初的说明/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
