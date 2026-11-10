import { expect, it } from "rstack/test";
import { renderToString } from "solid-js/web";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import { createSources } from "./paradigm-fixtures.js";

it("Solid SSR 三范式初值不创建消费订阅", () => {
  const source = createSources();
  const html = renderToString(
    () => `${useFluxStore(source.flux)()}:${useMachine(source.machine)().context}:${useObservable(source.observable)()}`,
  );
  expect(html).toContain("1:2:3");
  expect(source.subscriptions.active).toBe(0);
  expect(source.observable.status.get()).toBe("active");
  source.dispose();
});
