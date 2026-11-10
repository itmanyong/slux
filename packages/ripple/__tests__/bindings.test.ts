import { describe, expect, it, rstest } from "rstack/test";
import { effect, flushSync, mount } from "ripple";
import { computed, createScope, signal } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { provideScope, useScopeContext, useSignal } from "../src/index.js";
import { useAtom, useAtomValue } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";
import { CompiledReader } from "./reader.fixture.js";

describe("Ripple bindings", () => {
  it("真实 Ripple 编译组件的 DOM 随 computed 更新", () => {
    const count = signal(1);
    const doubled = computed(() => count.get() * 2);
    const target = document.createElement("div");
    const unmount = mount(() => CompiledReader({ source: doubled }), {
      target,
    });
    flushSync();
    expect(target.textContent).toBe("2");
    flushSync(() => count.set(3));
    expect(target.textContent).toBe("6");
    unmount();
  });
  it("持续刷新 computed，并随原生组件卸载释放订阅", () => {
    const count = signal(1);
    const calculate = rstest.fn(() => count.get() * 2);
    const doubled = computed(calculate);
    const values: number[] = [];
    const target = document.createElement("div");
    const unmount = mount(
      () => {
        const value = useSignal(doubled);
        effect(() => {
          values.push(value.value);
        });
      },
      { target },
    );
    flushSync();
    expect(values.at(-1)).toBe(2);
    flushSync(() => count.set(2));
    expect(values.at(-1)).toBe(4);
    unmount();
    const calls = calculate.mock.calls.length;
    count.set(3);
    flushSync();
    expect(calculate).toHaveBeenCalledTimes(calls);
    expect(values.at(-1)).toBe(4);
  });

  it("atom、store selector 和深层 proxy 都接入 Ripple 响应式", () => {
    const count = atom(1);
    const doubled = derived((get) => get(count) * 2);
    const store = createStore(() => ({ count: 1, other: 0 }));
    const state = observable({ nested: { count: 1 } });
    let write!: (value: number) => void;
    const values: string[] = [];
    const selections: { count: number }[] = [];
    const unmount = mount(
      () => {
        const [value, set] = useAtom(count);
        write = set;
        const double = useAtomValue(doubled);
        const selected = useStore(
          store,
          (s) => ({ count: s.count }),
          (a, b) => a.count === b.count,
        );
        const snap = useSnapshot(state);
        effect(() => {
          selections.push(selected.value);
          values.push(`${value.value}:${double.value}:${selected.value.count}:${snap.value.nested.count}`);
        });
      },
      { target: document.createElement("div") },
    );
    flushSync();
    expect(values.at(-1)).toBe("1:2:1:1");
    const initial = selections.at(-1);
    flushSync(() => store.setState({ other: 2 }));
    expect(selections.at(-1)).toBe(initial);
    flushSync(() => {
      write(3);
      store.setState({ count: 4 });
      state.nested.count = 5;
    });
    expect(values.at(-1)).toBe("3:6:4:5");
    unmount();
  });

  it("客户端保持全局读取，Scope 通过原生 Context 显式提供", () => {
    const count = signal(1);
    const scope = createScope();
    scope.set(count, 100);
    let value = 0;
    const unmount = mount(
      () => {
        provideScope(scope);
        expect(useScopeContext()).toBe(scope);
        const current = useSignal(count);
        effect(() => {
          value = current.value;
        });
      },
      { target: document.createElement("div") },
    );
    flushSync();
    expect(value).toBe(1);
    flushSync(() => count.set(2));
    expect(value).toBe(2);
    unmount();
  });

  it("函数值不会被 track 当作计算执行", () => {
    const callback = rstest.fn(() => 1);
    const source = signal(callback);
    let value: unknown;
    const unmount = mount(
      () => {
        const current = useSignal(source);
        effect(() => {
          value = current.value;
        });
      },
      { target: document.createElement("div") },
    );
    flushSync();
    expect(value).toBe(callback);
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });
});

import { ParadigmReader } from "./paradigms.fixture.js";
import { sources } from "./paradigm-sources.js";

it("三种范式更新真实编译组件，卸载只解绑组件订阅", () => {
  const source = sources();
  const target = document.createElement("div");
  const unmount = mount(() => ParadigmReader({ source }), { target });
  flushSync();
  expect(target.textContent).toBe("1:idle:3");
  expect(source.active()).toBe(3);
  flushSync(() => source.update());
  expect(target.textContent).toBe("2:done:4");
  unmount();
  expect(source.active()).toBe(0);
  source.events.next(8);
  source.flux.dispatch({ type: "increment" });
  expect(source.observable.get()).toBe(8);
  expect(source.observable.status.get()).toBe("active");
  expect(source.flux.get()).toBe(3);
  source.dispose();
});
