import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import test from "node:test";

const websiteRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(websiteRoot, "docs/public/examples");
const base = "/slux/examples/";

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    files.push(...(entry.isDirectory() ? await listFiles(path) : [path]));
  }
  return files;
}

test("示例共用相同资源且页面引用仍能解析", async () => {
  const files = await listFiles(outputRoot);
  const htmlFiles = files.filter((file) => extname(file) === ".html");
  assert.equal(htmlFiles.length, 26);
  assert.ok(htmlFiles.includes(resolve(outputRoot, "_gallery/index.html")));
  assert.ok(files.some((file) => relative(outputRoot, file).startsWith("_shared")));

  const hashes = new Map();
  for (const file of files) {
    const extension = extname(file);
    if ([".woff", ".woff2", ".css", ".png", ".svg"].includes(extension)) {
      const hash = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
      assert.ok(!hashes.has(`${extension}:${hash}`), `${file} 与 ${hashes.get(`${extension}:${hash}`)} 重复`);
      hashes.set(`${extension}:${hash}`, file);
    }

    if (extension !== ".html" && extension !== ".css") continue;
    const source = await readFile(file, "utf8");
    const references =
      extension === ".html"
        ? [...source.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1])
        : [...source.matchAll(/url\(([^)]+)\)/g)].map((match) => match[1].replace(/^['"]|['"]$/g, ""));
    for (const reference of references) {
      if (/^(?:data:|https?:|#)/.test(reference)) continue;
      const path = reference.startsWith(base) ? resolve(outputRoot, reference.slice(base.length)) : resolve(dirname(file), reference);
      assert.ok((await stat(path)).isFile(), `${file} 引用了不存在的 ${reference}`);
    }
  }

  assert.ok(
    files.some((file) => relative(outputRoot, file).startsWith(`_shared${process.platform === "win32" ? "\\" : "/"}css`)),
    "公共 CSS 未合并",
  );
});
