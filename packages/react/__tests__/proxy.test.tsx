import { act, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "rstack/test";
import { observable } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { useSnapshot } from "../src/proxy.js";
import { render } from "./render.js";

describe("useSnapshot", () => {
  it("嵌套修改触发更新，快照只读并保留未变分支引用", () => {
    const proxy = observable({ user: { name: "Alice" }, other: { value: 1 } });
    let current: Snapshot<typeof proxy> | undefined;
    function Value() {
      current = useSnapshot(proxy);
      return <span>{current.user.name}</span>;
    }
    const view = render(<Value />);
    const previous = current!;
    act(() => {
      proxy.user.name = "Bob";
    });
    expect(view.container.textContent).toBe("Bob");
    expect(previous.user.name).toBe("Alice");
    expect(current!.other).toBe(previous.other);
    expect(Object.isFrozen(current)).toBe(true);
    expect(Object.isFrozen(current!.user)).toBe(true);
  });

  it("相同值不重渲染，未读取字段改变也按整个 proxy 订阅更新", () => {
    const proxy = observable({ count: 1, other: 0 });
    let renders = 0;
    function Value() {
      renders++;
      return <span>{useSnapshot(proxy).count}</span>;
    }
    const view = render(<Value />);
    const before = renders;
    act(() => {
      proxy.count = 1;
    });
    expect(renders).toBe(before);
    act(() => {
      proxy.other = 1;
    });
    expect(renders).toBeGreaterThan(before);
    expect(view.container.textContent).toBe("1");
  });

  it("支持数组追加与删除属性", () => {
    const proxy = observable<{ items: number[]; title?: string }>({
      items: [1],
      title: "title",
    });
    function Value() {
      const state = useSnapshot(proxy);
      return <span>{`${state.items.join(",")}:${state.title ?? "none"}`}</span>;
    }
    const view = render(<Value />);
    act(() => {
      proxy.items.push(2);
      delete proxy.title;
    });
    expect(view.container.textContent).toBe("1,2:none");
  });

  it("StrictMode 中切换来源后不再响应旧 proxy，卸载后业务对象仍可用", () => {
    const first = observable({ count: 1 });
    const second = observable({ count: 10 });
    let renders = 0;
    function Value({ proxy }: { proxy: { count: number } }) {
      renders++;
      return <span>{useSnapshot(proxy).count}</span>;
    }
    const view = render(
      <StrictMode>
        <Value proxy={first} />
      </StrictMode>,
    );
    act(() => {
      first.count = 2;
    });
    expect(view.container.textContent).toBe("2");
    view.rerender(
      <StrictMode>
        <Value proxy={second} />
      </StrictMode>,
    );
    const before = renders;
    act(() => {
      first.count = 3;
    });
    expect(renders).toBe(before);
    act(() => {
      second.count = 20;
    });
    expect(view.container.textContent).toBe("20");
    view.unmount();
    second.count = 30;
    expect(second.count).toBe(30);
  });

  it("SSR 读取当前 proxy 快照", () => {
    const proxy = observable({ count: 1 });
    proxy.count = 10;
    function Value() {
      return <span>{useSnapshot(proxy).count}</span>;
    }
    expect(renderToString(<Value />)).toBe("<span>10</span>");
  });
});
