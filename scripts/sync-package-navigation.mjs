import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const startMarker = "<!-- package-navigation:start -->";
const endMarker = "<!-- package-navigation:end -->";
const rootReadme = readFileSync(resolve(root, "README.md"), "utf8").replace(/\r\n/g, "\n");
const navigation = rootReadme.match(/^## 包导航\n[\s\S]*?(?=^## 安装(?:\n|$))/m)?.[0].trimEnd();
if (!navigation) throw new Error("根 README.md 缺少「包导航」或后续的「安装」章节");

const generated = `${startMarker}\n\n${navigation}\n\n${endMarker}`;
const updates = readdirSync(resolve(root, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(root, "packages", entry.name, "package.json")))
  .map((entry) => {
    const file = resolve(root, "packages", entry.name, "README.md");
    if (!existsSync(file)) throw new Error(`缺少包 README：${file}`);
    const current = readFileSync(file, "utf8");
    let content = current.replace(/\r\n/g, "\n");
    const start = content.indexOf(startMarker);
    const end = content.indexOf(endMarker);
    if ((start === -1) !== (end === -1) || (start !== -1 && end < start)) {
      throw new Error(`${file} 的包导航同步标记不完整`);
    }
    if (start !== -1) content = content.slice(0, start) + content.slice(end + endMarker.length);
    content = `${content.trimEnd()}\n\n${generated}\n`;
    return { file, current, content };
  });

for (const { file, current, content } of updates) {
  if (current !== content) writeFileSync(file, content);
}
console.log(`已同步 ${updates.length} 个包的 README 包导航`);
