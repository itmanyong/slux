import { mount as svelteMount, unmount } from "svelte";
import type { Component } from "svelte";
import type { ExampleDemo, LogTone } from "@slux/shell-example";
import ToReadableDemo from "./to-readable.svelte";
import reproToReadable from "./to-readable.svelte" with { type: "text" };
import ToWritableDemo from "./to-writable.svelte";
import reproToWritable from "./to-writable.svelte" with { type: "text" };
import ToAtomDemo from "./to-atom.svelte";
import reproToAtom from "./to-atom.svelte" with { type: "text" };
import ToStoreDemo from "./to-store.svelte";
import reproToStore from "./to-store.svelte" with { type: "text" };
import ToSnapshotDemo from "./to-snapshot.svelte";
import reproToSnapshot from "./to-snapshot.svelte" with { type: "text" };
import ToFluxDemo from "./to-flux.svelte";
import reproToFlux from "./to-flux.svelte" with { type: "text" };
import ToMachineDemo from "./to-machine.svelte";
import reproToMachine from "./to-machine.svelte" with { type: "text" };
import ToObservableDemo from "./to-observable.svelte";
import reproToObservable from "./to-observable.svelte" with { type: "text" };

type Log = (message: string, tone?: LogTone) => void;

/** 把 Svelte 组件挂进卡片内容区；unmount 即清理。 */
const mount = (component: Component<{ log: Log }>) => {
  return (container: HTMLElement, context: { log: Log }): (() => void) => {
    const app = svelteMount(component, {
      target: container,
      props: { log: context.log },
    });
    return () => unmount(app);
  };
};

const groups = [
  {
    id: "signal",
    name: "signal",
    title: "信号绑定",
    summary: "toReadable / toWritable 把任意 Subscribable 读成 Svelte store。",
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
    summary: "把 Observable 桥接进 Svelte store。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "to-readable",
    group: "signal",
    title: "toReadable：信号驱动重渲染",
    apiLabel: "toReadable(source)",
    summary: "signal 变化时 store 自动推送，$ 前缀订阅即重渲染。",
    repro: reproToReadable,
    reproPath: "src/demos/to-readable.svelte",
    mount: mount(ToReadableDemo),
  },
  {
    id: "to-writable",
    group: "signal",
    title: "toWritable：可写信号接 store",
    apiLabel: "toWritable(signal)",
    summary: "update/set 直接写回 slux signal，派生值自动跟随。",
    repro: reproToWritable,
    reproPath: "src/demos/to-writable.svelte",
    mount: mount(ToWritableDemo),
  },
  {
    id: "to-atom",
    group: "atom",
    title: "toAtom + toAtomValue",
    apiLabel: "@slux/svelte/atom",
    summary: "原子状态读写分离，derived 派生值自动跟随。",
    repro: reproToAtom,
    reproPath: "src/demos/to-atom.svelte",
    mount: mount(ToAtomDemo),
  },
  {
    id: "to-store",
    group: "store",
    title: "toStore + selector",
    apiLabel: "toStore(store, selector)",
    summary: "只订阅所需切片：改 total 时 items 组件不重渲染。",
    repro: reproToStore,
    reproPath: "src/demos/to-store.svelte",
    mount: mount(ToStoreDemo),
  },
  {
    id: "to-snapshot",
    group: "proxy",
    title: "toSnapshot",
    apiLabel: "toSnapshot(proxy)",
    summary: "深层属性直接改，组件消费不可变快照。",
    repro: reproToSnapshot,
    reproPath: "src/demos/to-snapshot.svelte",
    mount: mount(ToSnapshotDemo),
  },
  {
    id: "to-flux",
    group: "flux",
    title: "toFluxStore",
    apiLabel: "toFluxStore(store)",
    summary: "dispatch 单向流动，组件读取 reducer 后的状态。",
    repro: reproToFlux,
    reproPath: "src/demos/to-flux.svelte",
    mount: mount(ToFluxDemo),
  },
  {
    id: "to-machine",
    group: "machine",
    title: "toMachine",
    apiLabel: "toMachine(machine)",
    summary: "START → loading → success/error，guard 限制无限重试。",
    repro: reproToMachine,
    reproPath: "src/demos/to-machine.svelte",
    mount: mount(ToMachineDemo),
  },
  {
    id: "to-observable",
    group: "rxjs",
    title: "toObservableStore",
    apiLabel: "toObservableStore(stream)",
    summary: "RxJS 流经 fromObservable 桥接，next 即重渲染。",
    repro: reproToObservable,
    reproPath: "src/demos/to-observable.svelte",
    mount: mount(ToObservableDemo),
  },
];

export { groups };
