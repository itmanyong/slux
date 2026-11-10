export type Theme = "light" | "dark";

const STORAGE_KEY = "slux-example-theme";
/** 总览页跨端口 iframe 同步主题所用的 postMessage 类型。 */
const SYNC_MESSAGE = "slux-example-theme";
/** 主题被总览接管时发出的站内事件，便于刷新主题按钮文案。 */
export const THEME_CHANGE_EVENT = "slux-theme-change";
const EMBED_FLAG = "1";

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

const readStored = (): Theme | undefined => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const readUrlTheme = (): Theme | undefined => {
  try {
    const value = new URLSearchParams(window.location.search).get("theme");
    return isTheme(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

/** 是否嵌在总览的 iframe 里：?embed=1，或确实处于子框架中。 */
export const isEmbedded = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).get("embed") === EMBED_FLAG || window.parent !== window;
  } catch {
    return window.parent !== window;
  }
};

export const currentTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

const apply = (theme: Theme, persist = false): void => {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // 隐私模式下写入会失败，主题在本次会话内仍然生效。
    }
  }
};

/**
 * 首次加载：URL 参数 > 本地偏好 > 系统偏好。
 * 嵌入总览时打上 data-embed（隐藏顶部操作栏），并接收总览推送的主题。
 */
export const initTheme = (): void => {
  const embedded = isEmbedded();
  if (embedded) document.documentElement.dataset.embed = EMBED_FLAG;

  // jsdom 等测试环境可能没有实现 matchMedia。
  const prefersDark = typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  apply(readUrlTheme() ?? readStored() ?? (prefersDark ? "dark" : "light"));

  if (!embedded) return;
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    const data: unknown = event.data;
    if (typeof data !== "object" || data === null) return;
    const payload = data as { type?: unknown; theme?: unknown };
    if (payload.type !== SYNC_MESSAGE || !isTheme(payload.theme)) return;
    apply(payload.theme, true);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
  });
};

export const toggleTheme = (): Theme => {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  apply(next, true);
  return next;
};
