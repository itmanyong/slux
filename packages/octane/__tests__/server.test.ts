import { expect, it, rstest } from "rstack/test";
import { createElement, renderToString } from "octane/server";
import { createScope, signal } from "@slux/core";
import { atom } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { ScopeProvider, useSignal } from "../src/index.js";
import { useAtomValue } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";
import { CompiledReader } from "./reader.fixture.js";

it("消费端编译的 SSR 组件通过发布源码入口读取 Scope", () => {
  const first = signal(1);
  const second = signal(2);
  const store = createStore(() => ({ count: 3 }));
  const scope = createScope();
  scope.set(first, 42);
  const subscribe = rstest.spyOn(first, "subscribe");
  const result = renderToString(() =>
    createElement(ScopeProvider, {
      scope,
      children: createElement(CompiledReader, { first, second, store }),
    }),
  );
  expect(result.html.replace(/<!--.*?-->/g, "")).toContain("42:2:3:3:3");
  expect(subscribe).not.toHaveBeenCalled();
});

it("Octane SSR 读取显式 Scope，各范式不建立订阅", () => {
  const count = signal(1);
  const scope = createScope();
  scope.set(count, 42);
  const subscribe = rstest.spyOn(count, "subscribe");
  const a = atom(2);
  const atomSubscribe = rstest.spyOn(a, "subscribe");
  const store = createStore(() => ({ count: 3 }));
  const storeSubscribe = rstest.spyOn(store, "subscribe");
  const state = observable({ count: 4 });
  function Reader() {
    return createElement(
      "output",
      null,
      `${useSignal(count, Symbol.for("signal"))}:${useAtomValue(a, Symbol.for("atom"))}:${useStore(store, Symbol.for("store")).count}:${useSnapshot(state, Symbol.for("proxy")).count}`,
    );
  }
  const result = renderToString(() => createElement(ScopeProvider, { scope, children: createElement(Reader) }));
  expect(result.html).toContain("42:2:3:4");
  expect(subscribe).not.toHaveBeenCalled();
  expect(atomSubscribe).not.toHaveBeenCalled();
  expect(storeSubscribe).not.toHaveBeenCalled();
  expect(count.get()).toBe(1);
});
