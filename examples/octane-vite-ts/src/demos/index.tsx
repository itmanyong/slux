import type { ExampleDemo, LogTone } from "@slux/shell-example";
import { createRoot } from "octane";
import type { ElementDescriptor } from "octane";
import { computed, signal } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { createFluxStore } from "@slux/flux";
import { createMachine } from "@slux/state-machine";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";
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
import type { FetchContext, FetchEvent, FetchState } from "./use-machine";
import reproUseRxjs from "./use-rxjs.tsx?raw";
import { UseRxjsDemo } from "./use-rxjs";

type Log = (message: string, tone?: LogTone) => void;

/**
 * 把 Octane 组件挂进卡片内容区。
 *
 * Octane 组件遵循 React 语义：函数体每次渲染都会重新执行，所以 slux 的
 * 信号、atom、store 都在挂载闭包里创建（组件之外），再作为 props 传入。
 */
const mount = (render: (log: Log) => ElementDescriptor) => {
  return (container: HTMLElement, context: { log: Log }): (() => void) => {
    const app = createRoot(container);
    app.render(render(context.log));
    return () => app.unmount();
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
    summary: "把 Observable 桥接进 Octane 组件。",
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
    reproPath: "src/demos/use-signal.tsx",
    mount: mount((log) => <UseSignalDemo count={signal(0)} log={log} />),
  },
  {
    id: "use-computed",
    group: "signal",
    title: "useSignal：订阅派生值",
    apiLabel: "useSignal(computed)",
    summary: "computed 只在依赖变化时惰性重算，组件无感接入。",
    repro: reproUseComputed,
    reproPath: "src/demos/use-computed.tsx",
    mount: mount((log) => {
      const left = signal(2);
      const right = signal(3);
      const total = computed(() => left.get() * right.get());
      return <UseComputedDemo left={left} right={right} total={total} log={log} />;
    }),
  },
  {
    id: "use-atom",
    group: "atom",
    title: "useAtomValue + useSetAtom",
    apiLabel: "@slux/octane/atom",
    summary: "原子状态读写分离，derived 派生值自动跟随。",
    repro: reproUseAtom,
    reproPath: "src/demos/use-atom.tsx",
    mount: mount((log) => {
      const price = atom(10);
      const double = derived((get) => get(price) * 2);
      return <UseAtomDemo price={price} double={double} log={log} />;
    }),
  },
  {
    id: "use-store",
    group: "store",
    title: "useStore + selector",
    apiLabel: "useStore(store, selector)",
    summary: "只订阅所需切片：改 total 时 items 组件不重渲染。",
    repro: reproUseStore,
    reproPath: "src/demos/use-store.tsx",
    mount: mount((log) => <UseStoreDemo store={createStore(() => ({ items: 0, total: 0 }))} log={log} />),
  },
  {
    id: "use-proxy",
    group: "proxy",
    title: "useSnapshot",
    apiLabel: "useSnapshot(proxy)",
    summary: "深层属性直接改，组件消费不可变快照。",
    repro: reproUseProxy,
    reproPath: "src/demos/use-proxy.tsx",
    mount: mount((log) => <UseProxyDemo user={observable({ user: { name: "Ada", scores: [60, 72] } })} log={log} />),
  },
  {
    id: "use-flux",
    group: "flux",
    title: "useFluxStore",
    apiLabel: "useFluxStore(store)",
    summary: "dispatch 单向流动，组件读取 reducer 后的状态。",
    repro: reproUseFlux,
    reproPath: "src/demos/use-flux.tsx",
    mount: mount((log) => (
      <UseFluxDemo
        store={createFluxStore(
          (state, action) => {
            switch (action.type) {
              case "increment":
                return { count: state.count + action.by };
              case "reset":
                return { count: 0 };
            }
          },
          { count: 0 },
        )}
        log={log}
      />
    )),
  },
  {
    id: "use-machine",
    group: "machine",
    title: "useMachine",
    apiLabel: "useMachine(machine)",
    summary: "START → loading → success/error，guard 限制无限重试。",
    repro: reproUseMachine,
    reproPath: "src/demos/use-machine.tsx",
    mount: mount((log) => (
      <UseMachineDemo
        machine={createMachine<FetchContext, FetchEvent, FetchState>({
          initial: "idle",
          context: { retries: 0 },
          states: {
            idle: { on: { START: { target: "loading" } } },
            loading: {
              on: { RESOLVE: { target: "success" }, FAIL: { target: "error" } },
            },
            success: {
              on: {
                RESET: {
                  target: "idle",
                  actions: [(context) => ({ ...context, retries: 0 })],
                },
              },
            },
            error: {
              on: {
                RETRY: {
                  target: "loading",
                  guard: (context) => context.retries < 2,
                  actions: [(context) => ({ ...context, retries: context.retries + 1 })],
                },
                RESET: {
                  target: "idle",
                  actions: [(context) => ({ ...context, retries: 0 })],
                },
              },
            },
          },
        })}
        log={log}
      />
    )),
  },
  {
    id: "use-rxjs",
    group: "rxjs",
    title: "useObservable",
    apiLabel: "useObservable(stream)",
    summary: "RxJS 流经 fromObservable 桥接，next 即重渲染。",
    repro: reproUseRxjs,
    reproPath: "src/demos/use-rxjs.tsx",
    mount: mount((log) => {
      const events = new Subject<number>();
      const source = fromObservable(events, 0);
      return <UseRxjsDemo events={events} source={source} log={log} />;
    }),
  },
];

export { groups };
