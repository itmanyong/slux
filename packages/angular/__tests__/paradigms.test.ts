import "@angular/compiler";
import { Component, Injector, createComponent, provideZonelessChangeDetection } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import { expect, it } from "rstack/test";
import { injectFluxStore } from "../src/flux.js";
import { injectMachine } from "../src/state-machine.js";
import { injectObservable } from "../src/rxjs.js";
import { createSources } from "./paradigm-fixtures.js";

it("Angular 三范式使用显式 injector 和 equal，销毁只解除消费订阅", () => {
  const source = createSources();
  const injector = Injector.create({ providers: [] });
  const flux = injectFluxStore(source.flux, {
    injector,
    equal: (previous, next) => previous % 10 === next % 10,
  });
  const machine = injectMachine(source.machine, { injector });
  const observable = injectObservable(source.observable, { injector });
  expect(source.subscriptions.active).toBe(3);
  source.update();
  expect(flux()).toBe(1);
  expect(machine().context).toBe(12);
  expect(observable()).toBe(13);
  injector.destroy();
  expect(source.subscriptions.active).toBe(0);
  source.update();
  source.subject.next(23);
  expect(machine().context).toBe(12);
  expect(observable()).toBe(13);
  expect(source.flux.get()).toBe(21);
  expect(source.machine.get().context).toBe(22);
  expect(source.observable.get()).toBe(23);
  expect(source.observable.status.get()).toBe("active");
  source.dispose();
});

it("真实 Angular 组件渲染三个范式并随更新刷新模板", async () => {
  const source = createSources();
  class Counter {
    readonly flux = injectFluxStore(source.flux);
    readonly machine = injectMachine(source.machine);
    readonly observable = injectObservable(source.observable);
  }
  Component({
    selector: "slux-paradigms",
    standalone: true,
    template: "{{ flux() }}:{{ machine().context }}:{{ observable() }}",
  })(Counter);
  const app = await createApplication({
    providers: [provideZonelessChangeDetection()],
  });
  const host = document.createElement("div");
  const component = createComponent(Counter, {
    environmentInjector: app.injector,
    hostElement: host,
  });
  try {
    app.attachView(component.hostView);
    component.changeDetectorRef.detectChanges();
    expect(host.textContent).toBe("1:2:3");
    source.update();
    await app.whenStable();
    expect(host.textContent).toBe("11:12:13");
    component.destroy();
    expect(source.subscriptions.active).toBe(0);
    expect(source.observable.status.get()).toBe("active");
  } finally {
    app.destroy();
    source.dispose();
  }
});
