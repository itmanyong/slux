import type { LogTone } from "@slux/kit-example";

const BRAND_MARK = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5.4 3.2v7.1a4.6 4.6 0 0 0 9.2 0V3.2" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/><path d="M10 15.2v1.6" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>`;
const THEME_MOON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M13.2 9.6A5.8 5.8 0 0 1 6.4 2.8a5.8 5.8 0 1 0 6.8 6.8Z"/></svg>`;
const THEME_SUN = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.6v1.2M8 13.2v1.2M1.6 8h1.2M13.2 8h1.2M3.5 3.5l.9.9M11.6 11.6l.9.9M12.5 3.5l-.9.9M4.4 11.6l-.9.9"/></svg>`;

const TONES: { tone: LogTone; label: string }[] = [
  { tone: "write", label: "写入" },
  { tone: "notify", label: "通知" },
  { tone: "effect", label: "副作用" },
  { tone: "compute", label: "计算" },
  { tone: "scope", label: "作用域" },
  { tone: "error", label: "错误" },
];

export interface OverviewRefs {
  total: HTMLElement;
  tones: Map<LogTone, HTMLElement>;
}

export interface PageRefs {
  menuList: HTMLElement;
  stageTitle: HTMLElement;
  stageDesc: HTMLElement;
  stageCount: HTMLElement;
  resetButton: HTMLButtonElement;
  masonry: HTMLElement;
  themeButton: HTMLButtonElement;
  overview: OverviewRefs;
}

export interface PageSummary {
  demoCount: number;
  apiCount: number;
  groupCount: number;
}

export function createPage(root: HTMLElement, summary: PageSummary): PageRefs {
  root.innerHTML = `
    <header class="app-bar">
      <a class="brand" href="#top">
        <span class="brand-mark">${BRAND_MARK}</span>
        <span class="brand-name">slux</span>
        <span class="brand-pkg">/core</span>
      </a>
      <div class="app-tools">
        <button class="theme-toggle" type="button" aria-pressed="false">
          <span class="theme-icon">${THEME_MOON}</span>
          <span class="theme-text">深色</span>
        </button>
      </div>
    </header>

    <section class="masthead" id="top">
      <p class="kicker">Core layer · 与框架无关</p>
      <h1 class="page-title">把响应式原语，<em>逐个跑一遍</em></h1>
      <div class="masthead-foot">
        <p class="page-desc">
          ${summary.demoCount} 个示例覆盖 <code>@slux/core</code> 的 ${summary.apiCount} 个公开 API。
          每个卡片的「源码」是一段可直接搬进自己项目的最小复现，注释里的输出都经过真实运行验证。
        </p>
        <p class="colophon mono">@slux/core · rsbuild · typescript</p>
      </div>
    </section>

    <div class="shell">
      <aside class="index">
        <div class="index-head">
          <span>API 索引</span>
          <span class="mono">${summary.apiCount}</span>
        </div>
        <nav class="menu-list" aria-label="API 目录" data-menu></nav>
      </aside>

      <main class="stage">
        <div class="stage-head">
          <div>
            <h2 class="stage-title" data-stage-title></h2>
            <p class="stage-desc" data-stage-desc></p>
          </div>
          <div class="stage-tools">
            <span class="stage-count" data-stage-count></span>
            <button class="ghost-button" type="button" data-reset-all>重置</button>
          </div>
        </div>
        <div class="masonry" data-masonry></div>
      </main>
    </div>

    <footer class="overview">
      <div class="overview-group">
        <span class="overview-label">统计总览</span>
        <span class="overview-chip"><b>${summary.apiCount}</b> API</span>
        <span class="overview-chip"><b>${summary.demoCount}</b> 示例</span>
        <span class="overview-chip"><b>${summary.groupCount}</b> 分组</span>
      </div>
      <div class="overview-live">
        <span class="live-chip"><b data-stat="total">0</b> 条运行记录</span>
        <span class="overview-sep"></span>
        ${TONES.map(
          ({ tone, label }) =>
            `<span class="live-chip tone-${tone}" title="${label}"><i class="live-dot" aria-hidden="true"></i><b data-stat="${tone}">0</b> ${label}</span>`,
        ).join("")}
      </div>
    </footer>
  `;

  const query = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`页面缺少节点：${selector}`);
    return element;
  };

  const tones = new Map<LogTone, HTMLElement>();
  for (const { tone } of TONES) tones.set(tone, query<HTMLElement>(`[data-stat="${tone}"]`));

  return {
    menuList: query("[data-menu]"),
    stageTitle: query("[data-stage-title]"),
    stageDesc: query("[data-stage-desc]"),
    stageCount: query("[data-stage-count]"),
    resetButton: query<HTMLButtonElement>("[data-reset-all]"),
    masonry: query("[data-masonry]"),
    themeButton: query<HTMLButtonElement>(".theme-toggle"),
    overview: { total: query("[data-stat='total']"), tones },
  };
}

export const themeIcons = { sun: THEME_SUN, moon: THEME_MOON };
