import { jsx, nextTick, viewfly } from "@viewfly/core";
import { createApp, HTMLRenderer, OutputTranslator, VDOMElement } from "@viewfly/platform-browser";
import { expect, it } from "rstack/test";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import { sources } from "./paradigm-sources.js";

it("三种范式更新真实组件，卸载只解绑组件订阅", async () => {
  const source = sources();
  function Component() {
    const flux = useFluxStore(source.flux);
    const machine = useMachine(source.machine);
    const observable = useObservable(source.observable);
    return () =>
      jsx("span", {
        children: flux() + ":" + machine().value + ":" + observable(),
      });
  }
  const container = document.createElement("div");
  const app = createApp(jsx(Component, {})).mount(container);
  await nextTick();
  expect(container.textContent).toBe("1:idle:3");
  expect(source.active()).toBe(3);
  source.update();
  await nextTick();
  expect(container.textContent).toBe("2:done:4");
  app.destroy();
  await nextTick();
  expect(source.active()).toBe(0);
  source.events.next(8);
  source.flux.dispatch({ type: "increment" });
  expect(source.observable.get()).toBe(8);
  expect(source.observable.status.get()).toBe("active");
  expect(source.flux.get()).toBe(3);
  source.dispose();
});
it("一次性 HTML 渲染读取三种范式而不遗留订阅", async () => {
  const source = sources();
  function Component() {
    const flux = useFluxStore(source.flux);
    const machine = useMachine(source.machine);
    const observable = useObservable(source.observable);
    return () =>
      jsx("span", {
        children: flux() + ":" + machine().value + ":" + observable(),
      });
  }
  const container = new VDOMElement("div");
  const app = viewfly({
    root: jsx(Component, {}),
    nativeRenderer: new HTMLRenderer(),
    autoUpdate: false,
  }).mount(container);
  expect(new OutputTranslator().transform(container)).toContain("1:idle:3");
  app.destroy();
  await Promise.resolve();
  expect(source.active()).toBe(0);
  source.dispose();
});
