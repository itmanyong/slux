import { describe, expect, it } from "rstack/test";
import manifest from "../src/manifest.json";
import { createGallery, embedUrl, exampleUrl, externalUrl } from "../src/gallery";
import type { Manifest } from "../src/gallery";

const data = manifest as unknown as Manifest;
const CORE = "core-rsbuild-ts";
const THEME_KEY = "slux-gallery-theme";

function setup(hash = "") {
  // 只清掉 ?theme= 与 hash，保留调用方设置的 pathname（文档站静态路径测试依赖它）。
  const clean = hash.replace(/^#/, "");
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = clean;
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  try {
    localStorage.removeItem(THEME_KEY);
  } catch {
    /* ignore */
  }
  const root = document.createElement("div");
  document.body.append(root);
  const api = createGallery(root, data);
  return { root, api };
}

const one = <T extends HTMLElement>(root: HTMLElement, selector: string): T => {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`缺少节点：${selector}`);
  return node;
};

type Rect = ReturnType<HTMLElement["getBoundingClientRect"]>;

function rectBox(values: { left: number; top: number; width: number; height: number }): Rect {
  return {
    left: values.left,
    top: values.top,
    right: values.left + values.width,
    bottom: values.top + values.height,
    width: values.width,
    height: values.height,
    x: values.left,
    y: values.top,
    toJSON: () => ({}),
  } as Rect;
}

/** jsdom 没有 PointerEvent，用带同样坐标字段的 MouseEvent 代替。 */
function pointer(type: string, clientX: number, clientY: number): MouseEvent {
  return new MouseEvent(type, { bubbles: true, clientX, clientY });
}

describe("manifest 完整性", () => {
  it("端口从 9000 起逐一递加且目录/包名一一对应", () => {
    const ports = data.examples.map((x) => x.port);
    const dirs = data.examples.map((x) => x.dir);
    expect(data.gallery.port).toBe(9000);
    expect(new Set(ports).size).toBe(ports.length);
    expect(new Set(dirs).size).toBe(dirs.length);
    expect(ports).toEqual(Array.from({ length: data.examples.length }, (_, i) => 9001 + i));
    expect(ports.includes(data.gallery.port)).toBe(false);
    for (const item of data.examples) {
      expect(item.pkg).toBe(`@slux/example-${item.dir}`);
    }
  });
});

describe("URL 构造", () => {
  it("iframe 带 embed/theme，新窗口只带 theme", () => {
    const core = data.examples[0]!;
    expect(exampleUrl(core)).toBe(`http://localhost:${core.port}/`);
    expect(embedUrl(core, "dark")).toContain("embed=1");
    expect(embedUrl(core, "dark")).toContain("theme=dark");
    expect(externalUrl(core, "dark")).toContain("theme=dark");
    expect(externalUrl(core, "dark")).not.toContain("embed=1");
  });

  it("文档站中的总览使用同级静态示例地址", () => {
    const core = data.examples[0]!;
    const galleryUrl = "https://example.com/slux/examples/_gallery/";
    expect(exampleUrl(core, galleryUrl)).toBe("https://example.com/slux/examples/core-rsbuild-ts/");
    expect(embedUrl(core, "dark", galleryUrl)).toBe("https://example.com/slux/examples/core-rsbuild-ts/?embed=1&theme=dark");
    expect(externalUrl(core, "light", galleryUrl)).toBe("https://example.com/slux/examples/core-rsbuild-ts/?theme=light");
  });

  it("文档站中渲染的总览不显示开发端口", () => {
    const before = window.location.href;
    window.history.replaceState(null, "", "/slux/examples/_gallery/");
    try {
      const { root } = setup();
      expect(one<HTMLIFrameElement>(root, ".g-frame").src).toBe(`${window.location.origin}/slux/examples/core-rsbuild-ts/?embed=1&theme=light`);
      expect(one<HTMLElement>(root, ".g-current").textContent).not.toContain(":9001");
      expect(one<HTMLSelectElement>(root, ".g-select").textContent).not.toContain(":9001");
      root.remove();
    } finally {
      window.history.replaceState(null, "", before);
    }
  });
});

