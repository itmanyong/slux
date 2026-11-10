import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("生成自动导入清单时不登记生成函数自身", () => {
  const result = spawnSync(process.execPath, [resolve(root, "scripts/generate-import-apis.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const core = readFileSync(resolve(root, "packages/core/src/auto-import-api.ts"), "utf8");
  const list = core.match(/const allImportApis: string\[\] = (\[[\s\S]*?\]);/)?.[1];
  assert.ok(list);
  assert.match(list, /"signal"/);
  assert.doesNotMatch(list, /"createAutoImportApis"/);
});
