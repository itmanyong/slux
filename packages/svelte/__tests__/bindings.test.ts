import { describe, expect, it } from "rstack/test";
import { get, derived as svelteDerived } from "svelte/store";
import { render } from "svelte/server";
import { computed, createScope, signal } from "@slux/core";
import { createStore } from "@slux/store";
import { atom, derived } from "@slux/atom";
import { observable } from "@slux/proxy";
import { getScope, toReadable, toWritable } from "../src/index.js";
import { toStore } from "../src/store.js";
import { toAtom, toAtomValue } from "../src/atom.js";
import { toSnapshot } from "../src/proxy.js";
import ScopeParent from "./ScopeParent.svelte";

describe("Svelte store 契约", () => {
  it("立即发送当前值并接入原生 derived，最后退订停止 computed", () => {
    const count = signal(1);
    let reads = 0;
    const doubled = computed(() => {
      reads++;
      return count.get() * 2;
    });
    const store = toReadable(doubled);
    const values: number[] = [];
    const stop = svelteDerived(store, (value) => value + 1).subscribe((value) => values.push(value));
    count.set(2);
    expect(values).toEqual([3, 5]);
    stop();
    const before = reads;
    count.set(3);
    expect(reads).toBe(before);
    expect(get(store)).toBe(6);
  });

  it("多个订阅共享来源且重新订阅取得最新值", () => {
    let current = 1;
    const callbacks = new Set<(value: number) => void>();
    const store = toReadable({
      get: () => current,
      subscribe(callback) {
        callbacks.add(callback);
        return () => {
          callbacks.delete(callback);
        };
      },
    });
    const first: number[] = [];
    const second: number[] = [];
    const stopA = store.subscribe((value) => first.push(value));
    const stopB = store.subscribe((value) => second.push(value));
    expect(callbacks.size).toBe(1);
    current = 2;
    callbacks.forEach((callback) => callback(current));
    expect(first).toEqual([1, 2]);
    expect(second).toEqual([1, 2]);
    stopA();
    expect(callbacks.size).toBe(1);
    stopB();
    expect(callbacks.size).toBe(0);
    current = 3;
    expect(get(store)).toBe(3);
    expect(callbacks.size).toBe(0);
  });

  it("Writable 的 set/update 支持函数值和不可变对象", () => {
    const original = () => 1;
    const next = () => 2;
    const source = signal(original);
    const store = toWritable(source);
    store.set(next);
    expect(source.get()).toBe(next);
    store.update((previous) => () => previous() + 1);
    expect(source.get()()).toBe(3);
    const object = signal({ count: 1 });
    toWritable(object).update((value) => ({ count: value.count + 1 }));
    expect(object.get()).toEqual({ count: 2 });
  });

  it("store selector 自定义比较器抑制对象选择器的相等结果", () => {
    const store = createStore(() => ({ count: 1, other: 0 }));
    const selected = toStore(
      store,
      (state) => ({ count: state.count }),
      (a, b) => a.count === b.count,
    );
    const values: number[] = [];
    const stop = selected.subscribe((value) => values.push(value.count));
    store.setState({ other: 1 });
    store.setState({ count: 2 });
    expect(values).toEqual([1, 2]);
    stop();
    store.destroy();
  });

  it("atom、派生 atom 与 proxy 桥接并清理", () => {
    const count = atom(1);
    const doubled = derived((read) => read(count) * 2);
    const writable = toAtom(count);
    const values: number[] = [];
    const stop = toAtomValue(doubled).subscribe((value) => values.push(value));
    writable.set(2);
    writable.update((value) => value + 1);
    expect(values).toEqual([2, 4, 6]);
    stop();
    const state = observable({ nested: { count: 1 } });
    const snapshots: number[] = [];
    const stopProxy = toSnapshot(state).subscribe((value) => snapshots.push(value.nested.count));
    state.nested.count = 2;
    stopProxy();
    state.nested.count = 3;
    expect(snapshots).toEqual([1, 2]);
  });

  it("真实编译的 Svelte SSR 组件传播 scope 并清理自动订阅", () => {
    const count = signal(1);
    let subscriptions = 0;
    const source = {
      ...count,
      subscribe(callback: (value: number) => void) {
        subscriptions++;
        const stop = count.subscribe(callback);
        return () => {
          subscriptions--;
          stop();
        };
      },
    };
    const scope = createScope();
    scope.set(source, 10);
    const result = render(ScopeParent, { props: { scope, source } });
    expect(result.body).toContain("10:1");
    expect(subscriptions).toBe(0);
    expect(source.get()).toBe(1);
  });

  it("上下文只能在组件初始化时读取", () => {
    expect(() => getScope()).toThrow();
  });
});
