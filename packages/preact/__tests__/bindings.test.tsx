import { createElement, hydrate, render } from "preact";
import { useLayoutEffect } from "preact/hooks";
import type { ComponentChild } from "preact";
import { act } from "preact/test-utils";
import { renderToString } from "preact-render-to-string";
import { afterEach, expect, it } from "rstack/test";
import { computed, createScope, signal } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { ScopeProvider, useScopeContext, useSignal } from "../src/index.js";
import { useAtom, useAtomValue } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";

const containers: HTMLElement[] = [];
function mount(node: ComponentChild) {
  const container = document.createElement("div");
  containers.push(container);
  const rerender = (next: ComponentChild) => act(() => render(next, container));
  rerender(node);
  return { container, rerender, unmount: () => rerender(null) };
}
afterEach(() => {
  for (const container of containers.splice(0)) act(() => render(null, container));
});

it("computed 自动刷新，相等值不渲染，切换和卸载释放 effect", () => {
  const count = signal(1);
  let evaluations = 0;
  const parity = computed(() => {
    evaluations++;
    return count.get() % 2;
  });
  let renders = 0;
  function Value({ source }: { source: Subscribable<number> }) {
    renders++;
    return <span>{useSignal(source)}</span>;
  }
  const view = mount(<Value source={parity} />);
  const before = renders;
  act(() => count.set(3));
  expect(renders).toBe(before);
  act(() => count.set(4));
  expect(view.container.textContent).toBe("0");
  const other = signal(20);
  view.rerender(<Value source={other} />);
  const after = evaluations;
  act(() => count.set(5));
  expect(evaluations).toBe(after);
  expect(view.container.textContent).toBe("20");
  view.rerender(<Value source={parity} />);
  view.unmount();
  const stopped = evaluations;
  count.set(6);
  expect(evaluations).toBe(stopped);
});

it("atom 支持派生值、稳定 setter 和函数值替换", () => {
  const count = atom(1);
  const double = derived((get) => get(count) * 2);
  const callback = atom<() => number>(() => 1);
  let setter: ((value: number) => void) | undefined;
  let setCallback: ((value: () => number) => void) | undefined;
  function Value() {
    const [value, set] = useAtom(count);
    const [fn, update] = useAtom(callback);
    setter = set;
    setCallback = update;
    return (
      <span>
        {value}:{useAtomValue(double)}:{fn()}
      </span>
    );
  }
  const view = mount(<Value />);
  const initial = setter;
  const fn = () => 4;
  act(() => {
    setter!(3);
    setCallback!(fn);
  });
  expect(setter).toBe(initial);
  expect(callback.get()).toBe(fn);
  expect(view.container.textContent).toBe("3:6:4");
});

it("store selector 和比较器更新不会保留过期选值", () => {
  const store = createStore(() => ({ left: 1, right: 10, label: "a" }));
  const selector = (state: { left: number }) => ({ value: state.left });
  const equals = (a: { value: number }, b: { value: number }) => a.value === b.value;
  let renders = 0;
  function Selected() {
    renders++;
    return <span>{useStore(store, selector, equals).value}</span>;
  }
  const view = mount(<Selected />);
  const before = renders;
  act(() => store.setState({ label: "b" }));
  expect(renders).toBe(before);
  act(() => store.setState({ left: 2 }));
  expect(view.container.textContent).toBe("2");
  function Value({ field }: { field: "left" | "right" }) {
    return <span>{useStore(store, (state) => ({ value: state[field] })).value}</span>;
  }
  view.rerender(<Value field="left" />);
  view.rerender(<Value field="right" />);
  expect(view.container.textContent).toBe("10");
  view.unmount();
  store.destroy();
});

it("proxy 嵌套更新、来源切换和不可变快照", () => {
  const first = observable({ user: { name: "a" }, other: { value: 1 } });
  const second = observable({ user: { name: "b" }, other: { value: 2 } });
  let current: ReturnType<typeof useSnapshot<typeof first>> | undefined;
  function Value({ source }: { source: typeof first }) {
    current = useSnapshot(source);
    return <span>{current.user.name}</span>;
  }
  const view = mount(<Value source={first} />);
  const previous = current!;
  act(() => {
    first.user.name = "c";
  });
  expect(view.container.textContent).toBe("c");
  expect(previous.user.name).toBe("a");
  expect(current!.other).toBe(previous.other);
  expect(Object.isFrozen(current)).toBe(true);
  view.rerender(<Value source={second} />);
  act(() => {
    first.user.name = "d";
  });
  expect(view.container.textContent).toBe("b");
});

it("SSR 读取当前值且不启动 computed 订阅，scope 通过显式 get 隔离", () => {
  const source = signal(1);
  let evaluations = 0;
  const value = computed(() => {
    evaluations++;
    return source.get() * 2;
  });
  const scope = createScope();
  scope.set(source, 20);
  function Value() {
    const injected = useScopeContext();
    return (
      <span>
        {useSignal(value)}:{injected?.get(source)}
      </span>
    );
  }
  expect(renderToString(createElement(ScopeProvider, { scope }, createElement(Value, {})))).toBe("<span>2:20</span>");
  const before = evaluations;
  source.set(2);
  expect(evaluations).toBe(before);
  expect(source.get()).toBe(2);
});

it("scope 服务端快照用于 hydration，挂载后跟随全局值", () => {
  const source = signal(1);
  const scope = createScope();
  scope.set(source, 20);
  const values: number[] = [];
  function Value() {
    const value = useSignal(source);
    values.push(value);
    return <span>{value}</span>;
  }
  const node = (
    <ScopeProvider scope={scope}>
      <Value />
    </ScopeProvider>
  );
  const container = document.createElement("div");
  containers.push(container);
  container.innerHTML = renderToString(node);
  expect(container.textContent).toBe("20");
  values.length = 0;
  act(() => hydrate(node, container));
  expect(values[0]).toBe(20);
  expect(container.textContent).toBe("1");
  act(() => source.set(2));
  expect(container.textContent).toBe("2");
});

it("渲染到订阅间的更新不会丢失", () => {
  const source = signal(1);
  function Child() {
    useLayoutEffect(() => source.set(2), []);
    return null;
  }
  function Value() {
    const value = useSignal(source);
    return (
      <span>
        {value}
        <Child />
      </span>
    );
  }
  expect(mount(<Value />).container.textContent).toBe("2");
});

it("atom、store、proxy SSR hydration 后继续跟随各自状态", () => {
  const a = atom(2);
  const store = createStore(() => ({ count: 3 }));
  const proxy = observable({ count: 4 });
  function Value() {
    return (
      <span>
        {useAtomValue(a)}:{useStore(store).count}:{useSnapshot(proxy).count}
      </span>
    );
  }
  const container = document.createElement("div");
  containers.push(container);
  container.innerHTML = renderToString(<Value />);
  expect(container.textContent).toBe("2:3:4");
  const original = container.firstElementChild;
  act(() => hydrate(<Value />, container));
  expect(container.firstElementChild).toBe(original);
  act(() => {
    a.set(5);
    store.setState({ count: 6 });
    proxy.count = 7;
  });
  expect(container.textContent).toBe("5:6:7");
  act(() => render(null, container));
  store.destroy();
});
