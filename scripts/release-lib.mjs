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

export const releaseCategories = ["New Features", "Performance", "Bug Fixes", "Refactor", "Document", "Other Changes"];
const categoryIcons = {
  "New Features": " 🎉",
  Performance: " 🚀",
  "Bug Fixes": " 🐞",
  Refactor: " 🔨",
  Document: " 📖",
  "Other Changes": " 🔧",
};
const entryPattern = /^(feat|fix|docs|perf|refactor|chore|test|ci|build|style|revert)\(([a-z][a-z0-9-]*(?:,[a-z][a-z0-9-]*)*)\)(!)?:\s+(.+)$/;
export const repositoryScopes = ["release", "website", "repo", "ci", "docs", "examples", "build", "deps", "test"];

export function parseReleaseEntries(changesets, packageNames) {
  const entries = new Map();
  const packageScopes = packageNames?.map((name) => name.replace(/^@slux\//, ""));
  for (const value of changesets) {
    const content = typeof value === "string" ? value : value.content;
    const declared = packageNames && parseChangesetPackages(content, packageNames).map((name) => name.split("/")[1]);
    const hasFrontmatter = /^---\r?\n/.test(content);
    const body = content
      .replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();
    for (const line of body.split(/\r?\n/)) {
      if (!line.trim() || /^#{1,4}\s/.test(line)) continue;
      const text = line.trim().replace(/^[-*]\s+/, "");
      const match = text.match(entryPattern);
      if (!match) throw new Error(`变更条目必须使用 type(scope): 描述：${text}`);
      const scopes = match[2].split(",");
      if (packageScopes) {
        for (const scope of scopes) {
          if (!packageScopes.includes(scope) && !repositoryScopes.includes(scope)) throw new Error(`未知变更 scope：${scope}`);
          if (packageScopes.includes(scope) && hasFrontmatter && !declared.includes(scope))
            throw new Error(`Changeset 未声明 @slux/${scope}，不能记录该包的变更`);
        }
      }
      entries.set(text, { text, type: match[1], scopes, category: classifyCommit(text) });
    }
  }
  if (!entries.size) throw new Error("Changeset 缺少变更说明");
  return [...entries.values()];
}

export function renderEntrySections(entries, level = 3) {
  return releaseCategories
    .flatMap((category) => {
      const selected = entries.filter((entry) => entry.category === category);
      return selected.length
        ? [`${"#".repeat(level)} ${category}${categoryIcons[category] || ""}\n\n${selected.map(({ text }) => `- ${text}`).join("\n")}`]
        : [];
    })
    .join("\n\n");
}

export function classifyCommit(subject) {
  const type = subject.match(/^([a-z]+)(?:\([^)]*\))?!?:/i)?.[1].toLowerCase();
  return { feat: "New Features", perf: "Performance", fix: "Bug Fixes", refactor: "Refactor", docs: "Document" }[type] || "Other Changes";
}

export function renderReleaseNotes(
  version,
  changesets,
  { commits = [], previousTag = "", tag = `release/v${version}`, repository = "https://github.com/itmanyong/slux" } = {},
) {
  const entries = parseReleaseEntries(changesets);
  const sections = new Map(
    releaseCategories.map((category) => [category, { notes: entries.filter((entry) => entry.category === category), commits: [] }]),
  );
  for (const commit of commits) {
    if (/^chore\(release\):\s*v\d/.test(commit.subject)) continue;
    const subject = commit.subject.match(entryPattern) ? commit.subject : commit.subject.replace(/^([a-z]+)(!)?:\s*/, "$1(repo)$2: ");
    const normalized = subject.match(entryPattern) ? subject : `chore(repo): ${commit.subject}`;
    if (!entries.some(({ text }) => text === normalized))
      sections.get(classifyCommit(normalized)).commits.push({ ...commit, subject: normalized });
  }
  const parts = [`# v${version}`, "## What's Changed"];
  for (const [category, { notes, commits: entries }] of sections) {
    if (!notes.length && !entries.length) continue;
    parts.push(`### ${category}${categoryIcons[category] || ""}`);
    if (notes.length) parts.push(notes.map(({ text }) => `- ${text}`).join("\n"));
    if (entries.length) {
      const links = entries.map(({ hash, subject }) => `- ${subject} ([${hash.slice(0, 7)}](${repository}/commit/${hash}))`).join("\n");
      parts.push(notes.length ? `<details>\n<summary>相关提交（${entries.length}）</summary>\n\n${links}\n\n</details>` : links);
    }
  }
  parts.push(
    previousTag
      ? `**Full Changelog**: [${previousTag}...${tag}](${repository}/compare/${previousTag}...${tag})`
      : `**Full Changelog**: [${tag}](${repository}/commits/${tag})`,
  );
  return `${parts.join("\n\n")}\n`;
}

export function renderChangelog(releases) {
  const sorted = [...releases].sort((a, b) => {
    const left = a.version.split(".").map(Number);
    const right = b.version.split(".").map(Number);
    return right[0] - left[0] || right[1] - left[1] || right[2] - left[2];
  });
  return `${sorted
    .map(({ content }) =>
      content
        .replace(/\r\n/g, "\n")
        .trim()
        .replace(/^# v/m, "## v")
        .replace(/^## What's Changed\n\n/m, ""),
    )
    .join("\n\n")}\n`;
}
