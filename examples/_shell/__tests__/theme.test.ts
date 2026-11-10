import { describe, expect, it } from "rstack/test";
import {
  CONTENT_LOADED_MESSAGE,
  REQUEST_MESSAGE,
  SYNC_MESSAGE,
  THEME_CHANGE_EVENT,
  THEME_PARAM,
  createThemeBridge,
  currentTheme,
  setTheme,
  toggleTheme,
} from "../src/theme";

const STORAGE_KEY = "slux-example-theme";

let dispose: (() => void) | null = null;

function setup(search = "", stored?: "light" | "dark"): void {
  dispose?.();
  const query = search.replace(/^\?/, "");
  window.history.replaceState(null, "", query ? `/?${query}` : "/");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-embed");
  try {
    localStorage.clear();
    if (stored) localStorage.setItem(STORAGE_KEY, stored);
  } catch {
    /* ignore */
  }
  dispose = createThemeBridge();
}

function teardown(): void {
  dispose?.();
  dispose = null;
}

const urlTheme = (): string | null => new URLSearchParams(window.location.search).get(THEME_PARAM);

/** 模拟来自父页面的 postMessage（jsdom 下 parent === window）。 */
function parentMessage(data: unknown): void {
  const event = new MessageEvent("message", { data });
  Object.defineProperty(event, "source", {
    configurable: true,
    value: window.parent,
  });
  window.dispatchEvent(event);
}

