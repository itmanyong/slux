import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = resolve(import.meta.dirname, "release.mjs");

test("帮助命令说明人工 Changeset 和直接发布，不触发发布", () => {
  const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Changeset/);
  assert.match(result.stdout, /直接发布/);
  assert.doesNotMatch(result.stdout, /RELEASE_AI_API_KEY/);
});

test("工作区有未提交内容时在升级版本前终止", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "slux-release-"));
  try {
    spawnSync("git", ["init", "-q", dir], { encoding: "utf8" });
    writeFileSync(resolve(dir, "dirty.txt"), "pending\n");
    const result = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /工作区.*未提交/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("没有可用的 origin/main 时停止在版本修改之前", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "slux-release-"));
  try {
    spawnSync("git", ["init", "-q", "-b", "main", dir], { encoding: "utf8" });
    mkdirSync(resolve(dir, "scripts"));
    copyFileSync(script, resolve(dir, "scripts/release.mjs"));
    copyFileSync(resolve(import.meta.dirname, "release-lib.mjs"), resolve(dir, "scripts/release-lib.mjs"));
    copyFileSync(resolve(import.meta.dirname, "release-notes.mjs"), resolve(dir, "scripts/release-notes.mjs"));
    writeFileSync(resolve(dir, "README.md"), "fixture\n");
    spawnSync("git", ["-C", dir, "add", "."], { encoding: "utf8" });
    spawnSync("git", ["-C", dir, "-c", "user.name=Release Test", "-c", "user.email=release@example.com", "commit", "-qm", "fixture"], {
      encoding: "utf8",
    });
    const result = spawnSync(process.execPath, [resolve(dir, "scripts/release.mjs")], { cwd: dir, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /origin.*main/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
