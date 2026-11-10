import { describe, expect, it } from "rstack/test";
import { createComputed, createRoot } from "solid-js";
import { isServer } from "solid-js/web";
import { computed, createScope, signal } from "@slux/core";
import { createStore } from "@slux/store";
import { atom, derived } from "@slux/atom";
import { observable } from "@slux/proxy";
import { ScopeProvider, useScope, useSignal } from "../src/index.js";
import { useStore } from "../src/store.js";
import { useAtom, useAtomValue } from "../src/atom.js";
import { useSnapshot } from "../src/proxy.js";

describe("Solid 客户端", () => {
  it("使用真实客户端响应式运行时刷新 computed 并清理", () => {
    expect(isServer).toBe(false);
    const count = signal(1);
    let reads = 0;
    const doubled = computed(() => {
      reads++;
      return count.get() * 2;
    });
    const values: number[] = [];
    const stop = createRoot((dispose) => {
      const value = useSignal(doubled);
      createComputed(() => {
        values.push(value());
      });
      return dispose;
    });
    count.set(2);
    expect(values).toEqual([2, 4]);
    const before = reads;
    stop();
    count.set(3);
    expect(values).toEqual([2, 4]);
    expect(reads).toBe(before);
  });

  it("支持非 core 的订阅源、函数值并自动退订", () => {
    let current = () => 1;
    const callbacks = new Set<(value: () => number) => void>();
    const root = createRoot((stop) => ({
      stop,
      value: useSignal({
        get: () => current,
        subscribe(callback) {
          callbacks.add(callback);
          return () => {
            callbacks.delete(callback);
          };
        },
      }),
    }));
    const next = () => 2;
    current = next;
    callbacks.forEach((callback) => callback(next));
    expect(root.value()).toBe(next);
    root.stop();
    expect(callbacks.size).toBe(0);
  });

  it("store selector 用自定义比较器抑制无关变化", () => {
    const store = createStore(() => ({ count: 1, other: 0 }));
    const values: number[] = [];
    const stop = createRoot((dispose) => {
      const value = useStore(
        store,
        (state) => ({ count: state.count }),
        (a, b) => a.count === b.count,
      );
      createComputed(() => {
        values.push(value().count);
      });
      return dispose;
    });
    store.setState({ other: 1 });
    store.setState({ count: 2 });
    expect(values).toEqual([1, 2]);
    stop();
    store.destroy();
  });

  it("桥接 atom、派生 atom 和嵌套 proxy", () => {
    const count = atom(1);
    const doubled = derived((get) => get(count) * 2);
    const state = observable({ nested: { count: 1 } });
    const root = createRoot((stop) => ({
      stop,
      atom: useAtom(count),
      doubled: useAtomValue(doubled),
      snapshot: useSnapshot(state),
    }));
    root.atom[1](3);
    state.nested.count = 2;
    expect(root.atom[0]()).toBe(3);
    expect(root.doubled()).toBe(6);
    expect(root.snapshot().nested.count).toBe(2);
    root.stop();
    state.nested.count = 4;
    expect(root.snapshot().nested.count).toBe(2);
  });

  it("上下文可嵌套，读取 scope 不改变全局信号语义", () => {
    const count = signal(1);
    const scope = createScope();
    scope.set(count, 10);
    createRoot((stop) => {
      ScopeProvider({
        scope,
        get children() {
          expect(useScope()).toBe(scope);
          expect(useScope()?.get(count)).toBe(10);
          expect(useSignal(count)()).toBe(1);
          return null;
        },
      });
      stop();
    });
  });
});
