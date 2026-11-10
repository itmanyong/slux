/**
 * 示例总览页。
 *
 * - 只有一个浮层：收起态是右上角的下拉选择框，展开态在下方展开分组列表。
 *   两者共用同一个 <select>，展开后下拉框依旧可用，切换只改变高度，不重置位置。
 * - 浮层在收起 / 展开两种状态下都能拖拽；右侧按钮用上下箭头切换，没有「×」这类关闭语义。
 * - 选中项在主区域以 iframe 全局渲染；iframe 地址带 embed=1（隐藏示例自身顶栏）与 theme。
 * - 主题由总览顶栏统一控制，通过 ?theme= 与 postMessage 同步给不同端口的 iframe。
 * - 开发时展示端口；嵌入文档站时使用同级静态路径，并隐藏开发端口。
 *
 * manifest.json 是端口的唯一事实源，与根 scripts/run-examples.mjs 共享。
 */

export interface ManifestExample {
  dir: string;
  pkg: string;
  label: string;
  group: string;
  kind: "rsbuild" | "vite" | "rspack";
  port: number;
}

export interface Manifest {
  gallery: { port: number };
  examples: ManifestExample[];
}

export type Theme = "light" | "dark";

const THEME_KEY = "slux-gallery-theme";
/** 与 example-shell / core 的 theme.ts 约定一致，跨端口 iframe 用 postMessage 同步。 */
const SYNC_MESSAGE = "slux-example-theme";
const DEFAULT_LABEL = "core";

/** 文档站把总览与各示例放在同一 examples 目录；独立开发时仍使用各自的端口。 */
export function exampleUrl(example: ManifestExample, galleryHref = window.location.href): string {
  const gallery = new URL(galleryHref);
  const staticPath = /^(.*\/examples\/)_gallery(?:\/|$)/.exec(gallery.pathname);
  if (staticPath) {
    gallery.pathname = `${staticPath[1]}${example.dir}/`;
    gallery.search = "";
    gallery.hash = "";
    return gallery.href;
  }
  return `http://localhost:${example.port}/`;
}

/** 嵌在总览里：隐藏示例自己的顶部操作栏，并指定初始主题。 */
export function embedUrl(example: ManifestExample, theme: Theme, galleryHref = window.location.href): string {
  return `${exampleUrl(example, galleryHref)}?embed=1&theme=${theme}`;
}

