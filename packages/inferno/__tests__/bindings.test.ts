import { Component, render } from "inferno";
import type { InfernoNode, VNode } from "inferno";
import { createElement as h } from "inferno-create-element";
import { renderToString } from "inferno-server";
import { hydrate } from "inferno-hydrate";
import { afterEach, expect, it } from "rstack/test";
import { computed, createScope, signal } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { ScopeProvider, SignalValue, getScope } from "../src/index.js";
import type { ScopeContext } from "../src/index.js";
import { AtomValue, setAtom } from "../src/atom.js";
import { StoreValue } from "../src/store.js";
import { ProxyValue } from "../src/proxy.js";

const containers: HTMLElement[] = [];
function mount(node: VNode) {
  const container = document.createElement("div");
  containers.push(container);
  render(node, container);
  return {
    container,
    rerender: (next: VNode | null) => render(next, container),
    unmount: () => render(null, container),
  };
}
afterEach(() => {
  for (const container of containers.splice(0)) render(null, container);
});
const text = (value: unknown) => h("span", null, String(value));

it("core computed 自动更新、相等值跳过渲染、来源切换和卸载清理", () => {
  const source = signal(1);
  let evaluations = 0;
  const parity = computed(() => {
    evaluations++;
    return source.get() % 2;
  });
  let renders = 0;
  const child = (value: number) => {
    renders++;
    return text(value);
  };
  const view = mount(h(SignalValue<number>, { source: parity, children: child }));
  const before = renders;
  source.set(3);
  expect(renders).toBe(before);
  source.set(4);
  expect(view.container.textContent).toBe("0");
  const other = signal(20);
  view.rerender(h(SignalValue<number>, { source: other, children: child }));
  const switched = evaluations;
  source.set(5);
  expect(evaluations).toBe(switched);
  expect(view.container.textContent).toBe("20");
  view.rerender(h(SignalValue<number>, { source: parity, children: child }));
  view.unmount();
  const stopped = evaluations;
  source.set(6);
  expect(evaluations).toBe(stopped);
});

it("atom 派生值可渲染，写入函数值保持 atom 的替换契约", () => {
  const source = atom(1);
  const double = derived((get) => get(source) * 2);
  const view = mount(h(AtomValue<number>, { atom: double, children: text }));
  setAtom(source, 3);
  expect(view.container.textContent).toBe("6");
  const fn = atom(() => 1);
  const next = () => 2;
  setAtom(fn, next);
  expect(fn.get()).toBe(next);
});

it("store selector 比较器跳过相等值，变更 selector 立即更新", () => {
  const store = createStore(() => ({ left: 1, right: 10, name: "a" }));
  type State = ReturnType<typeof store.getState>;
  let renders = 0;
  const child = (value: { value: number }) => {
    renders++;
    return text(value.value);
  };
  const equals = (a: { value: number }, b: { value: number }) => a.value === b.value;
  const view = mount(
    h(StoreValue<State, { value: number }>, {
      store,
      selector: (state) => ({ value: state.left }),
      equalityFn: equals,
      children: child,
    }),
  );
  const before = renders;
  store.setState({ name: "b" });
  expect(renders).toBe(before);
  store.setState({ left: 2 });
  expect(view.container.textContent).toBe("2");
  view.rerender(
    h(StoreValue<State, { value: number }>, {
      store,
      selector: (state) => ({ value: state.right }),
      equalityFn: equals,
      children: child,
    }),
  );
  expect(view.container.textContent).toBe("10");
  store.setState({ right: 20 });
  expect(view.container.textContent).toBe("20");
  view.unmount();
  store.setState({ right: 30 });
  expect(store.getState().right).toBe(30);
  store.destroy();
});

it("proxy 嵌套变化、不可变快照及来源切换", () => {
  const first = observable({ user: { name: "a" }, stable: { value: 1 } });
  const second = observable({ user: { name: "b" }, stable: { value: 2 } });
  let previous: unknown;
  const child = (value: typeof first) => {
    previous = value;
    return text(value.user.name);
  };
  const view = mount(h(ProxyValue<typeof first>, { proxy: first, children: child }));
  const original = previous as typeof first;
  first.user.name = "c";
  expect(view.container.textContent).toBe("c");
  expect(original.user.name).toBe("a");
  expect((previous as typeof first).stable).toBe(original.stable);
  expect(Object.isFrozen(previous)).toBe(true);
  view.rerender(h(ProxyValue<typeof second>, { proxy: second, children: child }));
  first.user.name = "d";
  expect(view.container.textContent).toBe("b");
  second.user.name = "e";
  expect(view.container.textContent).toBe("e");
});

it("SSR 读取scope覆盖值且不订阅，挂载后读取全局值", async () => {
  const source = signal(1);
  const scope = createScope();
  scope.set(source, 20);
  const node = () => h(ScopeProvider, { scope }, h(SignalValue<number>, { source, children: text }));
  expect(renderToString(node())).toBe("<span>20</span>");
  const view = mount(node());
  // Inferno 在生命周期中排队的更新会在微任务中提交。
  await Promise.resolve();
  expect(view.container.textContent).toBe("1");
  source.set(2);
  expect(view.container.textContent).toBe("2");
  expect(scope.get(source)).toBe(20);
});

it("scope context 可显式读取，SSR 不启动 computed effect", () => {
  const source = signal(1);
  let evaluations = 0;
  const value = computed(() => {
    evaluations++;
    return source.get() * 2;
  });
  const scope = createScope();
  scope.set(source, 20);
  class Scoped extends Component {
    override render(): InfernoNode {
      return text(getScope(this.context as ScopeContext)?.get(source));
    }
  }
  expect(renderToString(h(ScopeProvider, { scope }, h(Scoped)))).toBe("<span>20</span>");
  expect(renderToString(h(SignalValue<number>, { source: value, children: text }))).toBe("<span>2</span>");
  const before = evaluations;
  source.set(2);
  expect(evaluations).toBe(before);
});

it("四种状态 SSR 后 hydration 复用 DOM，并继续更新", async () => {
  const core = signal(1);
  const scope = createScope();
  scope.set(core, 10);
  const a = atom(2);
  const store = createStore(() => ({ count: 3 }));
  const proxy = observable({ count: 4 });
  const node = () =>
    h(
      ScopeProvider,
      { scope },
      h(
        "div",
        null,
        h(SignalValue<number>, { source: core, children: text }),
        h(AtomValue<number>, { atom: a, children: text }),
        h(StoreValue<{ count: number }, number>, {
          store,
          selector: (state) => state.count,
          children: text,
        }),
        h(ProxyValue<typeof proxy>, {
          proxy,
          children: (value) => text(value.count),
        }),
      ),
    );
  const container = document.createElement("div");
  containers.push(container);
  container.innerHTML = renderToString(node());
  expect(container.textContent).toBe("10234");
  const original = container.firstElementChild;
  hydrate(node(), container);
  await Promise.resolve();
  expect(container.firstElementChild).toBe(original);
  expect(container.textContent).toBe("1234");
  core.set(5);
  a.set(6);
  store.setState({ count: 7 });
  proxy.count = 8;
  expect(container.textContent).toBe("5678");
  render(null, container);
  store.destroy();
});
