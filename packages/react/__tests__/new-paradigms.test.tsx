import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { render } from "./render.js";
import { expect, it } from "rstack/test";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import { createSources, type Sources } from "./new-paradigms.fixture.js";

function Reader({ sources }: { sources: Sources }) {
  const state = useFluxStore(sources.flux);
  const snapshot = useMachine(sources.machine);
  const value = useObservable(sources.observable);
  return <output>{`${state}:${snapshot.value}:${snapshot.context.count}:${value}`}</output>;
}

it("三个真实范式持续更新，切换来源与卸载释放组件订阅，所有权保留给创建者", () => {
  const first = createSources();
  const second = createSources(100);
  const view = render(<Reader sources={first} />);
  expect(view.container.textContent).toBe("1:idle:2:3");
  expect(first.subscriptions()).toEqual([1, 1, 1]);
  act(() => first.update(10));
  expect(view.container.textContent).toBe("11:ready:12:13");
  view.rerender(<Reader sources={second} />);
  expect(first.subscriptions()).toEqual([0, 0, 0]);
  expect(second.subscriptions()).toEqual([1, 1, 1]);
  act(() => first.update(10));
  expect(view.container.textContent).toBe("101:idle:102:103");
  act(() => second.update(10));
  expect(view.container.textContent).toBe("111:ready:112:113");
  view.unmount();
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

it("三个子入口 SSR 不订阅，匹配数据 hydration 后继续更新", async () => {
  const server = createSources();
  const client = createSources();
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Reader sources={server} />);
  expect(container.textContent).toBe("1:idle:2:3");
  expect(server.subscriptions()).toEqual([0, 0, 0]);
  const original = container.firstElementChild;
  let root: ReturnType<typeof hydrateRoot> | undefined;
  const errors: unknown[] = [];
  await act(async () => {
    root = hydrateRoot(container, <Reader sources={client} />, {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  expect(errors).toEqual([]);
  expect(container.firstElementChild).toBe(original);
  act(() => client.update(5));
  expect(container.textContent).toBe("6:ready:7:8");
  act(() => root?.unmount());
  expect(client.subscriptions()).toEqual([0, 0, 0]);
  server.dispose();
  client.dispose();
});
