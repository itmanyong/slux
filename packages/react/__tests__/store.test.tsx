import { act, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "rstack/test";
import { createStore } from "@slux/store";
import type { StoreApi } from "@slux/store";
import { useStore } from "../src/store.js";
import { render } from "./render.js";

type State = { count: number; label: string };

describe("useStore", () => {
  it("读取完整状态并通过 action 更新", () => {
    const store = createStore<{ count: number; increment: () => void }>((set) => ({
      count: 1,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    function Counter() {
      const state = useStore(store);
      return <button onClick={state.increment}>{state.count}</button>;
    }
    const view = render(<Counter />);
    act(() => view.container.querySelector("button")!.click());
    expect(view.container.textContent).toBe("2");
    expect(store.getState().count).toBe(2);
    view.unmount();
    store.destroy();
  });

  it("selector 只在选值改变时更新组件", () => {
    const store = createStore(() => ({ count: 1, label: "before" }));
    let renders = 0;
    function Counter() {
      renders++;
      return <span>{useStore(store, (state) => state.count)}</span>;
    }
    const view = render(<Counter />);
    const before = renders;
    act(() => store.setState({ label: "after" }));
    expect(renders).toBe(before);
    act(() => store.setState({ count: 2 }));
    expect(view.container.textContent).toBe("2");
    view.unmount();
    store.destroy();
  });

  it("对象 selector 配合 equalityFn 复用相等选值", () => {
    const store = createStore(() => ({ count: 1, label: "before" }));
    const selector = (state: State) => ({ value: state.count });
    const equals = (a: { value: number }, b: { value: number }) => a.value === b.value;
    let renders = 0;
    let selected: { value: number } | undefined;
    function Counter() {
      renders++;
      selected = useStore(store, selector, equals);
      return <span>{selected.value}</span>;
    }
    const view = render(<Counter />);
    const first = selected;
    const before = renders;
    act(() => store.setState({ label: "after" }));
    expect(renders).toBe(before);
    expect(selected).toBe(first);
    act(() => store.setState({ count: 2 }));
    expect(view.container.textContent).toBe("2");
    view.unmount();
    store.destroy();
  });

  it("状态未变时切换 selector 也立即得到新的选值", () => {
    const store = createStore(() => ({ left: 1, right: 10 }));
    function Value({ field }: { field: "left" | "right" }) {
      return <span>{useStore(store, (state) => state[field])}</span>;
    }
    const view = render(<Value field="left" />);
    expect(view.container.textContent).toBe("1");
    view.rerender(<Value field="right" />);
    expect(view.container.textContent).toBe("10");
    act(() => store.setState({ right: 20 }));
    expect(view.container.textContent).toBe("20");
    view.unmount();
    store.destroy();
  });

  it("更换 equalityFn 后不能复用被旧比较器保留的过期值", () => {
    const store = createStore(() => ({ count: 1 }));
    const selector = (state: { count: number }) => state.count;
    const alwaysEqual = () => true;
    function Value({ equals }: { equals: (a: number, b: number) => boolean }) {
      return <span>{useStore(store, selector, equals)}</span>;
    }
    const view = render(<Value equals={alwaysEqual} />);
    act(() => store.setState({ count: 2 }));
    expect(view.container.textContent).toBe("1");
    view.rerender(<Value equals={Object.is} />);
    expect(view.container.textContent).toBe("2");
    view.unmount();
    store.destroy();
  });

  it("内联对象 selector 的快照稳定，不造成循环渲染", () => {
    const store = createStore(() => ({ count: 1 }));
    function Value() {
      return <span>{useStore(store, (state) => ({ value: state.count })).value}</span>;
    }
    const view = render(
      <StrictMode>
        <Value />
      </StrictMode>,
    );
    act(() => store.setState({ count: 2 }));
    expect(view.container.textContent).toBe("2");
    view.unmount();
    store.destroy();
  });

  it("selector 可在字段与完整状态之间切换", () => {
    const store = createStore(() => ({ count: 1 }));
    function Value({ select }: { select: boolean }) {
      const value = useStore(store, (state) => (select ? state.count : state));
      return <span>{typeof value === "number" ? value : `full:${value.count}`}</span>;
    }
    const view = render(<Value select />);
    view.rerender(<Value select={false} />);
    expect(view.container.textContent).toBe("full:1");
    act(() => store.setState({ count: 2 }));
    expect(view.container.textContent).toBe("full:2");
    view.unmount();
    store.destroy();
  });

  it("切换 store 后订阅新实例，卸载不销毁业务 store", () => {
    const first = createStore(() => ({ count: 1 }));
    const second = createStore(() => ({ count: 10 }));
    let renders = 0;
    function Value({ store }: { store: StoreApi<{ count: number }> }) {
      renders++;
      return <span>{useStore(store).count}</span>;
    }
    const view = render(<Value store={first} />);
    view.rerender(<Value store={second} />);
    const before = renders;
    act(() => first.setState({ count: 2 }));
    expect(renders).toBe(before);
    expect(view.container.textContent).toBe("10");
    act(() => second.setState({ count: 20 }));
    expect(view.container.textContent).toBe("20");
    view.unmount();
    second.setState({ count: 30 });
    expect(second.getState().count).toBe(30);
    first.destroy();
    second.destroy();
  });

  it("SSR 对齐参考行为，读取当前状态而非 getInitialState", () => {
    const store = createStore(() => ({ count: 1 }));
    store.setState({ count: 10 });
    function Value() {
      return <span>{useStore(store, (state) => state.count)}</span>;
    }
    expect(renderToString(<Value />)).toBe("<span>10</span>");
    store.destroy();
  });
});
