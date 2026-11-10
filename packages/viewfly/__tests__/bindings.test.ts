import { describe, it, expect } from "rstack/test";
import { jsx, nextTick, viewfly } from "@viewfly/core";
import { createApp, HTMLRenderer, OutputTranslator, VDOMElement } from "@viewfly/platform-browser";
import { signal, computed, createScope } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { useSignal, ScopeProvider, useScope } from "../src/index.js";
import { useAtom, useAtomValue } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";

async function mount(setup: () => () => string) {
  const container = document.createElement("div");
  document.body.append(container);
  function Component() {
    const value = setup();
    return () => jsx("span", { children: value() });
  }
  const app = createApp(jsx(Component, {}), false).mount(container);
  await Promise.resolve();
  app.render();
  return {
    container,
    app,
    destroy() {
      app.destroy();
      container.remove();
    },
  };
}
describe("Viewfly bindings", () => {
  it("updates the DOM with the default automatic scheduler", async () => {
    const source = signal(1);
    function Component() {
      const read = useSignal(source);
      return () => jsx("span", { children: read() });
    }
    const container = document.createElement("div");
    const app = createApp(jsx(Component, {})).mount(container);
    await nextTick();
    source.set(5);
    await nextTick();
    expect(container.textContent).toBe("5");
    app.destroy();
    await nextTick();
  });
  it("does not subscribe after a one-shot HTML render is destroyed", async () => {
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
    function Component() {
      const read = useSignal(source);
      return () => jsx("span", { children: read() });
    }
    const container = new VDOMElement("div");
    const app = viewfly({
      root: jsx(Component, {}),
      nativeRenderer: new HTMLRenderer(),
      autoUpdate: false,
    }).mount(container);
    expect(new OutputTranslator().transform(container)).toContain("7");
    app.destroy();
    await Promise.resolve();
    expect(subscriptions).toBe(0);
  });
  it("renders lazy computed updates and cleans up on destroy", async () => {
    const source = signal(1);
    let reads = 0;
    const doubled = computed(() => {
      reads++;
      return source.get() * 2;
    });
    const ui = await mount(() => {
      const value = useSignal(doubled);
      return () => String(value());
    });
    expect(ui.container.textContent).toBe("2");
    source.set(3);
    ui.app.render();
    expect(ui.container.textContent).toBe("6");
    const before = reads;
    ui.destroy();
    source.set(4);
    expect(reads).toBe(before);
  });
  it("supports plain external subscriptions and closes the setup-to-mount gap", async () => {
    let current = 1;
    let listener: ((v: number) => void) | undefined;
    const source = {
      get: () => current,
      subscribe(fn: (v: number) => void) {
        listener = fn;
        return () => {
          listener = undefined;
        };
      },
    };
    let read!: () => number;
    const ui = await mount(() => {
      read = useSignal(source);
      current = 2;
      return () => String(read());
    });
    expect(read()).toBe(2);
    ui.app.render();
    expect(ui.container.textContent).toBe("2");
    current = 3;
    listener?.(3);
    ui.app.render();
    expect(ui.container.textContent).toBe("3");
    ui.destroy();
    expect(listener).toBeUndefined();
  });
  it("reads and writes atoms, including derived atoms", async () => {
    const count = atom(1);
    const doubled = derived((get) => get(count) * 2);
    let set!: (v: number) => void;
    const ui = await mount(() => {
      const [value, write] = useAtom(count);
      set = write;
      const twice = useAtomValue(doubled);
      return () => value() + ":" + twice();
    });
    set(4);
    ui.app.render();
    expect(ui.container.textContent).toBe("4:8");
    ui.destroy();
  });
  it("preserves function-valued atoms", async () => {
    const fn = () => 1;
    const next = () => 2;
    const count = atom(fn);
    let read!: () => () => number;
    let set!: (v: () => number) => void;
    const ui = await mount(() => {
      [read, set] = useAtom(count);
      return () => String(read()());
    });
    set(next);
    expect(read()).toBe(next);
    ui.destroy();
  });
  it("keeps equal selections stable", async () => {
    const store = createStore(() => ({ count: 1, other: 0 }));
    let read!: () => { count: number };
    const ui = await mount(() => {
      read = useStore(
        store,
        (s) => ({ count: s.count }),
        (a, b) => a.count === b.count,
      );
      return () => String(read().count);
    });
    const first = read();
    store.setState({ other: 1 });
    expect(read()).toBe(first);
    store.setState({ count: 2 });
    ui.app.render();
    expect(ui.container.textContent).toBe("2");
    ui.destroy();
  });
  it("renders nested proxy snapshots with structural sharing", async () => {
    const proxy = observable({ nested: { count: 1 }, other: { value: 2 } });
    let read!: () => Snapshot<typeof proxy>;
    const ui = await mount(() => {
      read = useSnapshot(proxy);
      return () => String(read().nested.count);
    });
    const first = read();
    proxy.nested.count = 3;
    ui.app.render();
    expect(ui.container.textContent).toBe("3");
    expect(read().other).toBe(first.other);
    expect(Object.isFrozen(read())).toBe(true);
    ui.destroy();
  });
  it("provides core Scope without changing global reads", async () => {
    const source = signal(1);
    const scope = createScope();
    scope.set(source, 9);
    let received: unknown;
    function Child() {
      received = useScope();
      const value = useSignal(source);
      return () => jsx("span", { children: value() });
    }
    const container = document.createElement("div");
    const app = createApp(jsx(ScopeProvider, { useValue: scope, children: jsx(Child, {}) }), false).mount(container);
    expect(received).toBe(scope);
    expect(container.textContent).toBe("1");
    app.destroy();
  });
});
