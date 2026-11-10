import type { ExampleDemo, LogTone } from "@slux/shell-example";
import { flushSync, mount } from "ripple";
import type { Component } from "ripple";
import reproUseSignal from "./use-signal.tsrx?raw";
import { UseSignalDemo } from "./use-signal.tsrx";
import reproUseComputed from "./use-computed.tsrx?raw";
import { UseComputedDemo } from "./use-computed.tsrx";
import reproUseAtom from "./use-atom.tsrx?raw";
import { UseAtomDemo } from "./use-atom.tsrx";
import reproUseStore from "./use-store.tsrx?raw";
import { UseStoreDemo } from "./use-store.tsrx";
import reproUseProxy from "./use-proxy.tsrx?raw";
import { UseProxyDemo } from "./use-proxy.tsrx";
import reproUseFlux from "./use-flux.tsrx?raw";
import { UseFluxDemo } from "./use-flux.tsrx";
import reproUseMachine from "./use-machine.tsrx?raw";
import { UseMachineDemo } from "./use-machine.tsrx";
import reproUseRxjs from "./use-rxjs.tsrx?raw";
import { UseRxjsDemo } from "./use-rxjs.tsrx";

type Log = (message: string, tone?: LogTone) => void;

/**
 * 把 Ripple 组件挂进卡片内容区。
 *
 * mount 会接管 target 并清空它的内容，所以先建一个独立的 host 节点再挂载，
 * 卡片内容区里已有的节点不会被清掉。
 */
const mountRipple = (component: Component<{ log: Log }>) => {
  return (container: HTMLElement, context: { log: Log }): (() => void) => {
    const host = document.createElement("div");
    container.append(host);
    const unmount = mount(component as Component, {
      target: host,
      props: { log: context.log },
    });
    flushSync();
    return unmount;
  };
};

const groups = [
  {
    id: "signal",
    name: "signal",
    title: "信号绑定",
    summary: "useSignal 把任意 Subscribable 读进组件，值变化即重渲染。",
  },
  {
    id: "atom",
    name: "atom",
    title: "Atom 范式",
    summary: "原子状态与派生 atom，读写分离的绑定。",
  },
  {
    id: "store",
    name: "store",
    title: "Store 范式",
    summary: "整仓订阅与 selector 精确订阅的差别。",
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
    summary: "reducer + dispatch 的单向数据流。",
  },
  {
    id: "machine",
    name: "machine",
    title: "状态机",
    summary: "有限状态机接管异步流程与事件守卫。",
  },
  {
    id: "rxjs",
    name: "rxjs",
    title: "RxJS 互通",
    summary: "把 Observable 桥接进 Ripple 组件。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "use-signal",
    group: "signal",
    title: "useSignal：信号驱动重渲染",
    apiLabel: "useSignal(source)",
    summary: "signal 变化时组件自动重渲染，写入仍走原实例。",
    repro: reproUseSignal,
    reproPath: "src/demos/use-signal.tsrx",
    mount: mountRipple(UseSignalDemo),
  },
  {
    id: "use-computed",
    group: "signal",
    title: "useSignal：订阅派生值",
    apiLabel: "useSignal(computed)",
    summary: "computed 只在依赖变化时惰性重算，组件无感接入。",
    repro: reproUseComputed,
    reproPath: "src/demos/use-computed.tsrx",
    mount: mountRipple(UseComputedDemo),
  },
  {
    id: "use-atom",
    group: "atom",
    title: "useAtomValue + useSetAtom",
    apiLabel: "@slux/ripple/atom",
    summary: "原子状态读写分离，derived 派生值自动跟随。",
    repro: reproUseAtom,
    reproPath: "src/demos/use-atom.tsrx",
    mount: mountRipple(UseAtomDemo),
  },
  {
    id: "use-store",
    group: "store",
    title: "useStore + selector",
    apiLabel: "useStore(store, selector)",
    summary: "只订阅所需切片：改 total 时 items 组件不重渲染。",
    repro: reproUseStore,
    reproPath: "src/demos/use-store.tsrx",
    mount: mountRipple(UseStoreDemo),
  },
  {
    id: "use-proxy",
    group: "proxy",
    title: "useSnapshot",
    apiLabel: "useSnapshot(proxy)",
    summary: "深层属性直接改，组件消费不可变快照。",
    repro: reproUseProxy,
    reproPath: "src/demos/use-proxy.tsrx",
    mount: mountRipple(UseProxyDemo),
  },
  {
    id: "use-flux",
    group: "flux",
    title: "useFluxStore",
    apiLabel: "useFluxStore(store)",
    summary: "dispatch 单向流动，组件读取 reducer 后的状态。",
    repro: reproUseFlux,
    reproPath: "src/demos/use-flux.tsrx",
    mount: mountRipple(UseFluxDemo),
  },
  {
    id: "use-machine",
    group: "machine",
    title: "useMachine",
    apiLabel: "useMachine(machine)",
    summary: "START → loading → success/error，guard 限制无限重试。",
    repro: reproUseMachine,
    reproPath: "src/demos/use-machine.tsrx",
    mount: mountRipple(UseMachineDemo),
  },
  {
    id: "use-rxjs",
    group: "rxjs",
    title: "useObservable",
    apiLabel: "useObservable(stream)",
    summary: "RxJS 流经 fromObservable 桥接，next 即重渲染。",
    repro: reproUseRxjs,
    reproPath: "src/demos/use-rxjs.tsrx",
    mount: mountRipple(UseRxjsDemo),
  },
];

export { groups };