describe("总览页默认状态", () => {
  it("默认收起、默认选中 core，顶栏与 iframe 同步", () => {
    const { root } = setup();
    const app = one<HTMLElement>(root, ".g-app");
    const frame = one<HTMLIFrameElement>(root, ".g-frame");
    const current = one<HTMLElement>(root, ".g-current");
    const open = one<HTMLAnchorElement>(root, ".g-open-link");

    expect(app.classList.contains("collapsed")).toBe(true);
    expect(one<HTMLSelectElement>(root, ".g-select").value).toBe(CORE);
    expect(frame.classList.contains("ready")).toBe(true);
    expect(frame.getAttribute("src")).toContain("embed=1");
    expect(frame.getAttribute("src")).toContain("theme=light");
    expect(frame.getAttribute("src")).toContain(":9001");
    expect(current.textContent).toContain("core");
    expect(current.textContent).toContain(":9001");
    expect(open.getAttribute("href")).toContain("theme=light");
    expect(open.getAttribute("href")).not.toContain("embed=1");
    expect(open.target).toBe("_blank");
    // 默认选中不改写地址栏，刷新始终回到 core
    expect(window.location.hash).toBe("");
    root.remove();
  });

  it("hash 直达时选中指定示例而非 core", () => {
    const { root } = setup("#vue-rsbuild-ts");
    const frame = one<HTMLIFrameElement>(root, ".g-frame");
    expect(frame.getAttribute("src")).toContain(":9015");
    expect(one<HTMLElement>(root, ".g-current").textContent).toContain("vue");
    root.remove();
  });
});

describe("统一的浮层结构", () => {
  it("只有一个浮层和一个下拉框，右侧是上下箭头而非 ×", () => {
    const { root } = setup();
    expect(root.querySelectorAll(".g-panel")).toHaveLength(1);
    expect(root.querySelectorAll(".g-select")).toHaveLength(1);
    expect(root.querySelectorAll(".g-panel-body")).toHaveLength(1);
    const toggle = one<HTMLButtonElement>(root, ".g-toggle");
    expect(toggle.textContent).not.toContain("×");
    expect(toggle.textContent).not.toContain("☰");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toContain("展开");
    expect(one<HTMLSelectElement>(root, ".g-select").disabled).toBe(false);
    root.remove();
  });

  it("展开只是展开底部列表，同一个下拉框不禁用、不换节点", () => {
    const { root } = setup();
    const app = one<HTMLElement>(root, ".g-app");
    const panel = one<HTMLElement>(root, ".g-panel");
    const dropdown = one<HTMLSelectElement>(root, ".g-select");
    const toggle = one<HTMLButtonElement>(root, ".g-toggle");

    toggle.click();
    expect(app.classList.contains("collapsed")).toBe(false);
    expect(root.querySelectorAll(".g-panel")).toHaveLength(1);
    expect(one<HTMLSelectElement>(root, ".g-select")).toBe(dropdown);
    expect(dropdown.disabled).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toContain("收起");
    expect(root.querySelectorAll(".g-item")).toHaveLength(data.examples.length);

    toggle.click();
    expect(app.classList.contains("collapsed")).toBe(true);
    expect(one<HTMLElement>(root, ".g-panel")).toBe(panel);
    expect(dropdown.disabled).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    root.remove();
  });

  it("展开态下拉框依旧可直接切换示例", () => {
    const { root } = setup();
    one<HTMLButtonElement>(root, ".g-toggle").click();
    const dropdown = one<HTMLSelectElement>(root, ".g-select");
    expect(dropdown.disabled).toBe(false);
    dropdown.value = "solid-rsbuild-ts";
    dropdown.dispatchEvent(new Event("change"));

    expect(dropdown.value).toBe("solid-rsbuild-ts");
    expect(one<HTMLIFrameElement>(root, ".g-frame").getAttribute("src")).toContain(":9016");
    expect(one<HTMLElement>(root, ".g-current").textContent).toContain("solid");
    expect(one<HTMLButtonElement>(root, '.g-item[data-dir="solid-rsbuild-ts"]').classList.contains("active")).toBe(true);
    expect(one<HTMLElement>(root, ".g-app").classList.contains("collapsed")).toBe(false);
    root.remove();
  });

  it("展开态从列表选择仍会同步下拉框的值", () => {
    const { root } = setup();
    one<HTMLButtonElement>(root, ".g-toggle").click();
    one<HTMLButtonElement>(root, '.g-item[data-dir="vue-rsbuild-ts"]').click();
    expect(one<HTMLSelectElement>(root, ".g-select").value).toBe("vue-rsbuild-ts");
    expect(one<HTMLIFrameElement>(root, ".g-frame").getAttribute("src")).toContain(":9015");
    root.remove();
  });
});

