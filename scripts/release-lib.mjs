export function selectChangedPackages(paths, packageNames, firstRelease, pendingPackages = []) {
  if (firstRelease) return packageNames;
  const names = new Set(packageNames);
  return [
    ...new Set([
      ...paths
        .map((path) => path.match(/^packages\/([^/]+)\//)?.[1])
        .filter(Boolean)
        .map((name) => `@slux/${name}`),
      ...pendingPackages,
    ]),
  ]
    .filter((name) => names.has(name))
    .sort();
}

export function selectLatestReleaseTag(tags) {
  return (
    tags
      .map((tag) => ({ tag, version: tag.match(/^(?:release\/)?v(\d+)\.(\d+)\.(\d+)$/) }))
      .filter(({ version }) => version)
      .sort((a, b) => {
        for (let i = 1; i <= 3; i++) {
          const difference = Number(b.version[i]) - Number(a.version[i]);
          if (difference) return difference;
        }
        return 0;
      })[0]?.tag || ""
  );
}

export function parseChangesetPackages(content, packageNames) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return [];
  const names = new Set(packageNames);
  return [...frontmatter[1].matchAll(/["']?(@slux\/[^"':\s]+)["']?\s*:\s*(?:patch|minor|major)\b/g)]
    .map((match) => match[1])
    .filter((name) => names.has(name));
}

export function parseAiDraft(content) {
  const json = content
    .trim()
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```$/, "");
  const draft = JSON.parse(json);
  if (typeof draft.summary !== "string" || !draft.summary.trim()) throw new Error("AI 没有生成可用的摘要");
  if (
    !Array.isArray(draft.highlights) ||
    !draft.highlights.length ||
    draft.highlights.some((item) => typeof item !== "string" || !item.trim())
  ) {
    throw new Error("AI 没有生成可用的变更亮点");
  }
  if (!Array.isArray(draft.migration) || draft.migration.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error("AI 返回的升级提示格式不正确");
  }
  return {
    summary: draft.summary.trim(),
    highlights: draft.highlights.map((item) => item.trim()),
    migration: draft.migration.map((item) => item.trim()),
  };
}

export function renderChangeset(packages, bump, summary) {
  if (!packages.length) throw new Error("没有需要发布的包");
  if (!["patch", "minor", "major"].includes(bump)) throw new Error("版本级别无效");
  return `---\n${packages.map((name) => `"${name}": ${bump}`).join("\n")}\n---\n\n${summary.trim()}\n`;
}

export function renderReleaseNotes(version, draft) {
  const highlights = draft.highlights.map((item) => `- ${item}`).join("\n");
  const migration = draft.migration.length ? `\n## 升级提示\n${draft.migration.map((item) => `- ${item}`).join("\n")}\n` : "";
  return `# v${version}\n\n${draft.summary}\n\n## 主要变更\n${highlights}\n${migration}`;
}
