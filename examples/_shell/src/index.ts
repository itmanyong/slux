import { DemoCard } from "./card.js";
import { Masonry } from "./masonry.js";
import { createPage, themeIcons } from "./page.js";
import { SessionStats } from "./stats.js";
import { THEME_CHANGE_EVENT, currentTheme, initTheme, toggleTheme } from "./theme.js";
import type { ExampleGroup, ExamplePageOptions } from "./types.js";

export type { ExampleDemo, ExampleGroup, LogTone } from "./types.js";
export { DemoCard } from "./card.js";
/** 上下层 iframe 主题桥：所有示例共用，也可单独从 @slux/shell-example/theme 引入。 */
export {
  CONTENT_LOADED_MESSAGE,
  EMBED_FLAG,
  EMBED_PARAM,
  REQUEST_MESSAGE,
  SYNC_MESSAGE,
  THEME_CHANGE_EVENT,
  THEME_PARAM,
  createThemeBridge,
  currentTheme,
  initTheme,
  isEmbedded,
  setTheme,
  toggleTheme,
} from "./theme.js";
export type { ContentLoadedPayload, Theme } from "./theme.js";

type Filter = "all" | string;

/**
 * 一页示例的全部编排：报头、左侧分组索引、瀑布流卡片、
 * 分组筛选、主题切换、重置与统计总览。
 */
export function createExamplePage(root: HTMLElement, options: ExamplePageOptions): void {
  const { branding, groups, demos } = options;

  // 把示例包名（branding.pkg）交给主题桥，加载完成后随 CONTENT_LOADED 通告给父页面。
  initTheme(branding.pkg);

  const page = createPage(root, branding, {
    demoCount: demos.length,
    groupCount: groups.length,
  });

  const stats = new SessionStats();
  const masonry = new Masonry(page.masonry);

  const entries = demos.map((demo, index) => ({
    demo,
    card: new DemoCard(demo, {
      index,
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
    const items: { id: Filter; group?: ExampleGroup }[] = [{ id: "all" }, ...groups.map((group) => ({ id: group.id, group }))];

    for (const item of items) {
      const count = item.id === "all" ? demos.length : demos.filter((demo) => demo.group === item.id).length;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "menu-item";
      button.dataset["filter"] = item.id;
      button.innerHTML = `
        <span class="menu-name mono"></span>
        <span class="menu-count mono">${count}</span>
      `;
      button.querySelector<HTMLElement>(".menu-name")!.textContent = item.group?.name ?? "all";
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

    const visible = entries.filter((entry) => filter === "all" || entry.demo.group === filter);
    for (const entry of entries) {
      entry.card.setVisible(visible.includes(entry));
    }
    masonry.render(visible.map((entry) => entry.card.element));

    const group = groups.find((item) => item.id === filter);
    page.stageTitle.innerHTML =
      filter === "all" || !group
        ? `<code class="mono">all</code><span class="stage-sep">·</span>全部示例`
        : `<code class="mono">${group.name}</code><span class="stage-sep">·</span>${group.title}`;
    page.stageDesc.textContent = filter === "all" || !group ? "每张卡片独立运行、独立重置，源码面板展示的就是它的最小复现。" : group.summary;
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
}