describe("iframe 主题桥 · URL 参数", () => {
  it("?theme= 决定根节点 data-theme", () => {
    setup("?theme=dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(currentTheme()).toBe("dark");
    teardown();

    setup("?theme=light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    teardown();

    // 非法值回落到系统/本地偏好；jsdom 没有 matchMedia，即 light。
    setup("?theme=nope");
    expect(currentTheme()).toBe("light");
    teardown();
  });

  it("无参数时使用本地偏好", () => {
    setup("", "dark");
    expect(currentTheme()).toBe("dark");
    teardown();
  });

  it("?embed=1 打上 data-embed，非嵌入时不打", () => {
    setup("?embed=1&theme=light");
    expect(document.documentElement.dataset.embed).toBe("1");
    teardown();

    setup("?theme=light");
    expect(document.documentElement.dataset.embed).toBeUndefined();
    teardown();
  });

  it("setTheme 只更新主题，不改 URL", () => {
    setup("?embed=1&theme=light");
    const changes: { theme?: unknown }[] = [];
    const onChange = (event: Event): void => {
      changes.push((event as CustomEvent<{ theme?: unknown }>).detail);
    };
    window.addEventListener(THEME_CHANGE_EVENT, onChange);

    setTheme("dark");
    expect(urlTheme()).toBe("light");
    expect(new URLSearchParams(window.location.search).get("embed")).toBe("1");
    expect(currentTheme()).toBe("dark");
    expect(changes.some((detail) => detail?.theme === "dark")).toBe(true);

    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    teardown();
  });
});

describe("iframe 主题桥 · 上下层消息", () => {
  it("父页面 postMessage 只更新不同的主题，不改 URL", () => {
    setup("?embed=1&theme=light");
    parentMessage({ type: SYNC_MESSAGE, payload: { theme: "dark" } });
    expect(urlTheme()).toBe("light");
    expect(currentTheme()).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    const changes: unknown[] = [];
    window.addEventListener(THEME_CHANGE_EVENT, (event) => changes.push(event));
    parentMessage({ type: SYNC_MESSAGE, payload: { theme: "dark" } });
    expect(changes).toHaveLength(0);
    teardown();
  });

  it("忽略非法消息与非父页面来源", () => {
    setup("?embed=1&theme=light");
    parentMessage({ type: SYNC_MESSAGE, payload: { theme: "blue" } });
    parentMessage({ type: "other-message", theme: "dark" });
    parentMessage(null);
    const stranger = new MessageEvent("message", {
      data: { type: SYNC_MESSAGE, payload: { theme: "dark" } },
    });
    Object.defineProperty(stranger, "source", {
      configurable: true,
      value: null,
    });
    window.dispatchEvent(stranger);
    expect(currentTheme()).toBe("light");
    expect(urlTheme()).toBe("light");
    teardown();
  });

  it("嵌入时主动向父页索取当前主题", () => {
    // jsdom 的 postMessage 是异步投递，会跨用例积压；这里同步替换以精确断言本次调用。
    const parent = window.parent;
    const original = parent.postMessage;
    const sent: unknown[] = [];
    Object.defineProperty(parent, "postMessage", {
      configurable: true,
      value: (data: unknown) => sent.push(data),
    });
    setup("?embed=1&theme=light");
    Object.defineProperty(parent, "postMessage", {
      configurable: true,
      value: original,
    });
    expect(sent.some((data) => typeof data === "object" && data !== null && (data as { type?: unknown }).type === REQUEST_MESSAGE)).toBe(true);
    teardown();
  });

  it("注册监听（页面加载完成）后延迟约 512ms 向父页通告 CONTENT_LOADED 与包名", async () => {
    dispose?.();
    window.history.replaceState(null, "", "/?embed=1");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-embed");
    const parent = window.parent;
    const original = parent.postMessage;
    const sent: unknown[] = [];
    Object.defineProperty(parent, "postMessage", {
      configurable: true,
      value: (data: unknown) => sent.push(data),
    });
    dispose = createThemeBridge("test-pkg");
    // 注册即返回，此时不应立即发送 CONTENT_LOADED。
    expect(sent.some((data) => typeof data === "object" && data !== null && (data as { type?: unknown }).type === CONTENT_LOADED_MESSAGE)).toBe(
      false,
    );
    await new Promise((resolve) => setTimeout(resolve, 1024 * 0.5 + 80));
    const loaded = sent.find(
      (data) => typeof data === "object" && data !== null && (data as { type?: unknown }).type === CONTENT_LOADED_MESSAGE,
    );
    expect(loaded).toEqual({ type: CONTENT_LOADED_MESSAGE, payload: { package: "test-pkg" } });
    Object.defineProperty(parent, "postMessage", { configurable: true, value: original });
    teardown();
  });
});

describe("iframe 主题桥 · 站内切换", () => {
  it("toggleTheme 更新 data-theme、本地偏好，并写回地址栏（独立运行）", () => {
    setup("?theme=light");
    expect(toggleTheme()).toBe("dark");
    expect(urlTheme()).toBe("dark");
    expect(currentTheme()).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    teardown();
  });

  it("嵌入示例自己切换主题时通知父页面，且不写回地址栏", () => {
    setup("?embed=1&theme=light");
    const original = window.parent.postMessage;
    const sent: unknown[] = [];
    Object.defineProperty(window.parent, "postMessage", {
      configurable: true,
      value: (data: unknown) => sent.push(data),
    });
    toggleTheme();
    Object.defineProperty(window.parent, "postMessage", {
      configurable: true,
      value: original,
    });
    expect(sent).toContainEqual({
      type: "THEME_CHANGED",
      payload: { theme: "dark" },
    });
    // 嵌入态地址栏由父页面掌管，自身不写 ?theme=。
    expect(urlTheme()).toBe("light");
    teardown();
  });
});

describe("iframe 主题桥 · 同源多标签页同步", () => {
  it("收到 type 对得上的广播即应用，不依赖来源", async () => {
    setup("?theme=light");
    const peer = new BroadcastChannel("slux-theme-sync");
    // 模拟「另一个标签页」发出主题变更；BroadcastChannel 不会回传给发送者自身。
    peer.postMessage({ type: SYNC_MESSAGE, payload: { theme: "dark" } });
    await new Promise((resolve) => setTimeout(resolve, 30));
    peer.close();
    expect(currentTheme()).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    teardown();
  });

  it("忽略 type 不符的广播", async () => {
    setup("?theme=light");
    const peer = new BroadcastChannel("slux-theme-sync");
    peer.postMessage({ type: "something-else", payload: { theme: "dark" } });
    await new Promise((resolve) => setTimeout(resolve, 30));
    peer.close();
    expect(currentTheme()).toBe("light");
    teardown();
  });
});