/** 新窗口打开：完整示例页（含自身顶栏），仅带上主题参数。 */
export function externalUrl(example: ManifestExample, theme: Theme, galleryHref = window.location.href): string {
  return `${exampleUrl(example, galleryHref)}?theme=${theme}`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

interface DragState {
  id: number;
  dx: number;
  dy: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export function createGallery(root: HTMLElement, manifest: Manifest): { select: (dir: string) => boolean } {
  root.innerHTML = "";

  const app = el("div", "g-app collapsed");
  const showPorts = !/\/examples\/_gallery(?:\/|$)/.test(window.location.pathname);
  const groups: string[] = [];
  for (const item of manifest.examples) {
    if (!groups.includes(item.group)) groups.push(item.group);
  }

  /* ── 顶栏 ─────────────────────────────────────────── */
  const bar = el("header", "g-bar");
  const brand = el("div", "g-brand");
  brand.append(el("span", "g-brand-name", "slux examples"), el("span", "g-brand-badge", "总览"));
  const barRight = el("div", "g-bar-right");
  const currentLabel = el("span", "g-current", "未选择示例");
  const openLink = el("a", "g-open-link", "在新窗口打开 ↗");
  openLink.href = "#";
  openLink.target = "_blank";
  openLink.rel = "noreferrer";
  // openLink.setAttribute("aria-disabled", "true");
  const themeBtn = el("button", "g-bar-btn", "深色");
  themeBtn.type = "button";
  themeBtn.title = "切换明暗主题（同步到当前示例）";
  barRight.append(currentLabel, openLink, themeBtn);
  bar.append(brand, barRight);

  /* ── 主区域 ───────────────────────────────────────── */
  const main = el("main", "g-main");
  const placeholder = el("div", "g-placeholder");
  placeholder.append(
    el("h2", "g-placeholder-title", "正在载入示例"),
    el("p", "g-placeholder-hint", "使用右上角的示例下拉框切换，或展开浮层从分组列表中选择。"),
  );
  const frame = el("iframe", "g-frame");
  frame.title = "示例预览";
  frame.setAttribute("aria-label", "示例预览");
  main.append(placeholder, frame);

  /* ── 统一的示例浮层：标题栏始终存在 ───────────────── */
  const panel = el("aside", "g-panel");
  panel.setAttribute("aria-label", "示例目录");
  const panelHead = el("div", "g-panel-head");
  panelHead.title = "拖动移动浮层 · 右侧箭头展开 / 收起";
  const grip = el("span", "g-grip", "⠿");
  grip.setAttribute("aria-hidden", "true");

  /** 收起态与展开态共用同一个下拉框，展开后依旧可以直接切换示例。 */
  const dropdown = el("select", "g-select");
  dropdown.setAttribute("aria-label", "选择示例");
  dropdown.title = "选择示例（收起 / 展开均可使用）";
  for (const group of groups) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group;
    for (const item of manifest.examples) {
      if (item.group !== group) continue;
      const option = document.createElement("option");
      option.value = item.dir;
      option.textContent = showPorts ? `${item.label}  :${item.port}` : item.label;
      optgroup.append(option);
    }
    dropdown.append(optgroup);
  }

  /** 上下箭头由 CSS 绘制：收起时朝下（展开），展开时旋转 180° 朝上（收起）。 */
  const toggleBtn = el("button", "g-toggle");
  toggleBtn.type = "button";
  toggleBtn.setAttribute("aria-controls", "g-panel-body");
  panelHead.append(grip, el("span", "g-panel-label", "示例"), dropdown, toggleBtn);

  /* ── 浮层底部区域：仅展开时呈现 ───────────────────── */
  const panelBody = el("div", "g-panel-body");
  panelBody.id = "g-panel-body";
  const panelHint = el("p", "g-panel-hint", "拖动标题栏移动（收起态同样可拖动）· 右侧箭头切换展开 / 收起");

  const search = el("input", "g-search");
  search.type = "search";
  search.placeholder = "搜索示例…";
  search.setAttribute("aria-label", "搜索示例");

  const nav = el("nav", "g-nav");
  const itemsByDir = new Map<string, HTMLButtonElement>();
  for (const group of groups) {
    const groupEl = el("div", "g-group");
    groupEl.dataset.group = group;
    groupEl.append(el("div", "g-group-title", group));
    for (const item of manifest.examples) {
      if (item.group !== group) continue;
      const btn = el("button", "g-item");
      btn.type = "button";
      btn.dataset.dir = item.dir;
      btn.append(el("span", "g-item-label", item.label));
      if (showPorts) btn.append(el("span", "g-item-port", String(item.port)));
      btn.addEventListener("click", () => select(item.dir));
      groupEl.append(btn);
      itemsByDir.set(item.dir, btn);
    }
    nav.append(groupEl);
  }
  panelBody.append(panelHint, search, nav);
  panel.append(panelHead, panelBody);

  app.append(bar, main, panel);
  root.append(app);

  /* ── 行为 ─────────────────────────────────────────── */
  let dark = false;
  let current: ManifestExample | null = null;

  const themeName = (): Theme => (dark ? "dark" : "light");
  const isCollapsed = (): boolean => app.classList.contains("collapsed");

  /** 把当前主题推给 iframe（不同端口属跨域，postMessage 可跨源投递）。 */
  function broadcastTheme(): void {
    try {
      frame.contentWindow?.postMessage({ type: SYNC_MESSAGE, theme: themeName() }, "*");
    } catch {
      // iframe 尚未加载或已被卸载，忽略即可。
    }
  }
  frame.addEventListener("load", broadcastTheme);

  function applyTheme(nextDark: boolean, persist = true): void {
    dark = nextDark;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeBtn.textContent = dark ? "浅色" : "深色";
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
      } catch {
        /* 隐私模式等场景忽略 */
      }
    }
    broadcastTheme();
    if (current) openLink.href = externalUrl(current, themeName());
  }
  themeBtn.addEventListener("click", () => applyTheme(!dark));

  function select(dir: string, updateHash = true): boolean {
    const item = manifest.examples.find((x) => x.dir === dir);
    const btn = itemsByDir.get(dir);
    if (!item || !btn) return false;

    current = item;
    for (const other of itemsByDir.values()) {
      other.classList.toggle("active", other === btn);
    }
    dropdown.value = dir;
    frame.src = embedUrl(item, themeName());
    frame.title = `示例预览 · ${item.label}`;
    frame.classList.add("ready");
    placeholder.classList.add("hidden");

    currentLabel.textContent = [item.label, item.group, ...(showPorts ? [`:${item.port}`] : [])].join(" · ");
    currentLabel.title = `examples/${item.dir}`;
    openLink.href = externalUrl(item, themeName());
    openLink.title = `在新标签页打开 ${item.label} 完整页面`;
    openLink.setAttribute("aria-disabled", "false");

    if (updateHash && window.location.hash !== `#${dir}`) {
      window.location.hash = dir;
    }
    return true;
  }

  dropdown.addEventListener("change", () => select(dropdown.value));

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    for (const groupEl of Array.from(nav.children)) {
      let visible = 0;
      for (const btn of Array.from(groupEl.querySelectorAll<HTMLButtonElement>(".g-item"))) {
        const dir = btn.dataset.dir ?? "";
        const item = manifest.examples.find((x) => x.dir === dir);
        const haystack = item ? `${item.label} ${item.dir} ${item.group}`.toLowerCase() : dir.toLowerCase();
        const show = q === "" || haystack.includes(q);
        btn.classList.toggle("hidden", !show);
        if (show) visible += 1;
      }
      groupEl.classList.toggle("hidden", visible === 0);
    }
  });

  /* ── 尺寸 / 位置：只在视口边界内收敛，绝不重置坐标 ── */
  const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), Math.max(min, max));

  /** jsdom 里 offsetWidth/offsetHeight 恒为 0，给一组与 CSS 接近的兜底值。 */
  const panelSize = (): { width: number; height: number } => {
    const collapsed = isCollapsed();
    return {
      width: panel.offsetWidth || (collapsed ? 244 : 272),
      height: panel.offsetHeight || (collapsed ? 48 : 480),
    };
  };

  function clampPosition(): void {
    if (!panel.isConnected) return;
    const left = Number.parseFloat(panel.style.left);
    const top = Number.parseFloat(panel.style.top);
    // 还没有被拖动过：保持 CSS 的右上角锚定，不需要干预。
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    const { width, height } = panelSize();
    panel.style.left = `${clamp(left, 8, window.innerWidth - width - 8)}px`;
    panel.style.top = `${clamp(top, 8, window.innerHeight - height - 8)}px`;
  }
  window.addEventListener("resize", clampPosition);

  /** 收起 / 展开只切换底部区域的可见性，浮层节点、下拉框与坐标都保持不变。 */
  function setCollapsed(collapsed: boolean): void {
    app.classList.toggle("collapsed", collapsed);
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    const label = collapsed ? "展开示例目录" : "收起示例目录";
    toggleBtn.setAttribute("aria-label", label);
    toggleBtn.title = `${label}（${collapsed ? "下箭头展开" : "上箭头收起"}，浮层位置保持不变）`;
    clampPosition();
  }
  toggleBtn.addEventListener("click", () => setCollapsed(!isCollapsed()));

  /* ── 拖拽：收起态与展开态共用同一套逻辑 ───────────── */
  let drag: DragState | null = null;

  const appBarHeight = (): number => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--app-bar");
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 56;
  };

  panelHead.addEventListener("pointerdown", (event: PointerEvent) => {
    // 下拉框、箭头按钮等控件自身要能点击，不启动拖拽。
    if ((event.target as HTMLElement | null)?.closest("button, select, input, a")) {
      return;
    }
    const rect = panel.getBoundingClientRect();
    // 从 CSS 的 right/top 锚定切换为 left/top 绝对坐标；该坐标在收起/展开之间沿用。
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    drag = {
      id: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    panel.classList.add("dragging");
    try {
      panelHead.setPointerCapture(event.pointerId);
    } catch {
      // jsdom 等环境没有 pointer capture，拖拽逻辑本身不依赖它。
    }
  });

  panelHead.addEventListener("pointermove", (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8) {
      drag.moved = true;
    }
    const { width, height } = panelSize();
    const left = clamp(event.clientX - drag.dx, 8, window.innerWidth - width - 8);
    const top = clamp(event.clientY - drag.dy, 8, window.innerHeight - height - 8);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  });

  const finishDrag = (event: PointerEvent): void => {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    panel.classList.remove("dragging");
    // 收起态本身就是下拉框，拖动只改变位置，不再额外触发收起。
    if (!moved || isCollapsed()) return;
    const rect = panel.getBoundingClientRect();
    const nearTop = rect.top <= appBarHeight() + 24;
    const nearRight = window.innerWidth - rect.right <= 90;
    if (nearTop && nearRight) setCollapsed(true);
  };
  panelHead.addEventListener("pointerup", finishDrag);
  panelHead.addEventListener("pointercancel", finishDrag);

  /* ── 初始状态 ─────────────────────────────────────── */
  let initialDark = false;
  try {
    initialDark = localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    /* ignore */
  }
  applyTheme(initialDark, false);
  setCollapsed(true);

  const requested = window.location.hash.slice(1);
  const fallback = manifest.examples.find((x) => x.label === DEFAULT_LABEL) ?? manifest.examples[0];
  const initialDir = manifest.examples.some((x) => x.dir === requested) ? requested : fallback?.dir;
  // 默认选中不写入 hash：刷新始终回到 core；用户主动选择才更新地址栏。
  if (initialDir) select(initialDir, false);

  return { select };
}
