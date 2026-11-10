import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";

const websiteRoot = resolve(import.meta.dirname, "..");
const repoRoot = resolve(websiteRoot, "../..");
const docsRoot = resolve(websiteRoot, "docs");
const examplesRoot = resolve(repoRoot, "examples");
const outputRoot = resolve(docsRoot, "public/examples");
const base = "/slux/examples/";

if (relative(docsRoot, outputRoot).replaceAll("\\", "/") !== "public/examples") {
  throw new Error("示例输出目录不在文档站 public 目录内");
}

const packageNames = (await readdir(resolve(docsRoot, "packages"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const exampleNames = (await readdir(examplesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name);

const mappings = packageNames.map((name) => {
  const example = exampleNames.find((candidate) => candidate.startsWith(`${name}-`));
  if (!example) throw new Error(`@slux/${name} 缺少对应的 examples 项目`);
  return example;
});
mappings.push("_gallery");

const sources = await Promise.all(
  mappings.map(async (example) => {
    const dist = resolve(examplesRoot, example, "dist");
    const files = await readdir(dist);
    const source = files.includes("index.html") ? dist : resolve(dist, "browser");
    if (!(await readdir(source)).includes("index.html")) throw new Error(`${example} 缺少构建后的 index.html，请先构建示例`);
    return source;
  }),
);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const [index, example] of mappings.entries()) {
  const target = resolve(outputRoot, example);
  await cp(sources[index], target, { recursive: true });

  async function rewriteAssets(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await rewriteAssets(path);
      } else if (entry.name.endsWith(".html") || entry.name.endsWith(".css")) {
        const source = await readFile(path, "utf8");
        const prefix = `${base}${example}/`;
        const rewritten = source
          .replaceAll(/\/(static|assets)\//g, `${prefix}$1/`)
          .replaceAll(/(["'(])\/(favicon\.(?:svg|png))/g, `$1${prefix}$2`);
        if (rewritten !== source) await writeFile(path, rewritten);
      }
    }
  }

  await rewriteAssets(target);
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    files.push(...(entry.isDirectory() ? await listFiles(path) : [path]));
  }
  return files;
}

function assetUrl(path) {
  return `${base}${relative(outputRoot, path).split(sep).join("/")}`;
}

async function rewriteReferences(replacements) {
  for (const file of await listFiles(outputRoot)) {
    const extension = extname(file);
    if (![".html", ".css", ".js"].includes(extension)) continue;
    const source = await readFile(file, "utf8");
    const replaceReference = (reference) => {
      const pathname = reference.split(/[?#]/, 1)[0];
      const filePath = pathname.startsWith(base)
        ? resolve(outputRoot, pathname.slice(base.length))
        : pathname.startsWith("/") || /^(?:data:|https?:|#)/.test(pathname)
          ? null
          : resolve(dirname(file), pathname);
      const shared = filePath && replacements.get(filePath);
      return shared ? `${shared}${reference.slice(pathname.length)}` : reference;
    };
    let rewritten = source;
    if (extension === ".css") {
      rewritten = rewritten.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (match, quote, reference) => {
        const next = replaceReference(reference);
        return next === reference ? match : `url(${quote}${next}${quote})`;
      });
    } else if (extension === ".html") {
      rewritten = rewritten.replace(/\b(src|href)=(['"])([^'"]+)\2/g, (match, attribute, quote, reference) => {
        const next = replaceReference(reference);
        return next === reference ? match : `${attribute}=${quote}${next}${quote}`;
      });
    } else {
      for (const [original, shared] of replacements) {
        rewritten = rewritten.replaceAll(assetUrl(original), shared);
      }
    }
    if (rewritten !== source) await writeFile(file, rewritten);
  }
}

async function shareDuplicates(extensions) {
  const groups = new Map();
  for (const file of await listFiles(outputRoot)) {
    const extension = extname(file);
    if (!extensions.includes(extension)) continue;
    const content = await readFile(file);
    const hash = createHash("sha256").update(content).digest("hex");
    const key = `${extension}:${hash}`;
    const group = groups.get(key) ?? [];
    group.push({ file, content, hash });
    groups.set(key, group);
  }

  const replacements = new Map();
  let savedBytes = 0;
  let removedFiles = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const { content, hash } = group[0];
    if (!group.every((entry) => content.equals(entry.content))) continue;
    const extension = extname(group[0].file);
    if (extension === ".css") {
      const css = content.toString("utf8");
      const references = [...css.matchAll(/url\(([^)]+)\)/g)].map((match) => match[1].trim().replace(/^['"]|['"]$/g, ""));
      if (/@import\b/i.test(css) || references.some((reference) => !/^(?:\/|data:|https?:|#)/.test(reference))) continue;
    }
    const shared = resolve(outputRoot, "_shared", extension.slice(1), `${hash}${extension}`);
    await mkdir(dirname(shared), { recursive: true });
    await writeFile(shared, content);
    for (const { file } of group) replacements.set(file, assetUrl(shared));
    removedFiles += group.length - 1;
    savedBytes += (group.length - 1) * content.length;
  }

  await rewriteReferences(replacements);
  for (const file of replacements.keys()) await rm(file);
  return { removedFiles, savedBytes };
}

const binary = await shareDuplicates([".woff", ".woff2", ".png", ".svg"]);
const styles = await shareDuplicates([".css"]);
console.log(
  `已嵌入 ${mappings.length} 个示例项目，移除 ${binary.removedFiles + styles.removedFiles} 份重复文件，节省 ${((binary.savedBytes + styles.savedBytes) / 1024 / 1024).toFixed(2)} MiB。`,
);
