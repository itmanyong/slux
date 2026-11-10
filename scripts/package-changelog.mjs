import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseReleaseEntries, renderEntrySections } from "./release-lib.mjs";

export function readPackageManifests(cwd, ref) {
  const paths = ref
    ? execFileSync("git", ["ls-tree", "-r", "--name-only", ref, "--", "packages"], { cwd, encoding: "utf8" })
        .trim()
        .split("\n")
        .filter((path) => /^packages\/[^/]+\/package\.json$/.test(path))
    : readdirSync(resolve(cwd, "packages"))
        .map((name) => `packages/${name}/package.json`)
        .filter((path) => existsSync(resolve(cwd, path)));
  return paths
    .map((path) =>
      JSON.parse(ref ? execFileSync("git", ["show", `${ref}:${path}`], { cwd, encoding: "utf8" }) : readFileSync(resolve(cwd, path), "utf8")),
    )
    .filter((manifest) => !manifest.private)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function dependencyRanges(manifest, manifests) {
  return Object.fromEntries(
    Object.entries({ ...manifest?.dependencies, ...manifest?.optionalDependencies, ...manifest?.peerDependencies })
      .filter(([name]) => name.startsWith("@slux/"))
      .map(([name, range]) => {
        const version = manifests.find((value) => value.name === name)?.version;
        const resolved =
          range === "workspace:*"
            ? version
            : range === "workspace:^"
              ? `^${version}`
              : range === "workspace:~"
                ? `~${version}`
                : range.replace(/^workspace:/, "");
        return [name, resolved];
      }),
  );
}

export function renderPackageVersion(manifest, before, after, entries) {
  const scope = manifest.name.split("/")[1];
  const selected = entries
    .filter(({ scopes }) => scopes.includes(scope))
    .map((entry) => ({ ...entry, scopes: [scope], text: entry.text.replace(/\([^)]*\)/, `(${scope})`) }));
  const previous = before.find(({ name }) => name === manifest.name);
  const oldDependencies = dependencyRanges(previous, before);
  const dependencies = dependencyRanges(manifest, after);
  const changed = previous ? Object.entries(dependencies).filter(([name, range]) => oldDependencies[name] !== range) : [];
  const removed = Object.keys(oldDependencies).filter((name) => !(name in dependencies));
  const detail = [
    ...changed.map(([name, range]) => `${name}（${oldDependencies[name] || "新增"} → ${range}）`),
    ...removed.map((name) => `${name}（移除）`),
  ];
  if (!selected.length || detail.length) {
    const summary = [
      !selected.length && `跟随统一版本升级至 ${manifest.version}`,
      detail.length && (detail.length > 3 ? `同步 ${detail.length} 项本包内部依赖范围` : `更新本包内部依赖：${detail.join("、")}`),
    ]
      .filter(Boolean)
      .join("；");
    selected.push(...parseReleaseEntries([`- chore(${scope}): ${summary}。`]));
  }
  return `## ${manifest.version}\n\n${renderEntrySections(selected)}\n`;
}

export function writePackageChangelogs(cwd, before, after, entries) {
  for (const manifest of after) {
    if (before.find(({ name }) => name === manifest.name)?.version === manifest.version) continue;
    const path = resolve(cwd, "packages", manifest.name.split("/")[1], "CHANGELOG.md");
    const existing = existsSync(path) ? readFileSync(path, "utf8").replace(/\r/g, "") : "";
    const sections = existing
      .split(/(?=^## \d+\.\d+\.\d+\s*$)/m)
      .filter((section) => /^## \d/.test(section) && !section.startsWith(`## ${manifest.version}\n`));
    sections.push(renderPackageVersion(manifest, before, after, entries));
    sections.sort((a, b) => {
      const av = a
        .match(/^## (\d+)\.(\d+)\.(\d+)/)
        .slice(1)
        .map(Number);
      const bv = b
        .match(/^## (\d+)\.(\d+)\.(\d+)/)
        .slice(1)
        .map(Number);
      return bv[0] - av[0] || bv[1] - av[1] || bv[2] - av[2];
    });
    writeFileSync(path, `${sections.map((section) => section.trim()).join("\n\n")}\n`);
  }
}
