import { describe, expect, it, rstest } from "rstack/test";
import { act, createElement, createRoot } from "octane";
import { computed, createScope, signal } from "@slux/core";
import { atom } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { ScopeProvider, useSignal } from "../src/index.js";
import { useAtom } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";
import { CompiledReader } from "./reader.fixture.js";

describe("Octane bindings", () => {
  it("消费端编译的组件自动分配调用位置，公开源码入口可正常订阅", async () => {
    const first = signal(1);
    const second = signal(2);
    const store = createStore(() => ({ count: 3 }));
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(() => root.render(createElement(CompiledReader, { first, second, store })));
    expect(container.textContent).toBe("1:2:3:3:3");
    await act(() => {
      first.set(4);
      second.set(5);
      store.setState({ count: 6 });
    });
    expect(container.textContent).toBe("4:5:6:6:6");
    await act(() => root.unmount());
  });
  it("真实根持续更新 computed，多调用点互不覆盖并在卸载时清理", async () => {
    const count = signal(1);
    const calculate = rstest.fn(() => count.get() * 2);
    const doubled = computed(calculate);
    const firstSlot = Symbol("first");
    const secondSlot = Symbol("second");
    const container = document.createElement("div");
    const root = createRoot(container);
    function Reader() {
      const first = useSignal(count, firstSlot);
      const second = useSignal(doubled, secondSlot);
      return createElement("output", null, `${first}:${second}`);
    }
    await act(() => root.render(Reader));
    expect(container.textContent).toBe("1:2");
    await act(() => count.set(2));
    expect(container.textContent).toBe("2:4");
    await act(() => root.unmount());
    const calls = calculate.mock.calls.length;
    count.set(3);
    expect(calculate).toHaveBeenCalledTimes(calls);
  });

  it("atom 双向绑定、store 比较器和 proxy 深层修改", async () => {
    const count = atom(1);
    const store = createStore(() => ({ count: 1, other: 0 }));
    const state = observable({ nested: { count: 1 } });
    const atomSlot = Symbol("atom");
    const storeSlot = Symbol("store");
    const proxySlot = Symbol("proxy");
    const select = (value: { count: number }) => ({ count: value.count });
    const equals = (a: { count: number }, b: { count: number }) => a.count === b.count;
    let write!: (value: number) => void;
    const selections: { count: number }[] = [];
    const container = document.createElement("div");
    const root = createRoot(container);
    function Reader() {
      const [value, set] = useAtom(count, atomSlot);
      write = set;
      const selected = useStore(store, select, equals, storeSlot);
      selections.push(selected);
      const snap = useSnapshot(state, proxySlot);
      return createElement("output", null, `${value}:${selected.count}:${snap.nested.count}`);
    }
    await act(() => root.render(Reader));
    expect(container.textContent).toBe("1:1:1");
    const original = selections.at(-1);
    await act(() => store.setState({ other: 3 }));
    expect(selections.at(-1)).toBe(original);
    await act(() => {
      write(3);
      store.setState({ count: 4 });
      state.nested.count = 5;
    });
    expect(container.textContent).toBe("3:4:5");
    await act(() => root.unmount());
  });

  it("切换信号清除旧订阅，Scope 不改变客户端全局值", async () => {
    const first = signal(1);
    const second = signal(2);
    const scope = createScope();
    scope.set(first, 100);
    const slot = Symbol("source");
    const container = document.createElement("div");
    const root = createRoot(container);
    function Reader({ source }: { source: typeof first }) {
      return createElement("output", null, useSignal(source, slot));
    }
    const view = (source: typeof first) =>
      createElement(ScopeProvider, {
        scope,
        children: createElement(Reader, { source }),
      });
    await act(() => root.render(view(first)));
    expect(container.textContent).toBe("1");
    await act(() => root.render(view(second)));
    await act(() => first.set(8));
    expect(container.textContent).toBe("2");
    await act(() => second.set(9));
    expect(container.textContent).toBe("9");
    await act(() => root.unmount());
  });
});
