import type { ExampleDemo, LogTone } from "@slux/shell-example";
import type { Component } from "vitarx";
import { createApp } from "vitarx";
import reproUseSignal from "./use-signal.tsx?raw";
import { UseSignalDemo } from "./use-signal";
import reproUseComputed from "./use-computed.tsx?raw";
import { UseComputedDemo } from "./use-computed";
import reproUseAtom from "./use-atom.tsx?raw";
import { UseAtomDemo } from "./use-atom";
import reproUseStore from "./use-store.tsx?raw";
import { UseStoreDemo } from "./use-store";
import reproUseProxy from "./use-proxy.tsx?raw";
import { UseProxyDemo } from "./use-proxy";
import reproUseFlux from "./use-flux.tsx?raw";
import { UseFluxDemo } from "./use-flux";
import reproUseMachine from "./use-machine.tsx?raw";
import { UseMachineDemo } from "./use-machine";
import reproUseRxjs from "./use-rxjs.tsx?raw";
import { UseRxjsDemo } from "./use-rxjs";

type Log = (message: string, tone?: LogTone) => void;

/** 把 Vitarx 组件挂进卡片内容区；组件初始化时创建状态，重置即全新挂载。 */
const mount = (DemoComponent: Component<{ log: Log }>) => {
  return (container: HTMLElement, context: { log: Log }): (() => void) => {
    const app = createApp(() => <DemoComponent log={context.log} />);
    app.mount(container);
    return () => app.unmount();
  };
};

const groups = [
  {
    id: "signal",
    name: "signal",
    title: "信号绑定",
    summary: "useSignal 把任意 Subscribable 读进组件，返回只读浅 Ref，值变化即重渲染。",
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
    summary: "把 Observable 桥接进 Vitarx 组件。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "use-signal",
    group: "signal",
    title: "useSignal：信号驱动重渲染",
    apiLabel: "useSignal(source)",
    summary: "signal 变化时写回 ShallowRef，组件读取 .value 即响应。",
    repro: reproUseSignal,
    reproPath: "src/demos/use-signal.tsx",
    mount: mount(UseSignalDemo),
  },
  {
    id: "use-computed",
    group: "signal",
    title: "useSignal：订阅派生值",
    apiLabel: "useSignal(computed)",
    summary: "computed 只在依赖变化时惰性重算，绑定层额外起 effect 保持依赖刷新。",
    repro: reproUseComputed,
    reproPath: "src/demos/use-computed.tsx",
    mount: mount(UseComputedDemo),
  },
  {
    id: "use-atom",
    group: "atom",
    title: "useAtomValue + useSetAtom",
    apiLabel: "@slux/vitarx/atom",
    summary: "原子状态读写分离，derived 派生值自动跟随。",
    repro: reproUseAtom,
    reproPath: "src/demos/use-atom.tsx",
    mount: mount(UseAtomDemo),
  },
  {
    id: "use-store",
    group: "store",
    title: "useStore + selector",
    apiLabel: "useStore(store, selector)",
    summary: "只订阅所需切片：改 total 时 items 组件不更新。",
    repro: reproUseStore,
    reproPath: "src/demos/use-store.tsx",
    mount: mount(UseStoreDemo),
  },
  {
    id: "use-proxy",
    group: "proxy",
    title: "useSnapshot",
    apiLabel: "useSnapshot(proxy)",
    summary: "深层属性直接改，组件消费冻结且结构共享的快照。",
    repro: reproUseProxy,
    reproPath: "src/demos/use-proxy.tsx",
    mount: mount(UseProxyDemo),
  },
  {
    id: "use-flux",
    group: "flux",
    title: "useFluxStore",
    apiLabel: "useFluxStore(store)",
    summary: "dispatch 单向流动，组件读取 reducer 后的状态。",
    repro: reproUseFlux,
    reproPath: "src/demos/use-flux.tsx",
    mount: mount(UseFluxDemo),
  },
  {
    id: "use-machine",
    group: "machine",
    title: "useMachine",
    apiLabel: "useMachine(machine)",
    summary: "START → loading → success/error，guard 限制无限重试。",
    repro: reproUseMachine,
    reproPath: "src/demos/use-machine.tsx",
    mount: mount(UseMachineDemo),
  },
  {
    id: "use-rxjs",
    group: "rxjs",
    title: "useObservable",
    apiLabel: "useObservable(stream)",
    summary: "RxJS 流经 fromObservable 桥接，next 即重渲染。",
    repro: reproUseRxjs,
    reproPath: "src/demos/use-rxjs.tsx",
    mount: mount(UseRxjsDemo),
  },
];

export { groups };
