import { expect, it } from "rstack/test";
import { createApp, createSSRApp, defineComponent, h, nextTick } from "vue";
import { renderToString } from "@vue/server-renderer";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import { createSources } from "./paradigm-fixtures.js";

it("Vue 组件消费三个真实范式，更新后卸载只释放消费订阅", async () => {
  const source = createSources();
  const App = defineComponent({
    setup() {
      const flux = useFluxStore(source.flux);
      const machine = useMachine(source.machine);
      const observable = useObservable(source.observable);
      return () => h("span", `${flux.value}:${machine.value.context}:${observable.value}`);
    },
  });
  const container = document.createElement("div");
  const app = createApp(App);
  app.mount(container);
  expect(container.textContent).toBe("1:2:3");
  expect(source.subscriptions.active).toBe(3);
  source.update();
  await nextTick();
  expect(container.textContent).toBe("11:12:13");
  app.unmount();
  expect(source.subscriptions.active).toBe(0);
  source.update();
  expect(source.flux.get()).toBe(21);
  expect(source.machine.get().context).toBe(22);
  source.subject.next(23);
  expect(source.observable.get()).toBe(23);
  expect(source.observable.status.get()).toBe("active");
  source.dispose();
});

it("Vue SSR 读取三个范式初值而不创建消费订阅", async () => {
  const source = createSources();
  const App = defineComponent({
    setup() {
      const flux = useFluxStore(source.flux);
      const machine = useMachine(source.machine);
      const observable = useObservable(source.observable);
      return () => h("span", `${flux.value}:${machine.value.context}:${observable.value}`);
    },
  });
  expect(await renderToString(createSSRApp(App))).toContain("1:2:3");
  expect(source.subscriptions.active).toBe(0);
  expect(source.observable.status.get()).toBe("active");
  source.dispose();
});
