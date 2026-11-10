import type { ExampleDemo, ExampleGroup } from "@slux/shell-example";
import reproLoggerBasic from "./logger-basic.repro.ts?raw";
import { createLoggerBasicDemo } from "./logger-basic";
import reproLoggerDiff from "./logger-diff.repro.ts?raw";
import { createLoggerDiffDemo } from "./logger-diff";
import reproInspectFeed from "./inspect-feed.repro.ts?raw";
import { createInspectFeedDemo } from "./inspect-feed";
import reproInspectLifecycle from "./inspect-lifecycle.repro.ts?raw";
import { createInspectLifecycleDemo } from "./inspect-lifecycle";
import reproInspectMulti from "./inspect-multi.repro.ts?raw";
import { createInspectMultiDemo } from "./inspect-multi";
import reproDevtoolsConnect from "./devtools-connect.repro.ts?raw";
import { createDevtoolsConnectDemo } from "./devtools-connect";

const groups: ExampleGroup[] = [
  {
    id: "logger",
    name: "logger",
    title: "日志中间件",
    summary: "logger 拦截每次 setState，把 prev / action / next 写进任意 LoggerInterface，这里捕获到卡片里直接展示。",
  },
  {
    id: "inspect",
    name: "inspect",
    title: "全局检查器",
    summary: "inspect 注册跨 Store 的检查器回调；devtools 中间件在 init / set / destroy 时发出 InspectEvent。",
  },
  {
    id: "bridge",
    name: "bridge",
    title: "DevTools 桥接",
    summary: "devtools 中间件连接 Redux DevTools 扩展；扩展缺失时静默降级，inspect 事件流照常工作。",
  },
];

export const demos: ExampleDemo[] = [
  {
    id: "logger-basic",
    group: "logger",
    title: "logger：拦截每次 setState",
    apiLabel: "logger({ name, logger })",
    summary: "prev state / action / next state 三行结构化输出，写进自定义 LoggerInterface。",
    repro: reproLoggerBasic,
    reproPath: "src/demos/logger-basic.repro.ts",
    create: (ctx) => createLoggerBasicDemo(ctx.log),
  },
  {
    id: "logger-diff",
    group: "logger",
    title: "logger：diff 与自定义 action 名",
    apiLabel: "logger({ diff, actionName })",
    summary: "diff 只列变化字段；actionName 把 partial 翻译成 SET_COUNT / SET_PRICE。",
    repro: reproLoggerDiff,
    reproPath: "src/demos/logger-diff.repro.ts",
    create: (ctx) => createLoggerDiffDemo(ctx.log),
  },
  {
    id: "inspect-feed",
    group: "inspect",
    title: "inspect：订阅检查事件流",
    apiLabel: "inspect(callback)",
    summary: "init / set 事件实时到达回调；注销后写入不再被记录。",
    repro: reproInspectFeed,
    reproPath: "src/demos/inspect-feed.repro.ts",
    create: (ctx) => createInspectFeedDemo(ctx.log),
  },
  {
    id: "inspect-lifecycle",
    group: "inspect",
    title: "inspect：destroy 事件与重建",
    apiLabel: "store.destroy() · InspectEventType",
    summary: "销毁发出 destroy 事件；同一中间件名重建后发出新的 init。",
    repro: reproInspectLifecycle,
    reproPath: "src/demos/inspect-lifecycle.repro.ts",
    create: (ctx) => createInspectLifecycleDemo(ctx.log),
  },
  {
    id: "inspect-multi",
    group: "inspect",
    title: "inspect：一个检查器看多个 Store",
    apiLabel: "devtools({ name })",
    summary: "cart 与 profile 两个 Store 共用一个检查器，事件用 storeName 区分来源。",
    repro: reproInspectMulti,
    reproPath: "src/demos/inspect-multi.repro.ts",
    create: (ctx) => createInspectMultiDemo(ctx.log),
  },
  {
    id: "devtools-connect",
    group: "bridge",
    title: "devtools：Redux 扩展检测与降级",
    apiLabel: "devtools({ name })",
    summary: "有扩展时动作发送到面板；没有扩展时连接静默降级，检查器事件照常。",
    repro: reproDevtoolsConnect,
    reproPath: "src/demos/devtools-connect.repro.ts",
    create: (ctx) => createDevtoolsConnectDemo(ctx.log),
  },
];

export { groups };
