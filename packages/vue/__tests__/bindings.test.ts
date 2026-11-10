import { describe, expect, it } from "rstack/test";
import { createApp, createSSRApp, defineComponent, effectScope, h, nextTick, watchEffect } from "vue";
import { renderToString } from "@vue/server-renderer";
import { computed, createScope, signal } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { createStore } from "@slux/store";
import { atom, derived } from "@slux/atom";
import { observable } from "@slux/proxy";
import { ScopeProvider, sluxPlugin, useScope, useSignal } from "../src/index.js";
import { useStore } from "../src/store.js";
import { useAtom, useAtomValue } from "../src/atom.js";
import { useSnapshot } from "../src/proxy.js";

describe("Vue 桥接", () => {
  it("在 effectScope 内刷新 computed 并停止追踪", () => {
    const count = signal(1);
    let reads = 0;
    const doubled = computed(() => {
      reads++;
      return count.get() * 2;
    });
    const scope = effectScope();
    const value = scope.run(() => useSignal(doubled))!;
    expect(value.value).toBe(2);
    count.set(2);
    expect(value.value).toBe(4);
    const before = reads;
    scope.stop();
    count.set(3);
    expect(reads).toBe(before);
    expect(value.value).toBe(4);
  });

  it("支持原始 Subscribable 并在卸载后退订", async () => {
    let current = 1;
    const callbacks = new Set<(value: number) => void>();
    const source: Subscribable<number> = {
      get: () => current,
      subscribe: (callback) => {
        callbacks.add(callback);
        return () => {
          callbacks.delete(callback);
        };
      },
    };
    const App = defineComponent({
      setup() {
        const value = useSignal(source);
        return () => h("span", String(value.value));
      },
    });
    const container = document.createElement("div");
    const app = createApp(App);
    app.mount(container);
    expect(callbacks.size).toBe(1);
    current = 2;
    callbacks.forEach((callback) => callback(current));
    await nextTick();
    expect(container.textContent).toBe("2");
    app.unmount();
    expect(callbacks.size).toBe(0);
  });

  it("selector 相等时保留引用并避免 Vue 更新", () => {
    const store = createStore(() => ({ count: 1, other: 0 }));
    const scope = effectScope();
    let runs = 0;
    scope.run(() => {
      const value = useStore(
        store,
        (state) => ({ count: state.count }),
        (a, b) => a.count === b.count,
      );
      watchEffect(
        () => {
          void value.value;
          runs++;
        },
        { flush: "sync" },
      );
    });
    store.setState({ other: 1 });
    expect(runs).toBe(1);
    store.setState({ count: 2 });
    expect(runs).toBe(2);
    scope.stop();
    store.destroy();
  });

  it("atom 写入、派生 atom、函数值和 proxy 深层变化", () => {
    const count = atom(1);
    const doubled = derived((get) => get(count) * 2);
    const state = observable({ nested: { count: 1 } });
    const fn = () => 1;
    const callback = signal(fn);
    const scope = effectScope();
    const values = scope.run(() => ({
      atom: useAtom(count),
      derived: useAtomValue(doubled),
      snapshot: useSnapshot(state),
      fn: useSignal(callback),
    }))!;
    values.atom[1](3);
    state.nested.count = 2;
    expect(values.atom[0].value).toBe(3);
    expect(values.derived.value).toBe(6);
    expect(values.snapshot.value.nested.count).toBe(2);
    expect(values.fn.value).toBe(fn);
    scope.stop();
  });

  it("SSR 不留下订阅，scope 必须显式读取且可被内层覆盖", async () => {
    const count = signal(1);
    const outer = createScope();
    outer.set(count, 10);
    const inner = createScope();
    inner.set(count, 20);
    let subscriptions = 0;
    const source: Subscribable<number> = {
      get: count.get,
      subscribe(callback) {
        subscriptions++;
        const stop = count.subscribe(callback);
        return () => {
          subscriptions--;
          stop();
        };
      },
    };
    const Child = defineComponent({
      setup() {
        const value = useSignal(source);
        const scope = useScope();
        return () => h("span", `${scope?.get(count)}:${value.value}`);
      },
    });
    const app = createSSRApp({
      render: () => h(ScopeProvider, { scope: inner }, { default: () => h(Child) }),
    });
    app.use(sluxPlugin, { scope: outer });
    expect(await renderToString(app)).toContain("20:1");
    expect(subscriptions).toBe(0);
    expect(count.get()).toBe(1);
  });

  it("没有作用域时拒绝创建无法清理的订阅", () => {
    expect(() => useSignal(signal(1))).toThrow("effectScope");
  });
});
