import { expect, it } from "rstack/test";
import { createComputed, createRoot } from "solid-js";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import { createSources } from "./paradigm-fixtures.js";

it("Solid 客户端三个范式真实更新、函数访问与 root 清理", () => {
  const source = createSources();
  const values: string[] = [];
  const root = createRoot((stop) => {
    const flux = useFluxStore(source.flux);
    const machine = useMachine(source.machine);
    const observable = useObservable(source.observable);
    createComputed(() => {
      values.push(`${flux()}:${machine().context}:${observable()}`);
    });
    return { stop, flux, machine, observable };
  });
  expect(source.subscriptions.active).toBe(3);
  expect(values[0]).toBe("1:2:3");
  source.update();
  expect(values.at(-1)).toBe("11:12:13");
  root.stop();
  expect(source.subscriptions.active).toBe(0);
  source.update();
  source.subject.next(23);
  expect(root.flux()).toBe(11);
  expect(root.machine().context).toBe(12);
  expect(root.observable()).toBe(13);
  expect(source.flux.get()).toBe(21);
  expect(source.machine.get().context).toBe(22);
  expect(source.observable.get()).toBe(23);
  expect(source.observable.status.get()).toBe("active");
  source.dispose();
});
