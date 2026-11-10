import { render } from "inferno";
import { createElement as h } from "inferno-create-element";
import { renderToString } from "inferno-server";
import { hydrate } from "inferno-hydrate";
import { expect, it } from "rstack/test";
import { FluxValue } from "../src/flux.js";
import { MachineValue } from "../src/state-machine.js";
import { ObservableValue } from "../src/rxjs.js";
import { createSources, type Sources } from "./new-paradigms.fixture.js";

function node(sources: Sources) {
  return h(
    "output",
    null,
    h(FluxValue<number, { type: "add"; amount: number }>, {
      source: sources.flux,
      children: (value) => h("span", null, value),
    }),
    h(MachineValue<{ count: number }, { type: "advance"; amount: number }, "idle" | "ready">, {
      source: sources.machine,
      children: (snapshot) => h("span", null, `:${snapshot.value}:${snapshot.context.count}`),
    }),
    h(ObservableValue<number>, {
      source: sources.observable,
      children: (value) => h("span", null, `:${value}`),
    }),
  );
}

it("三类 render-prop 组件使用真实状态源，切换和卸载清理订阅", () => {
  const first = createSources();
  const second = createSources(100);
  const container = document.createElement("div");
  render(node(first), container);
  expect(container.textContent).toBe("1:idle:2:3");
  expect(first.subscriptions()).toEqual([1, 1, 1]);
  first.update(10);
  expect(container.textContent).toBe("11:ready:12:13");
  render(node(second), container);
  expect(first.subscriptions()).toEqual([0, 0, 0]);
  expect(second.subscriptions()).toEqual([1, 1, 1]);
  first.update(10);
  expect(container.textContent).toBe("101:idle:102:103");
  second.update(10);
  expect(container.textContent).toBe("111:ready:112:113");
  render(null, container);
  expect(second.subscriptions()).toEqual([0, 0, 0]);
  second.update(20);
  expect(second.flux.get()).toBe(131);
  expect(second.machine.get().context.count).toBe(132);
  expect(second.observable.get()).toBe(123);
  expect(second.subject.observed).toBe(true);
  first.dispose();
  second.dispose();
  expect(second.subject.observed).toBe(false);
});

it("三类组件 SSR 不订阅，hydration 保留 DOM 并继续更新", async () => {
  const server = createSources();
  const client = createSources();
  const container = document.createElement("div");
  container.innerHTML = renderToString(node(server));
  expect(container.textContent).toBe("1:idle:2:3");
  expect(server.subscriptions()).toEqual([0, 0, 0]);
  const original = container.firstElementChild;
  hydrate(node(client), container);
  await Promise.resolve();
  expect(container.firstElementChild).toBe(original);
  client.update(5);
  expect(container.textContent).toBe("6:ready:7:8");
  render(null, container);
  expect(client.subscriptions()).toEqual([0, 0, 0]);
  server.dispose();
  client.dispose();
});
