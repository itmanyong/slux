import { act, createContext } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, rstest } from "rstack/test";
import { ThemeContext } from "@rspress/core/runtime";
import { ExampleFrame } from "../theme/ExampleFrame";

// Rspress runtime 依赖站点构建生成的虚拟模块；组件测试仅提供真实 React context。
rstest.mock("@rspress/core/runtime", () => {
  return { ThemeContext: createContext({ theme: "light", setTheme: () => {} }) };
});

let container: HTMLDivElement;
let root: Root;
let animationFrame: FrameRequestCallback | undefined;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  rstest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    animationFrame = callback;
    return 1;
  });
  rstest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    animationFrame = undefined;
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  rstest.restoreAllMocks();
});

function render(src = "/examples/react/", packageName = "react", theme = "light") {
  act(() =>
    root.render(
      <ThemeContext.Provider value={{ theme, setTheme: () => {} } as React.ContextType<typeof ThemeContext>}>
        <ExampleFrame src={src} packageName={packageName} title="示例" sourcePath="examples/react" />
      </ThemeContext.Provider>,
    ),
  );
}

function startFrame() {
  act(() => animationFrame?.(0));
  return container.querySelector("iframe")!;
}

function ready(
  frame: HTMLIFrameElement,
  data: unknown = { type: "CONTENT_LOADED", payload: { package: "/react" } },
  origin = window.location.origin,
  source: MessageEventSource | null = frame.contentWindow,
) {
  act(() => window.dispatchEvent(new MessageEvent("message", { data, origin, source })));
}

describe("ExampleFrame 加载状态", () => {
  it("初始显示遮罩，真实 src 就绪前不挂载空白 iframe，load 后结束加载", () => {
    render();
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    const frame = startFrame();
    expect(frame.src).toContain("/examples/react/?theme=light");
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    act(() => frame.dispatchEvent(new Event("load")));
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it.each(["/react", "@slux/react"])("当前包 %s 的 ready 消息可在 load 前关闭遮罩", (packageName) => {
    render();
    const frame = startFrame();
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    ready(frame, { type: "CONTENT_LOADED", payload: { package: packageName } });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("忽略错误来源、其他包与非法消息结构", () => {
    render();
    const frame = startFrame();
    for (const data of [
      null,
      "CONTENT_LOADED",
      { type: "CONTENT_LOADED", payload: null },
      { type: "CONTENT_LOADED", payload: "react" },
      { type: "CONTENT_LOADED", payload: { package: "/vue" } },
    ]) {
      ready(frame, data);
      expect(container.querySelector('[role="status"]')).not.toBeNull();
    }
    ready(frame, undefined, "https://unrelated.example");
    ready(frame, undefined, window.location.origin, window);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });

  it("切换 src 重启加载并拒绝旧 iframe 消息", () => {
    render();
    const oldFrame = startFrame();
    const oldWindow = oldFrame.contentWindow;
    ready(oldFrame);
    render("/examples/react/?revision=2#preview");
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    const currentFrame = startFrame();
    expect(currentFrame).not.toBe(oldFrame);
    expect(currentFrame.src).toContain("?revision=2&theme=light#preview");
    ready(currentFrame, undefined, window.location.origin, oldWindow);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    ready(currentFrame);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("按 iframe 自身 URL 校验跨源 ready，主题切换不重新加载", () => {
    render("https://examples.example/react/");
    const frame = startFrame();
    ready(frame);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    ready(frame, undefined, "https://examples.example");
    expect(container.querySelector('[role="status"]')).toBeNull();
    render("https://examples.example/react/", "react", "dark");
    expect(container.querySelector("iframe")).toBe(frame);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
