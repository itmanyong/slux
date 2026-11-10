import type { ExampleDemo } from "@slux/shell-example";
import reproStoreCreate from "./store-create.repro.ts?raw";
import { createStoreDemo } from "./store-create";
import reproStoreSubscribe from "./store-subscribe.repro.ts?raw";
import { createStoreSubscribeDemo } from "./store-subscribe";
import reproMiddlewareAudit from "./middleware-audit.repro.ts?raw";
import { createMiddlewareAuditDemo } from "./middleware-audit";
import reproMiddlewareGuard from "./middleware-guard.repro.ts?raw";
import { createMiddlewareGuardDemo } from "./middleware-guard";
import reproLifecycleDestroy from "./lifecycle-destroy.repro.ts?raw";
import { createLifecycleDestroyDemo } from "./lifecycle-destroy";
import reproLifecycleInitial from "./lifecycle-initial.repro.ts?raw";
import { createLifecycleInitialDemo } from "./lifecycle-initial";

const groups = [
  {
    id: "basic",
    name: "basic",
    title: "基础读写",
    summary: "createStore 定义仓库，setState 以合并或 updater 两种形态写入。",
  },
  {
    id: "subscribe",
    name: "subscribe",
    title: "订阅通知",
    summary: "subscribe 监听 (state, prevState)，可随时退订。",
  },
  {
    id: "middleware",
    name: "middleware",
    title: "中间件",
    summary: "onSet 链式拦截：外层先收到写入，内层决定是否放行。",
  },
  {
    id: "lifecycle",
    name: "lifecycle",
    title: "生命周期",
    summary: "destroy 让仓库失效；getInitialState 保留初始快照。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "store-create",
    group: "basic",
    title: "createStore：创建仓库与读写",
    apiLabel: "createStore(creator)",
    summary: "creator 返回初始状态；setState 支持对象合并与函数式 updater。",
    repro: reproStoreCreate,
    reproPath: "src/demos/store-create.repro.ts",
    create: ({ log }) => createStoreDemo(log),
  },
  {
    id: "store-subscribe",
    group: "subscribe",
    title: "subscribe：监听状态流转",
    apiLabel: "store.subscribe(listener)",
    summary: "listener 收到 (state, prevState)，退订后写入不再通知。",
    repro: reproStoreSubscribe,
    reproPath: "src/demos/store-subscribe.repro.ts",
    create: ({ log }) => createStoreSubscribeDemo(log),
  },
  {
    id: "middleware-audit",
    group: "middleware",
    title: "Middleware：onSet 审计写入",
    apiLabel: "middleware: [audit]",
    summary: "onSet 在写入前捕获 partial，审计后继续调用 next。",
    repro: reproMiddlewareAudit,
    reproPath: "src/demos/middleware-audit.repro.ts",
    create: ({ log }) => createMiddlewareAuditDemo(log),
  },
  {
    id: "middleware-guard",
    group: "middleware",
    title: "Middleware：链式与拦截",
    apiLabel: "middleware: [logger, guard]",
    summary: "不调用 next 即拦截写入：guard 拒绝让 count 变为负数。",
    repro: reproMiddlewareGuard,
    reproPath: "src/demos/middleware-guard.repro.ts",
    create: ({ log }) => createMiddlewareGuardDemo(log),
  },
  {
    id: "lifecycle-destroy",
    group: "lifecycle",
    title: "destroy：销毁仓库",
    apiLabel: "store.destroy()",
    summary: "销毁后 setState 被忽略、subscribe 返回空函数，重复调用是 no-op。",
    repro: reproLifecycleDestroy,
    reproPath: "src/demos/lifecycle-destroy.repro.ts",
    create: ({ log }) => createLifecycleDestroyDemo(log),
  },
  {
    id: "lifecycle-initial",
    group: "lifecycle",
    title: "getInitialState：回到初始快照",
    apiLabel: "store.getInitialState()",
    summary: "初始快照永不改变，配合 setState 可一键回滚。",
    repro: reproLifecycleInitial,
    reproPath: "src/demos/lifecycle-initial.repro.ts",
    create: ({ log }) => createLifecycleInitialDemo(log),
  },
];

export { groups };
