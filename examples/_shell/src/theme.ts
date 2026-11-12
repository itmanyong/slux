/** 所有示例共用的 iframe 主题桥。URL 仅决定首次加载的主题；后续同步走消息。 */
export type Theme = "light" | "dark";

export const THEME_PARAM = "theme";
export const EMBED_PARAM = "embed";
export const EMBED_FLAG = "1";
export const SYNC_MESSAGE = "THEME_CHANGED";
export const REQUEST_MESSAGE = "slux-example-theme-request";
export const THEME_CHANGE_EVENT = "slux-theme-change";
/** 子页面（示例）加载完成后向父页面（总览）通告；payload 携带示例包名。 */
export const CONTENT_LOADED_MESSAGE = "CONTENT_LOADED";
export interface ContentLoadedPayload {
  /** 示例包名，如 @slux/react（走 createExamplePage 时取 branding.pkg）。 */
  package: string;
}
/** 同源多标签页同步用的 BroadcastChannel 名称。 */
export const THEME_CHANNEL = "slux-theme-sync";

const STORAGE_KEY = "slux-example-theme";

/**
 * 同源多标签页广播通道。BroadcastChannel 按源隔离：画廊（:9000）与示例（:90xx）
 * 各自独立成网，互不干扰；而同一示例在多个标签页打开时，会经此通道互相同步。
 * 部分老旧环境没有 BroadcastChannel，缺失时静默退化为「仅本标签页生效」。
 */
let channel: BroadcastChannel | null = null;
try {
  channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(THEME_CHANNEL) : null;
} catch {
  channel = null;
}

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

const readUrlTheme = (): Theme | undefined => {
  const value = new URLSearchParams(window.location.search).get(THEME_PARAM);
  return isTheme(value) ? value : undefined;
};

const readStored = (): Theme | undefined => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const systemTheme = (): Theme =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const isEmbedded = (): boolean => new URLSearchParams(window.location.search).get(EMBED_PARAM) === EMBED_FLAG || window.parent !== window;

export const currentTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

const applyTheme = (theme: Theme): void => {
  if (document.documentElement.getAttribute("data-theme") === theme) return;
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }));
};

/** 非 iframe 场景下，把当前主题写回地址栏，刷新后保持。 */
const syncUrlTheme = (theme: Theme): void => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(THEME_PARAM, theme);
    window.history.replaceState(null, "", url);
  } catch {
    /* 地址不可写（如 data: 协议）时忽略。 */
  }
};

/** 向其他同源标签页广播主题变更；只比对 type，对得上就应用。 */
const broadcastTheme = (theme: Theme): void => {
  if (!channel) return;
  channel.postMessage({ type: SYNC_MESSAGE, payload: { theme } });
};

/** 应用「来自其他标签页 / 父页面」的远程主题：更新并持久化，但不再向外转发，避免回环。 */
const receiveTheme = (theme: Theme): void => {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* 隐私模式下写入可能失败，本次会话内的主题仍然生效。 */
  }
  // 独立运行时也把地址栏对齐，否则刷新会回退到旧的 ?theme=。
  if (!isEmbedded()) syncUrlTheme(theme);
};

export function setTheme(theme: Theme, notifyParent = true): void {
  if (document.documentElement.getAttribute("data-theme") === theme) return;
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 隐私模式下写入可能失败，本次会话内的主题仍然生效。
  }
  if (isEmbedded()) {
    // 嵌入态：地址栏由父页面（总览）掌管，只把主题回传给父页面。
    if (notifyParent) {
      window.parent.postMessage({ type: SYNC_MESSAGE, payload: { theme } }, "*");
    }
  } else {
    // 独立运行：主题写回 URL，并广播给同来源的其他标签页。
    syncUrlTheme(theme);
  }
  broadcastTheme(theme);
}

export function createThemeBridge(packageName?: string): () => void {
  const embedded = isEmbedded();
  if (embedded) document.documentElement.dataset.embed = EMBED_FLAG;
  applyTheme(readUrlTheme() ?? readStored() ?? systemTheme());

  // 注册监听即代表页面加载完成：延迟 1024*0.5ms 后向父页面通告 CONTENT_LOADED，
  // 让总览（嵌入方）确认示例内容已就绪。仅嵌入态有意义，独立运行不发送。
  // embedded 同时覆盖「真实处于 iframe 内」与「显式 ?embed=1」两种情形。
  let loadedTimer: ReturnType<typeof setTimeout> | null = null;
  if (embedded) {
    loadedTimer = setTimeout(() => {
      loadedTimer = null;
      window.parent.postMessage(
        {
          type: CONTENT_LOADED_MESSAGE,
          payload: { package: packageName ?? "" },
        } satisfies { type: string; payload: ContentLoadedPayload },
        "*",
      );
    }, 1024 * 0.5);
  }

  const onMessage = (event: MessageEvent): void => {
    if (event.source !== window.parent) return;
    const data: unknown = event.data;
    if (typeof data !== "object" || data === null) return;
    const message = data as { type?: unknown; payload?: { theme?: unknown } };
    if (message.type !== SYNC_MESSAGE || !isTheme(message.payload?.theme)) return;
    setTheme(message.payload.theme, false);
  };

  const onChannel = (event: MessageEvent): void => {
    const data: unknown = event.data;
    if (typeof data !== "object" || data === null) return;
    const message = data as { type?: unknown; payload?: { theme?: unknown } };
    // 只比对 type 对得上就应用，不在乎来源是哪个标签页。
    if (message.type !== SYNC_MESSAGE || !isTheme(message.payload?.theme)) return;
    receiveTheme(message.payload.theme);
  };

  if (embedded) {
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: REQUEST_MESSAGE }, "*");
  }
  if (channel) channel.addEventListener("message", onChannel);

  return () => {
    if (loadedTimer !== null) {
      clearTimeout(loadedTimer);
      loadedTimer = null;
    }
    window.removeEventListener("message", onMessage);
    if (channel) channel.removeEventListener("message", onChannel);
  };
}

let disposeBridge: (() => void) | null = null;
export const initTheme = (packageName?: string): void => {
  if (disposeBridge) return;
  disposeBridge = createThemeBridge(packageName);
};

export const toggleTheme = (): Theme => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
};
