import type { Type } from "@angular/core";
import type { ExampleDemo, LogTone } from "@slux/shell-example";
import { mountComponent } from "../boot";
import reproSignal from "./signal.ts?raw";
import { SignalDemo } from "./signal";
import reproComputed from "./computed.ts?raw";
import { ComputedDemo } from "./computed";
import reproAtom from "./atom.ts?raw";
import { AtomDemo } from "./atom";
import reproStore from "./store.ts?raw";
import { StoreDemo } from "./store";
import reproProxy from "./proxy.ts?raw";
import { ProxyDemo } from "./proxy";
import reproFlux from "./flux.ts?raw";
import { FluxDemo } from "./flux";
import reproMachine from "./machine.ts?raw";
import { MachineDemo } from "./machine";
import reproRxjs from "./rxjs.ts?raw";
import { RxjsDemo } from "./rxjs";

type Log = (message: string, tone?: LogTone) => void;

/** 把 Angular 组件挂进卡片内容区；卸载 = detachView + destroy，重置即全新挂载。 */
const mount = (component: Type<unknown>) => {
  return (container: HTMLElement, context: { log: Log }): (() => void) => {
    return mountComponent(component, container, context.log);
  };
};

const groups = [
  {
    id: "signal",
    name: "signal",
    title: "信号绑定",
    summary: "toAngularSignal 在注入上下文里把 Subscribable 变成只读 Signal。",
  },
  {
    id: "atom",
    name: "atom",
    title: "Atom 范式",
    summary: "injectAtomValue / injectSetAtom 读写分离的注入。",
  },
  {
    id: "store",
    name: "store",
    title: "Store 范式",
    summary: "injectStore + selector 只订阅所需切片。",
  },
  {
    id: "proxy",
    name: "proxy",
    title: "Proxy 范式",
    summary: "直接改深层属性，Signal 拿到不可变快照。",
  },
  {
    id: "flux",
    name: "flux",
    title: "Flux 范式",
    summary: "injectFluxStore 订阅 reducer + dispatch 的单向数据流。",
  },
  {
    id: "machine",
    name: "machine",
    title: "状态机",
    summary: "injectMachine 订阅快照，send 驱动流转与守卫。",
  },
  {
    id: "rxjs",
    name: "rxjs",
    title: "RxJS 互通",
    summary: "injectObservable 订阅桥接后的 Observable。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "signal",
    group: "signal",
    title: "toAngularSignal：信号驱动变更检测",
    apiLabel: "toAngularSignal(source)",
    summary: "slux signal / computed 变化时 Signal 更新，模板随 CD 刷新。",
    repro: reproSignal,
    reproPath: "src/demos/signal.ts",
    mount: mount(SignalDemo),
  },
  {
    id: "computed",
    group: "signal",
    title: "toAngularSignal：订阅派生值",
    apiLabel: "toAngularSignal(computed)",
    summary: "computed 只在依赖变化时惰性重算，模板无感接入。",
    repro: reproComputed,
    reproPath: "src/demos/computed.ts",
    mount: mount(ComputedDemo),
  },
  {
    id: "atom",
    group: "atom",
    title: "injectAtomValue + injectSetAtom",
    apiLabel: "@slux/angular/atom",
    summary: "原子状态读写分离，derived 派生值自动跟随。",
    repro: reproAtom,
    reproPath: "src/demos/atom.ts",
    mount: mount(AtomDemo),
  },
  {
    id: "store",
    group: "store",
    title: "injectStore + selector",
    apiLabel: "injectStore(store, selector)",
    summary: "只订阅所需切片：改 total 时 items Signal 不产生新值。",
    repro: reproStore,
    reproPath: "src/demos/store.ts",
    mount: mount(StoreDemo),
  },
  {
    id: "proxy",
    group: "proxy",
    title: "injectSnapshot",
    apiLabel: "injectSnapshot(proxy)",
    summary: "深层属性直接改，Signal 消费不可变快照。",
    repro: reproProxy,
    reproPath: "src/demos/proxy.ts",
    mount: mount(ProxyDemo),
  },
  {
    id: "flux",
    group: "flux",
    title: "injectFluxStore",
    apiLabel: "injectFluxStore(store)",
    summary: "dispatch 单向流动，模板读取 reducer 后的状态。",
    repro: reproFlux,
    reproPath: "src/demos/flux.ts",
    mount: mount(FluxDemo),
  },
  {
    id: "machine",
    group: "machine",
    title: "injectMachine",
    apiLabel: "injectMachine(machine)",
    summary: "START → loading → success/error，guard 限制无限重试。",
    repro: reproMachine,
    reproPath: "src/demos/machine.ts",
    mount: mount(MachineDemo),
  },
  {
    id: "rxjs",
    group: "rxjs",
    title: "injectObservable",
    apiLabel: "injectObservable(stream)",
    summary: "RxJS 流经 fromObservable 桥接，next 即更新 Signal。",
    repro: reproRxjs,
    reproPath: "src/demos/rxjs.ts",
    mount: mount(RxjsDemo),
  },
];

export { groups };
