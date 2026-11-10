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
const categoryIcons = { "New Features": " 🎉", Performance: " 🚀", "Bug Fixes": " 🐞", Refactor: " 🔨", Document: " 📖" };

export function classifyCommit(subject) {
  const type = subject.match(/^([a-z]+)(?:\([^)]*\))?!?:/i)?.[1].toLowerCase();
  return { feat: "New Features", perf: "Performance", fix: "Bug Fixes", refactor: "Refactor", docs: "Document" }[type] || "Other Changes";
}

export function renderReleaseNotes(
  version,
  changesets,
  { commits = [], previousTag = "", tag = `release/v${version}`, repository = "https://github.com/itmanyong/slux" } = {},
) {
  const sections = new Map(releaseCategories.map((category) => [category, { notes: [], commits: [] }]));
  const seen = new Set();
  for (const value of changesets) {
    const content = typeof value === "string" ? value : value.content;
    const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, "").trim();
    if (!body || seen.has(body)) continue;
    seen.add(body);
    let category = "Other Changes";
    let lines = [];
    const flush = () => {
      const text = lines.join("\n").trim();
      if (text) sections.get(category).notes.push(text);
      lines = [];
    };
    for (const line of body.split(/\r?\n/)) {
      const heading = line.match(/^#{1,4}\s+(.+?)\s*$/)?.[1];
      const matchedCategory = releaseCategories.find((name) => heading === name || heading?.startsWith(`${name} `));
      if (matchedCategory) {
        flush();
        category = matchedCategory;
      } else {
        lines.push(line);
      }
    }
    flush();
  }
  if (!seen.size) throw new Error("Changeset 缺少变更说明");
  for (const commit of commits) {
    if (/^chore\(release\):\s*v\d/.test(commit.subject)) continue;
    sections.get(classifyCommit(commit.subject)).commits.push(commit);
  }
  const parts = [`# v${version}`, "## What's Changed"];
  for (const [category, { notes, commits: entries }] of sections) {
    if (!notes.length && !entries.length) continue;
    parts.push(`### ${category}${categoryIcons[category] || ""}`);
    if (notes.length) parts.push(notes.join("\n\n"));
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
  return `# Changelog\n\n此文件由发布脚本从 releases/v*.md 自动汇总，请修改 Changeset 后重新生成。\n\n${sorted.map(({ content }) => content.trim().replace(/^(#{1,5}) /gm, "$1# ")).join("\n\n---\n\n")}\n`;
}
