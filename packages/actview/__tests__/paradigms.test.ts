import { defineComponent, render, unmount, nextTick, renderToString } from "@actview/core";
import { jsx } from "@actview/jsx";
import { expect, it } from "rstack/test";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import { sources } from "./paradigm-sources.js";

it("三种范式更新真实组件，卸载只解绑组件订阅", async () => {
  const source = sources();
  const Component = defineComponent(() => {
    const flux = useFluxStore(source.flux);
    const machine = useMachine(source.machine);
    const observable = useObservable(source.observable);
    return () =>
      jsx("span", {
        children: flux.value + ":" + machine.value.value + ":" + observable.value,
      });
  });
  const container = document.createElement("div");
  const vnode = jsx(Component, {});
  render(vnode, container);
  expect(container.textContent).toBe("1:idle:3");
  expect(source.active()).toBe(3);
  source.update();
  await nextTick();
  expect(container.textContent).toBe("2:done:4");
  unmount(vnode, container);
  expect(source.active()).toBe(0);
  source.events.next(8);
  source.flux.dispatch({ type: "increment" });
  expect(source.observable.get()).toBe(8);
  expect(source.observable.status.get()).toBe("active");
  expect(source.flux.get()).toBe(3);
  source.dispose();
});
it("SSR 读取三种范式而不建立组件订阅", () => {
  const source = sources();
  const Component = defineComponent(() => {
    const flux = useFluxStore(source.flux);
    const machine = useMachine(source.machine);
    const observable = useObservable(source.observable);
    return () =>
      jsx("span", {
        children: flux.value + ":" + machine.value.value + ":" + observable.value,
      });
  });
  expect(renderToString(jsx(Component, {}))).toContain("1:idle:3");
  expect(source.active()).toBe(0);
  source.dispose();
});