describe("选择交互", () => {
  it("初次加载和切换示例时显示遮罩，当前 iframe load 才撤下", () => {
    const { root, api } = setup();
    const placeholder = one<HTMLElement>(root, ".g-placeholder");
    const first = one<HTMLIFrameElement>(root, ".g-frame");
    expect(placeholder.classList.contains("hidden")).toBe(false);
    first.dispatchEvent(new Event("load"));
    expect(placeholder.classList.contains("hidden")).toBe(true);
    api.select("vue-rsbuild-ts");
    expect(placeholder.classList.contains("hidden")).toBe(false);
    first.dispatchEvent(new Event("load"));
    expect(placeholder.classList.contains("hidden")).toBe(false);
    const current = one<HTMLIFrameElement>(root, ".g-frame");
    expect(current).not.toBe(first);
    current.dispatchEvent(new Event("load"));
    expect(placeholder.classList.contains("hidden")).toBe(true);
    root.remove();
  });

  it.each(["@slux/core", "/core"])("当前包 %s 的 ready 消息可提前撤下遮罩", (packageName) => {
    const { root } = setup();
    const frame = one<HTMLIFrameElement>(root, ".g-frame");
    const placeholder = one<HTMLElement>(root, ".g-placeholder");
    expect(placeholder.classList.contains("hidden")).toBe(false);
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        origin: new URL(frame.src).origin,
        data: { type: "CONTENT_LOADED", payload: { package: packageName } },
      }),
    );
    expect(placeholder.classList.contains("hidden")).toBe(true);
    root.remove();
  });

  it("拒绝错误 origin、错误包、非法 payload 及切换前 iframe 的 ready 消息", () => {
    const { root, api } = setup();
    const oldWindow = one<HTMLIFrameElement>(root, ".g-frame").contentWindow;
    api.select("vue-rsbuild-ts");
    const frame = one<HTMLIFrameElement>(root, ".g-frame");
    const placeholder = one<HTMLElement>(root, ".g-placeholder");
    const valid = { type: "CONTENT_LOADED", payload: { package: "/vue" } };
    for (const event of [
      { source: oldWindow, origin: new URL(frame.src).origin, data: valid },
      {
        source: frame.contentWindow,
        origin: "https://unrelated.example",
        data: valid,
      },
      {
        source: frame.contentWindow,
        origin: new URL(frame.src).origin,
        data: { type: "CONTENT_LOADED", payload: { package: "/core" } },
      },
      {
        source: frame.contentWindow,
        origin: new URL(frame.src).origin,
        data: { type: "CONTENT_LOADED", payload: null },
      },
    ]) {
      window.dispatchEvent(new MessageEvent<unknown>("message", event));
      expect(placeholder.classList.contains("hidden")).toBe(false);
    }
    root.remove();
  });

  it("下拉切换示例会更新 iframe、顶栏、新窗口链接与 hash", () => {
    const { root } = setup();
    const dropdown = one<HTMLSelectElement>(root, ".g-select");
    dropdown.value = "vue-rsbuild-ts";
    dropdown.dispatchEvent(new Event("change"));

    const frame = one<HTMLIFrameElement>(root, ".g-frame");
    expect(frame.getAttribute("src")).toContain(":9015");
    expect(one<HTMLElement>(root, ".g-current").textContent).toContain("vue");
    expect(one<HTMLAnchorElement>(root, ".g-open-link").getAttribute("href")).toContain(":9015");
    expect(window.location.hash).toBe("#vue-rsbuild-ts");
    expect(one<HTMLButtonElement>(root, '.g-item[data-dir="vue-rsbuild-ts"]').classList.contains("active")).toBe(true);
    root.remove();
  });

  it("不存在的目录返回 false 且不改变选中项", () => {
    const { root, api } = setup();
    expect(api.select("no-such-example")).toBe(false);
    expect(one<HTMLSelectElement>(root, ".g-select").value).toBe(CORE);
    root.remove();
  });
});

