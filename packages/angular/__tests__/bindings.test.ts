import "@angular/compiler";
import { Component, Injector, createComponent, isSignal, provideZonelessChangeDetection, runInInjectionContext } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import { Observable, Subject, of, take } from "rxjs";
import { afterEach, expect, it } from "rstack/test";
import { computed, createScope, signal } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { SLUX_SCOPE, fromObservable, injectScope, provideSluxScope, toAngularSignal, toObservable } from "../src/index.js";
import { injectAtom, injectAtomValue } from "../src/atom.js";
import { injectStore } from "../src/store.js";
import { injectSnapshot } from "../src/proxy.js";

const injectors: ReturnType<typeof Injector.create>[] = [];
function context<T>(fn: () => T) {
  const injector = Injector.create({ providers: [] });
  injectors.push(injector);
  return {
    value: runInInjectionContext(injector, fn),
    destroy: () => {
      injector.destroy();
      injectors.splice(injectors.indexOf(injector), 1);
    },
  };
}
afterEach(() => {
  for (const injector of injectors.splice(0)) injector.destroy();
});

it("Angular Signal 主动刷新 core computed，销毁 injector 后释放 effect", () => {
  const source = signal(1);
  let evaluations = 0;
  const double = computed(() => {
    evaluations++;
    return source.get() * 2;
  });
  const view = context(() => toAngularSignal(double));
  expect(isSignal(view.value)).toBe(true);
  expect(view.value()).toBe(2);
  source.set(3);
  expect(view.value()).toBe(6);
  view.destroy();
  const before = evaluations;
  source.set(4);
  expect(evaluations).toBe(before);
  expect(view.value()).toBe(6);
});

it("显式 injector 可在注入上下文外创建桥接", () => {
  const injector = Injector.create({ providers: [] });
  injectors.push(injector);
  const source = signal(1);
  const result = toAngularSignal(source, { injector });
  source.set(2);
  expect(result()).toBe(2);
});

it("toObservable 同步首值、computed 更新与退订", () => {
  const source = signal(1);
  let evaluations = 0;
  const value = computed(() => {
    evaluations++;
    return source.get() * 2;
  });
  const values: number[] = [];
  const subscription = toObservable(value).subscribe((next) => values.push(next));
  source.set(2);
  expect(values).toEqual([2, 4]);
  subscription.unsubscribe();
  const before = evaluations;
  source.set(3);
  expect(evaluations).toBe(before);
  toObservable(value).pipe(take(1)).subscribe();
  const stopped = evaluations;
  source.set(4);
  expect(evaluations).toBe(stopped);
});

it("fromObservable 引用计数、同步首值和重连符合 core 订阅契约", () => {
  const subject = new Subject<number>();
  let starts = 0;
  let stops = 0;
  const source = new Observable<number>((subscriber) => {
    starts++;
    subscriber.next(10);
    const sub = subject.subscribe(subscriber);
    return () => {
      stops++;
      sub.unsubscribe();
    };
  });
  const bridge = fromObservable(source, 0);
  const values: number[] = [];
  expect(bridge.get()).toBe(0);
  const a = bridge.subscribe((value) => values.push(value));
  const b = bridge.subscribe(() => {});
  expect(bridge.get()).toBe(10);
  expect(values).toEqual([]);
  subject.next(20);
  expect(values).toEqual([20]);
  a();
  expect(stops).toBe(0);
  b();
  expect(stops).toBe(1);
  const c = bridge.subscribe(() => {});
  expect(starts).toBe(2);
  c();
  const sync = context(() => toAngularSignal(fromObservable(of(42), 0)));
  expect(sync.value()).toBe(42);
});

it("atom 绑定支持函数值替换和派生结果", () => {
  const source = atom(1);
  const double = derived((get) => get(source) * 2);
  const fn = atom<() => number>(() => 1);
  const view = context(() => ({
    pair: injectAtom(fn),
    value: injectAtomValue(double),
  }));
  const next = () => 3;
  view.value.pair[1](next);
  source.set(2);
  expect(view.value.pair[0]()).toBe(next);
  expect(view.value.value()).toBe(4);
});

it("store selector 比较器保持相等选值引用，卸载不销毁 store", () => {
  const store = createStore(() => ({ count: 1, name: "a" }));
  const view = context(() =>
    injectStore(store, (state) => ({ value: state.count }), {
      equal: (a, b) => a.value === b.value,
    }),
  );
  const before = view.value();
  store.setState({ name: "b" });
  expect(view.value()).toBe(before);
  store.setState({ count: 2 });
  expect(view.value()).toEqual({ value: 2 });
  view.destroy();
  store.setState({ count: 3 });
  expect(view.value()).toEqual({ value: 2 });
  expect(store.getState().count).toBe(3);
  store.destroy();
});

it("proxy 快照更新保留旧快照和未变分支", () => {
  const source = observable({ user: { name: "a" }, stable: { value: 1 } });
  const view = context(() => injectSnapshot(source));
  const before = view.value();
  source.user.name = "b";
  expect(view.value().user.name).toBe("b");
  expect(before.user.name).toBe("a");
  expect(view.value().stable).toBe(before.stable);
  expect(Object.isFrozen(view.value())).toBe(true);
});

it("scope 注入保持显式 get/set，不重定向全局 signal", () => {
  const source = signal(1);
  const scope = createScope();
  scope.set(source, 20);
  const injector = Injector.create({
    providers: [{ provide: SLUX_SCOPE, useValue: scope }],
  });
  injectors.push(injector);
  runInInjectionContext(injector, () => {
    expect(injectScope()).toBe(scope);
    expect(injectScope()!.get(source)).toBe(20);
    expect(toAngularSignal(source)()).toBe(1);
  });
  expect(context(() => injectScope()).value).toBeUndefined();
});

it("真实 Angular 组件模板更新四种状态，组件销毁释放订阅", async () => {
  const core = signal(1);
  let evaluations = 0;
  const double = computed(() => {
    evaluations++;
    return core.get() * 2;
  });
  const source = atom(2);
  const store = createStore(() => ({ count: 3 }));
  const proxy = observable({ count: 4 });
  const scope = createScope();
  scope.set(core, 10);
  class Counter {
    readonly core = toAngularSignal(double);
    readonly atom = injectAtomValue(source);
    readonly store = injectStore(store, (state) => state.count);
    readonly proxy = injectSnapshot(proxy);
    readonly scoped = injectScope()!.get(core);
  }
  Component({
    selector: "slux-test",
    standalone: true,
    template: "{{ core() }}:{{ atom() }}:{{ store() }}:{{ proxy().count }}:{{ scoped }}",
  })(Counter);
  const app = await createApplication({
    providers: [provideZonelessChangeDetection(), provideSluxScope(scope)],
  });
  const host = document.createElement("div");
  const component = createComponent(Counter, {
    environmentInjector: app.injector,
    hostElement: host,
  });
  try {
    app.attachView(component.hostView);
    component.changeDetectorRef.detectChanges();
    expect(host.textContent).toBe("2:2:3:4:10");
    core.set(5);
    source.set(6);
    store.setState({ count: 7 });
    proxy.count = 8;
    await app.whenStable();
    expect(host.textContent).toBe("10:6:7:8:10");
    component.destroy();
    const stopped = evaluations;
    core.set(9);
    expect(evaluations).toBe(stopped);
  } finally {
    app.destroy();
    store.destroy();
  }
});
