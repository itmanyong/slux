import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const startMarker = "<!-- package-navigation:start -->";
const endMarker = "<!-- package-navigation:end -->";
const versionToken = /(`)\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(`)/g;

// 只改含「版本」的行，且只替换反引号包裹的纯 semver，避免误伤依赖版本、示例代码等。
function syncVersion(readme, version) {
  return readme
    .split("\n")
    .map((line) => (line.includes("版本") ? line.replace(versionToken, `$1${version}$2`) : line))
    .join("\n");
}

const rootReadme = readFileSync(resolve(root, "README.md"), "utf8").replace(/\r\n/g, "\n");
const navigation = rootReadme.match(/^## 包导航\n[\s\S]*?(?=^## 安装(?:\n|$))/m)?.[0].trimEnd();
if (!navigation) throw new Error("根 README.md 缺少「包导航」或后续的「安装」章节");

const generated = `${startMarker}\n\n${navigation}\n\n${endMarker}`;
const updates = readdirSync(resolve(root, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(root, "packages", entry.name, "package.json")))
  .map((entry) => {
    const packageDir = resolve(root, "packages", entry.name);
    const { version } = JSON.parse(readFileSync(resolve(packageDir, "package.json"), "utf8"));
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? "")) {
      throw new Error(`${entry.name} 的 package.json 缺少合法 version`);
    }
    const file = resolve(packageDir, "README.md");
    if (!existsSync(file)) throw new Error(`缺少包 README：${file}`);
    const current = readFileSync(file, "utf8");
    let content = current.replace(/\r\n/g, "\n");
    const start = content.indexOf(startMarker);
    const end = content.indexOf(endMarker);
    if ((start === -1) !== (end === -1) || (start !== -1 && end < start)) {
      throw new Error(`${file} 的包导航同步标记不完整`);
    }
    if (start !== -1) content = content.slice(0, start) + content.slice(end + endMarker.length);
    content = syncVersion(content, version);
    content = `${content.trimEnd()}\n\n${generated}\n`;
    return { file, current, content };
  });

for (const { file, current, content } of updates) {
  if (current !== content) writeFileSync(file, content);
}
console.log(`已同步 ${updates.length} 个包的 README 包导航与版本号`);