describe("拖拽与位置保持", () => {
  it("收起态同样可以拖动，且不会改变收起状态", () => {
    const { root } = setup();
    const app = one<HTMLElement>(root, ".g-app");
    const panel = one<HTMLElement>(root, ".g-panel");
    const head = one<HTMLElement>(root, ".g-panel-head");
    panel.getBoundingClientRect = () => rectBox({ left: 700, top: 72, width: 244, height: 48 });

    head.dispatchEvent(pointer("pointerdown", 720, 92));
    head.dispatchEvent(pointer("pointermove", 400, 260));
    expect(panel.style.left.endsWith("px")).toBe(true);
    expect(panel.style.top.endsWith("px")).toBe(true);
    expect(panel.classList.contains("dragging")).toBe(true);
    head.dispatchEvent(pointer("pointerup", 400, 260));
    expect(panel.classList.contains("dragging")).toBe(false);
    expect(app.classList.contains("collapsed")).toBe(true);
    expect(one<HTMLSelectElement>(root, ".g-select").disabled).toBe(false);
    root.remove();
  });

  it("在下拉框或箭头按钮上按下不会触发拖拽", () => {
    const { root } = setup();
    const panel = one<HTMLElement>(root, ".g-panel");
    const dropdown = one<HTMLSelectElement>(root, ".g-select");
    const toggle = one<HTMLButtonElement>(root, ".g-toggle");

    dropdown.dispatchEvent(pointer("pointerdown", 720, 92));
    dropdown.dispatchEvent(pointer("pointermove", 400, 260));
    dropdown.dispatchEvent(pointer("pointerup", 400, 260));
    expect(panel.style.left).toBe("");
    expect(panel.style.top).toBe("");

    toggle.dispatchEvent(pointer("pointerdown", 720, 92));
    toggle.dispatchEvent(pointer("pointermove", 400, 260));
    toggle.dispatchEvent(pointer("pointerup", 400, 260));
    expect(panel.style.left).toBe("");
    expect(panel.style.top).toBe("");
    root.remove();
  });

  it("收起 / 展开不重置拖拽后的位置", () => {
    const { root } = setup();
    const panel = one<HTMLElement>(root, ".g-panel");
    const head = one<HTMLElement>(root, ".g-panel-head");
    const toggle = one<HTMLButtonElement>(root, ".g-toggle");
    toggle.click(); // 展开

    let box = rectBox({ left: 100, top: 120, width: 272, height: 560 });
    panel.getBoundingClientRect = () => box;
    head.dispatchEvent(pointer("pointerdown", 120, 140));
    head.dispatchEvent(pointer("pointermove", 400, 260));
    head.dispatchEvent(pointer("pointerup", 400, 260));

    const left = panel.style.left;
    const top = panel.style.top;
    expect(left.endsWith("px")).toBe(true);
    expect(top.endsWith("px")).toBe(true);

    box = rectBox({ left: 380, top: 240, width: 272, height: 560 });
    toggle.click(); // 收起
    expect(one<HTMLElement>(root, ".g-app").classList.contains("collapsed")).toBe(true);
    expect(panel.style.left).toBe(left);
    expect(panel.style.top).toBe(top);

    box = rectBox({ left: 380, top: 240, width: 244, height: 48 });
    toggle.click(); // 再次展开
    expect(panel.style.left).toBe(left);
    expect(panel.style.top).toBe(top);
    expect(panel.style.right).toBe("auto");
    root.remove();
  });

  it("拖动展开态浮层回到右上角会自动收起", () => {
    const { root } = setup();
    const app = one<HTMLElement>(root, ".g-app");
    one<HTMLButtonElement>(root, ".g-toggle").click();
    const panel = one<HTMLElement>(root, ".g-panel");
    const head = one<HTMLElement>(root, ".g-panel-head");

    let box = rectBox({ left: 100, top: 120, width: 272, height: 560 });
    panel.getBoundingClientRect = () => box;

    head.dispatchEvent(pointer("pointerdown", 120, 140));
    head.dispatchEvent(pointer("pointermove", 400, 320));
    expect(panel.style.left.endsWith("px")).toBe(true);
    expect(panel.style.top.endsWith("px")).toBe(true);
    expect(panel.classList.contains("dragging")).toBe(true);

    // 拖回右上角后松手 → 收起
    box = rectBox({ left: 732, top: 72, width: 272, height: 560 });
    head.dispatchEvent(pointer("pointerup", 752, 92));
    expect(panel.classList.contains("dragging")).toBe(false);
    expect(app.classList.contains("collapsed")).toBe(true);
    root.remove();
  });
});

