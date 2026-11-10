import type { ExampleDemo, LogTone } from "@slux/shell-example";
import { render } from "inferno";
import type { Component } from "inferno";
import reproSignal from "./signal.tsx?raw";
import { SignalDemo } from "./signal";
import reproComputed from "./computed.tsx?raw";
import { ComputedDemo } from "./computed";
import reproAtom from "./atom.tsx?raw";
import { AtomDemo } from "./atom";
import reproStore from "./store.tsx?raw";
import { StoreDemo } from "./store";
import reproProxy from "./proxy.tsx?raw";
import { ProxyDemo } from "./proxy";
import reproFlux from "./flux.tsx?raw";
import { FluxDemo } from "./flux";
import reproMachine from "./machine.tsx?raw";
import { MachineDemo } from "./machine";
import reproRxjs from "./rxjs.tsx?raw";
import { RxjsDemo } from "./rxjs";

type Log = (message: string, tone?: LogTone) => void;

/** 把 Inferno 类组件挂进卡片内容区；render(null) 卸载，重置即全新挂载。 */
const mount = (Demo: new (props: { log: Log }) => Component<{ log: Log }>) => {
  return (container: HTMLElement, context: { log: Log }): (() => void) => {
    render(<Demo log={context.log} />, container);
    return () => render(null, container);
  };
};

const groups = [
  {
    id: "signal",
    name: "signal",
    title: "信号绑定",
    summary: "SignalValue 把任意 Subscribable 读进组件，值变化即重渲染。",
  },
  {
    id: "atom",
    name: "atom",
    title: "Atom 范式",
    summary: "AtomValue 订阅原子状态与派生 atom。",
  },
  {
    id: "store",
    name: "store",
    title: "Store 范式",
    summary: "StoreValue + selector 只关心状态切片。",
  },
  {
    id: "proxy",
    name: "proxy",
    title: "Proxy 范式",
    summary: "直接改深层属性，组件拿到不可变快照。",
  },
  {
    id: "flux",
    name: "flux",
    title: "Flux 范式",
    summary: "FluxValue 订阅 reducer + dispatch 的单向数据流。",
  },
  {
    id: "machine",
    name: "machine",
    title: "状态机",
    summary: "MachineValue 订阅快照，send 驱动流转与守卫。",
  },
  {
    id: "rxjs",
    name: "rxjs",
    title: "RxJS 互通",
    summary: "ObservableValue 订阅桥接后的 Observable。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "signal",
    group: "signal",
    title: "SignalValue：信号驱动重渲染",
    apiLabel: "SignalValue({ source })",
    summary: "signal 变化时组件自动重渲染，写入仍走原实例。",
    repro: reproSignal,
    reproPath: "src/demos/signal.tsx",
    mount: mount(SignalDemo),
  },
  {
    id: "computed",
    group: "signal",
    title: "SignalValue：订阅派生值",
    apiLabel: "SignalValue({ source: computed })",
    summary: "computed 只在依赖变化时惰性重算，render prop 无感接入。",
    repro: reproComputed,
    reproPath: "src/demos/computed.tsx",
    mount: mount(ComputedDemo),
  },
  {
    id: "atom",
    group: "atom",
    title: "AtomValue + setAtom",
    apiLabel: "@slux/inferno/atom",
    summary: "原子状态与派生 atom 自动跟随，写值按替换契约走原实例。",
    repro: reproAtom,
    reproPath: "src/demos/atom.tsx",
    mount: mount(AtomDemo),
  },
  {
    id: "store",
    group: "store",
    title: "StoreValue + selector",
    apiLabel: "StoreValue({ store, selector })",
    summary: "只订阅所需切片：改 total 时 items 读数照常，无关更新被过滤。",
    repro: reproStore,
    reproPath: "src/demos/store.tsx",
    mount: mount(StoreDemo),
  },
  {
    id: "proxy",
    group: "proxy",
    title: "ProxyValue",
    apiLabel: "ProxyValue({ proxy })",
    summary: "深层属性直接改，组件消费不可变快照。",
    repro: reproProxy,
    reproPath: "src/demos/proxy.tsx",
    mount: mount(ProxyDemo),
  },
  {
    id: "flux",
    group: "flux",
    title: "FluxValue",
    apiLabel: "FluxValue({ source })",
    summary: "dispatch 单向流动，render prop 读取 reducer 后的状态。",
    repro: reproFlux,
    reproPath: "src/demos/flux.tsx",
    mount: mount(FluxDemo),
  },
  {
    id: "machine",
    group: "machine",
    title: "MachineValue",
    apiLabel: "MachineValue({ source })",
    summary: "START → loading → success/error，guard 限制无限重试。",
    repro: reproMachine,
    reproPath: "src/demos/machine.tsx",
    mount: mount(MachineDemo),
  },
  {
    id: "rxjs",
    group: "rxjs",
    title: "ObservableValue",
    apiLabel: "ObservableValue({ source })",
    summary: "RxJS 流经 fromObservable 桥接，next 即重渲染。",
    repro: reproRxjs,
    reproPath: "src/demos/rxjs.tsx",
    mount: mount(RxjsDemo),
  },
];

export { groups };
