import { expect, it, rstest } from "rstack/test";
import { render } from "ripple/server";
import { createScope, signal } from "@slux/core";
import { atom } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { provideScope, useSignal } from "../src/server.js";
import { useAtomValue } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";
import { CompiledReader } from "./reader.fixture.js";

it("Ripple 编译组件的服务端模板读取 Scope", async () => {
  const source = signal(1);
  const scope = createScope();
  scope.set(source, 42);
  const result = await render(() => CompiledReader({ source, scope }));
  expect(result.body.replace(/<!--.*?-->/g, "")).toContain(">42</output>");
});

it("Ripple SSR 读取显式 Scope，各范式不建立订阅", async () => {
  const count = signal(1);
  const scope = createScope();
  scope.set(count, 42);
  const subscribe = rstest.spyOn(count, "subscribe");
  const a = atom(2);
  const atomSubscribe = rstest.spyOn(a, "subscribe");
  const store = createStore(() => ({ count: 3 }));
  const storeSubscribe = rstest.spyOn(store, "subscribe");
  const state = observable({ count: 4 });
  const result = await render(() => {
    provideScope(scope);
    return `${useSignal(count).value}:${useAtomValue(a).value}:${useStore(store).value.count}:${useSnapshot(state).value.count}`;
  });
  expect(result.body).toContain("42:2:3:4");
  expect(subscribe).not.toHaveBeenCalled();
  expect(atomSubscribe).not.toHaveBeenCalled();
  expect(storeSubscribe).not.toHaveBeenCalled();
  expect(count.get()).toBe(1);
});

import { ParadigmReader } from "./paradigms.fixture.js";
import { sources } from "./paradigm-sources.js";

it("三种范式的真实编译组件 SSR 不建立组件订阅", async () => {
  const source = sources();
  const result = await render(() => ParadigmReader({ source }));
  expect(result.body.replace(/<!--.*?-->/g, "")).toContain("1:idle:3");
  expect(source.active()).toBe(0);
  source.dispose();
});
