import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("各发布包的 clean 清理产物、缓存和包内依赖", () => {
  for (const entry of [
    "actview",
    "angular",
    "atom",
    "core",
    "devtools",
    "flux",
    "history",
    "inferno",
    "octane",
    "preact",
    "proxy",
    "react",
    "ripple",
    "rxjs",
    "shared",
    "solid",
    "state-machine",
    "storage",
    "store",
    "svelte",
    "tab-sync",
    "telemetry",
    "viewfly",
    "vitarx",
    "vue",
  ]) {
    const { scripts } = JSON.parse(readFileSync(resolve(root, "packages", entry, "package.json"), "utf8"));
    const fixture = mkdtempSync(resolve(tmpdir(), `slux-clean-${entry}-`));
    try {
      writeFileSync(
        resolve(fixture, "package.json"),
        JSON.stringify({ name: `test-${entry}`, private: true, scripts: { clean: scripts.clean } }),
      );
      for (const directory of ["dist", ".turbo", "node_modules"]) {
        mkdirSync(resolve(fixture, directory));
        writeFileSync(resolve(fixture, directory, "sample.txt"), "fixture");
      }
      writeFileSync(resolve(fixture, "keep.txt"), "fixture");
      const result = spawnSync("pnpm", ["run", "clean"], { cwd: fixture, encoding: "utf8" });
      assert.equal(result.status, 0, `${entry}: ${result.stderr || result.error?.message}`);
      for (const directory of ["dist", ".turbo", "node_modules"])
        assert.equal(existsSync(resolve(fixture, directory)), false, `${entry}: ${directory} 未清理`);
      assert.equal(existsSync(resolve(fixture, "keep.txt")), true, `${entry}: clean 删除了无关文件`);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  }
});
