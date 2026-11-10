import { createElement, renderToString } from "octane/server";
import { expect, it } from "rstack/test";
import { CompiledParadigmsReader } from "./paradigms.fixture.js";
import { createSources } from "./new-paradigms.fixture.js";

it("消费端编译的三个范式 SSR 读取当前快照，不建立组件订阅", () => {
  const sources = createSources();
  sources.update(5);
  const result = renderToString(() => createElement(CompiledParadigmsReader, { sources }));
  expect(result.html.replace(/<!--.*?-->/g, "")).toContain("6:ready:7:8");
  expect(sources.subscriptions()).toEqual([0, 0, 0]);
  expect(sources.subject.observed).toBe(true);
  sources.dispose();
  expect(sources.subject.observed).toBe(false);
});