describe("主题同步", () => {
  it("嵌入文档站时优先采用 URL 中的主题", () => {
    const before = window.location.href;
    window.history.replaceState(null, "", "/slux/examples/_gallery/?theme=dark");
    localStorage.setItem(THEME_KEY, "light");
    try {
      const root = document.createElement("div");
      document.body.append(root);
      createGallery(root, data);
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(one<HTMLIFrameElement>(root, ".g-frame").getAttribute("src")).toContain("theme=dark");
      root.remove();
    } finally {
      localStorage.removeItem(THEME_KEY);
      window.history.replaceState(null, "", before);
    }
  });

  function spyFrame(root: HTMLElement) {
    const frame = one<HTMLIFrameElement>(root, ".g-frame");
    const win = frame.contentWindow;
    const sent: unknown[] = [];
    if (win) {
      Object.defineProperty(win, "postMessage", {
        configurable: true,
        value: (payload: unknown) => sent.push(payload),
      });
    }
    return { frame, win, sent };
  }

  const hasThemeMessage = (sent: unknown[], theme: string): boolean =>
    sent.some(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        (m as { type?: string }).type === "THEME_CHANGED" &&
        (m as { payload?: { theme?: string } }).payload?.theme === theme,
    );

  it("切换主题只向 iframe 发消息，不重载 iframe，并写回地址栏", () => {
    const { root } = setup();
    const { frame, win, sent } = spyFrame(root);
    const srcBefore = frame.getAttribute("src");

    one<HTMLButtonElement>(root, ".g-bar-btn").click();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(new URLSearchParams(window.location.search).get("theme")).toBe("dark");
    expect(one<HTMLAnchorElement>(root, ".g-open-link").getAttribute("href")).toContain("theme=dark");
    expect(frame.getAttribute("src")).toBe(srcBefore); // 同步主题不重载 iframe
    if (win) expect(hasThemeMessage(sent, "dark")).toBe(true);
    root.remove();
  });

  it("从文档父页面接收主题时同步总览与内部示例", () => {
    const parentDescriptor = Object.getOwnPropertyDescriptor(window, "parent");
    const parent = { postMessage: () => {} };
    Object.defineProperty(window, "parent", {
      configurable: true,
      value: parent,
    });
    try {
      const { root } = setup();
      const { frame, win, sent } = spyFrame(root);
      const before = frame.getAttribute("src");
      const event = new MessageEvent("message", {
        data: { type: "THEME_CHANGED", payload: { theme: "dark" } },
      });
      Object.defineProperty(event, "source", { value: parent });
      window.dispatchEvent(event);
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(one<HTMLAnchorElement>(root, ".g-open-link").getAttribute("href")).toContain("theme=dark");
      expect(frame.getAttribute("src")).toBe(before);
      if (win) expect(hasThemeMessage(sent, "dark")).toBe(true);
      root.remove();
    } finally {
      if (parentDescriptor) Object.defineProperty(window, "parent", parentDescriptor);
    }
  });

  it("内部示例发来主题变更时更新总览，且不改 iframe URL", () => {
    const { root } = setup();
    const { frame, win } = spyFrame(root);
    const before = frame.getAttribute("src");
    if (win) {
      const event = new MessageEvent("message", {
        data: { type: "THEME_CHANGED", payload: { theme: "dark" } },
      });
      Object.defineProperty(event, "source", { value: win });
      window.dispatchEvent(event);
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(frame.getAttribute("src")).toBe(before);
    }
    root.remove();
  });

  it("示例主动索取主题时回填当前主题", () => {
    const { root } = setup();
    const { win, sent } = spyFrame(root);
    one<HTMLButtonElement>(root, ".g-bar-btn").click(); // dark
    sent.length = 0;
    if (win) {
      const event = new MessageEvent("message", {
        data: { type: "slux-example-theme-request" },
      });
      Object.defineProperty(event, "source", {
        configurable: true,
        value: win,
      });
      window.dispatchEvent(event);
      expect(hasThemeMessage(sent, "dark")).toBe(true);
    }
    root.remove();
  });

  it("收到其他同源标签页的主题广播时同步总览并写回地址栏", async () => {
    const { root } = setup();
    const peer = new BroadcastChannel("slux-theme-sync");
    // 模拟「另一个标签页」发出的主题变更；type 对得上即应用。
    peer.postMessage({ type: "THEME_CHANGED", payload: { theme: "dark" } });
    await new Promise((resolve) => setTimeout(resolve, 30));
    peer.close();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(new URLSearchParams(window.location.search).get("theme")).toBe("dark");
    root.remove();
  });
});

