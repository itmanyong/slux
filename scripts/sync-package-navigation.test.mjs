import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const script = resolve(import.meta.dirname, "sync-package-navigation.mjs");

test("同步包导航与各包 README 版本号，再次执行会覆盖旧内容", () => {
  const root = mkdtempSync(resolve(tmpdir(), "slux-navigation-"));
  try {
    mkdirSync(resolve(root, "scripts"));
    copyFileSync(script, resolve(root, "scripts/sync-package-navigation.mjs"));
    for (const name of ["core", "vue"]) {
      mkdirSync(resolve(root, "packages", name), { recursive: true });
      writeFileSync(resolve(root, "packages", name, "package.json"), JSON.stringify({ name: `@slux/${name}`, version: "0.2.5" }));
      const versionLine =
        name === "core" ? "- 版本：`0.1.0`（`package.json`）。" : `| 包名 / 版本 | \`@slux/${name}\` \`0.1.0\` | \`package.json\` |`;
      writeFileSync(resolve(root, "packages", name, "README.md"), `# ${name}\n\n包说明。\n\n${versionLine}\n\n- 依赖要求 \`1.2.3\` 以上。\n`);
    }
    const firstNavigation = "## 包导航\n\n| 包名 | 版本 |\n| ---- | ---- |\n| core | v1 |";
    writeFileSync(resolve(root, "README.md"), `# 根目录\n\n${firstNavigation}\n\n## 安装\n`);

    const run = () => spawnSync(process.execPath, [resolve(root, "scripts/sync-package-navigation.mjs")], { cwd: root, encoding: "utf8" });
    assert.equal(run().status, 0);
    for (const name of ["core", "vue"]) {
      const content = readFileSync(resolve(root, "packages", name, "README.md"), "utf8");
      assert.match(content, /^# \w+\n\n包说明。\n\n/);
      assert.ok(content.includes(firstNavigation));
      assert.ok(content.includes(`<!-- package-navigation:start -->\n\n${firstNavigation}\n\n<!-- package-navigation:end -->`));
      assert.equal((content.match(/^## 包导航$/gm) || []).length, 1);
      assert.ok(content.trimEnd().endsWith("<!-- package-navigation:end -->"));
      assert.ok(content.includes("`0.2.5`"), `${name} 的版本号未跟随 package.json`);
      assert.ok(!content.includes("`0.1.0`"), `${name} 残留旧版本号`);
      assert.ok(content.includes("- 依赖要求 `1.2.3` 以上。"), `${name} 误改了非版本行的 semver`);
    }

    // 升版后再次运行：版本号跟随 package.json，导航覆盖旧内容，重复执行幂等。
    for (const name of ["core", "vue"]) {
      writeFileSync(resolve(root, "packages", name, "package.json"), JSON.stringify({ name: `@slux/${name}`, version: "0.3.0-beta.1" }));
    }
    const nextNavigation = firstNavigation.replace("core | v1", "core | v2");
    writeFileSync(resolve(root, "README.md"), `# 根目录\n\n${nextNavigation}\n\n## 安装\n`);
    assert.equal(run().status, 0);
    for (const name of ["core", "vue"]) {
      const content = readFileSync(resolve(root, "packages", name, "README.md"), "utf8");
      assert.ok(content.includes(nextNavigation));
      assert.ok(!content.includes(firstNavigation));
      assert.equal((content.match(/^## 包导航$/gm) || []).length, 1);
      assert.ok(content.includes("`0.3.0-beta.1`"), `${name} 升版后版本号未同步`);
      assert.ok(!content.includes("`0.2.5`"), `${name} 残留上一版本号`);
      assert.ok(content.includes("- 依赖要求 `1.2.3` 以上。"));
    }
    const beforeRerun = readFileSync(resolve(root, "packages/core/README.md"), "utf8");
    assert.equal(run().status, 0);
    assert.equal(readFileSync(resolve(root, "packages/core/README.md"), "utf8"), beforeRerun, "重复执行应保持幂等");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
