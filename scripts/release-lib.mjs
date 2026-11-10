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

export function renderReleaseNotes(version, changesets) {
  const notes = changesets.map((content) => content.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, "").trim()).filter(Boolean);
  if (!notes.length) throw new Error("Changeset 缺少变更说明");
  return `# v${version}\n\n## 变更说明\n\n${notes.join("\n\n")}\n`;
}
