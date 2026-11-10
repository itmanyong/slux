import "./index.css";
import { apiGroups, demos, publicApis } from "@slux/kit-example";
import type { DemoApiId } from "@slux/kit-example";
import { DemoCard } from "./ui/card.js";
import { Masonry } from "./ui/masonry.js";
import { createPage, themeIcons } from "./ui/page.js";
import { demoSources } from "./ui/sources.js";
import { SessionStats } from "./ui/stats.js";
import { THEME_CHANGE_EVENT, currentTheme, initTheme, toggleTheme } from "@slux/shell-example/theme";

type Filter = "all" | DemoApiId;

initTheme("@slux/core");

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

const page = createPage(root, {
  demoCount: demos.length,
  apiCount: publicApis.length,
  groupCount: apiGroups.length,
});

const stats = new SessionStats();
const masonry = new Masonry(page.masonry);

const entries = demos.map((demo, index) => ({
  demo,
  card: new DemoCard(demo, {
    index,
    source: demoSources[demo.id],
    onLog: (tone) => {
      stats.record(tone);
      reflectStats();
    },
  }),
}));

const menuItems = new Map<Filter, HTMLButtonElement>();
let filter: Filter = "all";

function reflectStats(): void {
  page.overview.total.textContent = String(stats.total);
  for (const [tone, element] of page.overview.tones) {
    element.textContent = String(stats.count(tone));
  }
}

function buildMenu(): void {
  const items: { id: Filter; name: string }[] = [{ id: "all", name: "all" }, ...apiGroups.map((group) => ({ id: group.id, name: group.name }))];

  for (const item of items) {
    const count = item.id === "all" ? demos.length : demos.filter((demo) => demo.api === item.id).length;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-item";
    button.dataset["filter"] = item.id;
    button.innerHTML = `
      <span class="menu-name mono"></span>
      <span class="menu-count mono">${count}</span>
    `;
    button.querySelector<HTMLElement>(".menu-name")!.textContent = item.name;
    button.addEventListener("click", () => select(item.id));

    page.menuList.append(button);
    menuItems.set(item.id, button);
  }
}

function select(next: Filter): void {
  filter = next;

  for (const [id, button] of menuItems) {
    if (id === filter) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }

  const visible = entries.filter((entry) => filter === "all" || entry.demo.api === filter);
  for (const entry of entries) {
    entry.card.setVisible(visible.includes(entry));
  }
  masonry.render(visible.map((entry) => entry.card.element));

  const group = apiGroups.find((item) => item.id === filter);
  page.stageTitle.innerHTML =
    filter === "all" || !group
      ? `<code class="mono">all</code><span class="stage-sep">·</span>全部示例`
      : `<code class="mono">${group.name}</code><span class="stage-sep">·</span>${group.title}`;
  page.stageDesc.textContent = filter === "all" || !group ? "每张卡片独立运行、独立重置，源码面板展示的就是它的实现。" : group.summary;
  page.stageCount.textContent = `${visible.length} 个示例`;
}

function syncThemeButton(): void {
  const dark = currentTheme() === "dark";
  page.themeButton.setAttribute("aria-pressed", String(dark));
  page.themeButton.querySelector<HTMLElement>(".theme-icon")!.innerHTML = dark ? themeIcons.sun : themeIcons.moon;
  page.themeButton.querySelector<HTMLElement>(".theme-text")!.textContent = dark ? "浅色" : "深色";
}

page.themeButton.addEventListener("click", () => {
  toggleTheme();
  syncThemeButton();
});

page.resetButton.addEventListener("click", () => {
  for (const entry of entries) {
    if (!entry.card.element.hidden) entry.card.reset();
  }
});

window.addEventListener(THEME_CHANGE_EVENT, syncThemeButton);

buildMenu();
syncThemeButton();
reflectStats();
select("all");
