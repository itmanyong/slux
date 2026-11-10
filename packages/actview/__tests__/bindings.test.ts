import { effectScope as frameworkScope } from "actview";
import { renderToString, defineComponent, render, unmount, nextTick } from "@actview/core";
import { jsx } from "@actview/jsx";
import { describe, it, expect } from "rstack/test";
import { signal, computed, createScope } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { useSignal, provideScope, useScope } from "../src/index.js";
import { useAtom, useAtomValue } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";

describe("actview bindings", () => {
  it("renders on the server without opening subscriptions", async () => {
    let subscriptions = 0;
    const source = {
      get: () => 7,
      subscribe() {
        subscriptions++;
        return () => {
          subscriptions--;
        };
      },
    };
    const Component = defineComponent(() => {
      const value = useSignal(source);
      return () => jsx("span", { children: value.value });
    });
    const html = renderToString(jsx(Component, {}));
    expect(html).toContain("7");
    expect(subscriptions).toBe(0);
  });

  it("tracks lazy computed and releases it with the native scope", () => {
    const scope = frameworkScope();
    const source = signal(1);
    let reads = 0;
    const doubled = computed(() => {
      reads++;
      return source.get() * 2;
    });
    const value = scope.run(() => useSignal(doubled))!;
    expect(value.value).toBe(2);
    source.set(3);
    expect(value.value).toBe(6);
    const before = reads;
    scope.stop();
    source.set(4);
    expect(reads).toBe(before);
    expect(value.value).toBe(6);
  });
  it("subscribes to external sources without core dependencies and cleans up", () => {
    const scope = frameworkScope();
    let current = 1;
    let listener: ((value: number) => void) | undefined;
    const source: Subscribable<number> = {
      get: () => current,
      subscribe(fn) {
        listener = fn;
        return () => {
          listener = undefined;
        };
      },
    };
    const value = scope.run(() => useSignal(source))!;
    current = 2;
    listener?.(2);
    expect(value.value).toBe(2);
    scope.stop();
    expect(listener).toBeUndefined();
  });
  it("bridges atoms, derived values and writes to the original atom", () => {
    const scope = frameworkScope();
    const count = atom(1);
    const twice = derived((get) => get(count) * 2);
    const [value, set] = scope.run(() => useAtom(count))!;
    const doubled = scope.run(() => useAtomValue(twice))!;
    set(5);
    expect(value.value).toBe(5);
    expect(doubled.value).toBe(10);
    scope.stop();
  });
  it("preserves function-valued atoms", () => {
    const scope = frameworkScope();
    const first = () => 1;
    const second = () => 2;
    const count = atom(first);
    const [value, set] = scope.run(() => useAtom(count))!;
    set(second);
    expect(value.value).toBe(second);
    scope.stop();
  });
  it("retains selector identity for equal values", () => {
    const scope = frameworkScope();
    const store = createStore(() => ({ count: 1, other: 0 }));
    const selected = scope.run(() =>
      useStore(
        store,
        (s) => ({ count: s.count }),
        (a, b) => a.count === b.count,
      ),
    )!;
    const first = selected.value;
    store.setState({ other: 1 });
    expect(selected.value).toBe(first);
    store.setState({ count: 2 });
    expect(selected.value).toEqual({ count: 2 });
    scope.stop();
  });
  it("publishes frozen nested proxy snapshots and preserves untouched branches", () => {
    const scope = frameworkScope();
    const proxy = observable({ nested: { count: 1 }, other: { value: 2 } });
    const value = scope.run(() => useSnapshot(proxy))!;
    const first = value.value;
    proxy.nested.count = 3;
    expect(value.value.nested.count).toBe(3);
    expect(value.value.other).toBe(first.other);
    expect(Object.isFrozen(value.value)).toBe(true);
    scope.stop();
  });
  it("requires a native scope rather than leaking a subscription", () => {
    expect(() => useSignal(signal(0))).toThrow("effect scope");
  });
  it("updates a real component and disposes its subscription on unmount", async () => {
    const source = signal(1);
    let active = 0;
    const wrapped = {
      get: () => source.get(),
      subscribe(fn: (value: number) => void) {
        active++;
        const stop = source.subscribe(fn);
        return () => {
          active--;
          stop();
        };
      },
    };
    const scope = createScope();
    scope.set(source, 9);
    let received: unknown;
    const container = document.createElement("div");
    document.body.append(container);
    const Child = defineComponent(() => {
      received = useScope();
      const value = useSignal(wrapped);
      return () => jsx("span", { children: value.value });
    });
    const Parent = defineComponent(() => {
      provideScope(scope);
      return () => jsx(Child, {});
    });
    const vnode = jsx(Parent, {});
    render(vnode, container);
    expect(received).toBe(scope);
    expect(container.textContent).toBe("1");
    expect(active).toBe(1);
    source.set(3);
    await nextTick();
    expect(container.textContent).toBe("3");
    unmount(vnode, container);
    expect(active).toBe(0);
    container.remove();
  });
});
