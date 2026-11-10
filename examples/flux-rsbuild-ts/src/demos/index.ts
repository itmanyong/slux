import type { ExampleDemo } from "@slux/shell-example";
import reproFluxCounter from "./flux-counter.repro.ts?raw";
import { create as createFluxCounter } from "./flux-counter";
import reproFluxReplace from "./flux-replace.repro.ts?raw";
import { create as createFluxReplace } from "./flux-replace";
import reproFluxMiddlewareLog from "./flux-middleware-log.repro.ts?raw";
import { create as createFluxMiddlewareLog } from "./flux-middleware-log";
import reproFluxMiddlewareGuard from "./flux-middleware-guard.repro.ts?raw";
import { create as createFluxMiddlewareGuard } from "./flux-middleware-guard";

const groups = [
  {
    id: "store",
    name: "store",
    title: "Store 与 reducer",
    summary: "dispatch 同步经过中间件链与 reducer，整状态替换后由 signal 通知。",
  },
  {
    id: "middleware",
    name: "middleware",
    title: "Dispatch 中间件",
    summary: "api => next => action 的独立管道：可记录、改写或阻断 action。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "flux-counter",
    group: "store",
    title: "createFluxStore：reducer 计数器",
    apiLabel: "createFluxStore(reducer, initialState)",
    summary: "dispatch 单向流动，subscribe 只收最终状态。",
    repro: reproFluxCounter,
    reproPath: "src/demos/flux-counter.repro.ts",
    create: createFluxCounter,
  },
  {
    id: "flux-replace",
    group: "store",
    title: "createFluxStore：整状态替换",
    apiLabel: "getState() / getInitialState()",
    summary: "reducer 返回完整新状态，initialState 引用不随派发改变。",
    repro: reproFluxReplace,
    reproPath: "src/demos/flux-replace.repro.ts",
    create: createFluxReplace,
  },
  {
    id: "flux-middleware-log",
    group: "middleware",
    title: "middleware：管道顺序",
    apiLabel: "options.middleware",
    summary: "A before → B before → 写入 → B after → A after，数组第一项在最外层。",
    repro: reproFluxMiddlewareLog,
    reproPath: "src/demos/flux-middleware-log.repro.ts",
    create: createFluxMiddlewareLog,
  },
  {
    id: "flux-middleware-guard",
    group: "middleware",
    title: "middleware：改写与阻断",
    apiLabel: "FluxMiddleware",
    summary: "省略 next 即阻断提交；重写 action 再交给下一环，dispatch 返回最终 action。",
    repro: reproFluxMiddlewareGuard,
    reproPath: "src/demos/flux-middleware-guard.repro.ts",
    create: createFluxMiddlewareGuard,
  },
];

export { groups };
