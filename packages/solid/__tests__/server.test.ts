import { expect, it } from "rstack/test";
import { renderToString, isServer } from "solid-js/web";
import { signal, createScope } from "@slux/core";
import { ScopeProvider, useScope, useSignal } from "../src/index.js";

it("真实 Solid SSR 不订阅且保留显式 scope 读取", () => {
  expect(isServer).toBe(true);
  const count = signal(1);
  const scope = createScope();
  scope.set(count, 10);
  let subscriptions = 0;
  const source = {
    get: count.get,
    subscribe: () => {
      subscriptions++;
      return () => {
        subscriptions--;
      };
    },
  };
  const html = renderToString(() =>
    ScopeProvider({
      scope,
      get children() {
        return `${useScope()?.get(count)}:${useSignal(source)()}`;
      },
    }),
  );
  expect(html).toContain("10:1");
  expect(subscriptions).toBe(0);
  expect(count.get()).toBe(1);
});
