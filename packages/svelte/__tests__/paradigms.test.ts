import { expect, it } from "rstack/test";
import { get } from "svelte/store";
import { render } from "svelte/server";
import { toFluxStore } from "../src/flux.js";
import { toMachine } from "../src/state-machine.js";
import { toObservableStore } from "../src/rxjs.js";
import { createSources } from "./paradigm-fixtures.js";
import Paradigms from "./Paradigms.svelte";

it("Svelte 三范式 Readable 真实更新，最后退订释放消费订阅并可重连", () => {
  const source = createSources();
  const flux = toFluxStore(source.flux);
  const machine = toMachine(source.machine);
  const observable = toObservableStore(source.observable);
  const values: number[][] = [[], [], []];
  const stops = [
    flux.subscribe((value) => values[0]!.push(value)),
    machine.subscribe((value) => values[1]!.push(value.context)),
    observable.subscribe((value) => values[2]!.push(value)),
  ];
  expect(source.subscriptions.active).toBe(3);
  source.update();
  expect(values).toEqual([
    [1, 11],
    [2, 12],
    [3, 13],
  ]);
  stops.forEach((stop) => stop());
  expect(source.subscriptions.active).toBe(0);
  source.update();
  source.subject.next(23);
  expect(values).toEqual([
    [1, 11],
    [2, 12],
    [3, 13],
  ]);
  expect(get(flux)).toBe(21);
  expect(get(machine).context).toBe(22);
  expect(get(observable)).toBe(23);
  expect(source.subscriptions.active).toBe(0);
  expect(source.observable.status.get()).toBe("active");
  source.dispose();
});

it("真实 Svelte SSR 组件自动订阅三范式并在渲染后清理", () => {
  const source = createSources();
  expect(render(Paradigms, { props: { source } }).body).toContain("1:2:3");
  expect(source.subscriptions.active).toBe(0);
  expect(source.observable.status.get()).toBe("active");
  source.dispose();
});