describe("总览自身嵌入态", () => {
  it("总览被嵌入时隐藏自己的顶部栏", () => {
    const before = window.location.href;
    window.history.replaceState(null, "", "/slux/examples/_gallery/?embed=1");
    try {
      const root = document.createElement("div");
      document.body.append(root);
      createGallery(root, data);
      // 与示例对齐：根节点打上 data-embed，CSS 据此隐藏 .g-bar。
      expect(document.documentElement.dataset.embed).toBe("1");
      expect(root.querySelector(".g-bar")).not.toBeNull();
      root.remove();
    } finally {
      delete document.documentElement.dataset.embed;
      window.history.replaceState(null, "", before);
    }
  });

  it("独立开发（非嵌入）时顶部栏保留", () => {
    const { root } = setup();
    expect(document.documentElement.dataset.embed).toBeUndefined();
    expect(root.querySelector(".g-bar")).not.toBeNull();
    root.remove();
  });
});

describe("搜索过滤", () => {
  it("过滤条目，空分组随之隐藏", () => {
    const { root } = setup();
    const search = one<HTMLInputElement>(root, ".g-search");
    search.value = "react";
    search.dispatchEvent(new Event("input"));
    const visible = [...root.querySelectorAll<HTMLButtonElement>(".g-item:not(.hidden)")].map((b) => b.dataset.dir);
    expect(visible).toContain("react-rsbuild-ts");
    expect(visible).not.toContain("atom-rsbuild-ts");
    search.value = "";
    search.dispatchEvent(new Event("input"));
    expect(root.querySelectorAll(".g-item:not(.hidden)")).toHaveLength(data.examples.length);
    root.remove();
  });
});
