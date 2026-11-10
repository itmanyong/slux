import type { ExampleDemo, ExampleGroup } from "@slux/shell-example";
import reproStateChange from "./state-change.repro.ts?raw";
import { createStateChangeDemo } from "./state-change";
import reproLifecycle from "./lifecycle-events.repro.ts?raw";
import { createLifecycleDemo } from "./lifecycle-events";
import reproFieldFilter from "./field-filter.repro.ts?raw";
import { createFieldFilterDemo } from "./field-filter";
import reproPauseResume from "./pause-resume.repro.ts?raw";
import { createPauseResumeDemo } from "./pause-resume";
import reproErrorIsolation from "./error-isolation.repro.ts?raw";
import { createErrorIsolationDemo } from "./error-isolation";
import reproRebuildStore from "./rebuild-store.repro.ts?raw";
import { createRebuildStoreDemo } from "./rebuild-store";

const groups: ExampleGroup[] = [
  {
    id: "record",
    name: "record",
    title: "事件采集",
    summary: "onInit / onStateChange / onSubscribe 把初始化、更新与订阅事件交给回调，业务写入不经过任何改动。",
  },
  {
    id: "gate",
    name: "gate",
    title: "过滤与控制",
    summary: "filter 只上报关心的字段，setEnabled 随时暂停；回调异常由 onError 隔离，销毁后计数归零。",
  },
];

export const demos: ExampleDemo[] = [
  {
    id: "state-change",
    group: "record",
    title: "onStateChange：每次更新的元数据",
    apiLabel: "telemetry({ onStateChange })",
    summary: "partial、耗时与累计更新数随每次 setState 到达回调，不阻断业务写入。",
    repro: reproStateChange,
    reproPath: "src/demos/state-change.repro.ts",
    create: (ctx) => createStateChangeDemo(ctx.log),
  },
  {
    id: "lifecycle-events",
    group: "record",
    title: "onInit + onSubscribe：初始化与订阅",
    apiLabel: "telemetry({ onInit, onSubscribe })",
    summary: "Store 创建即触发 onInit；每次注册订阅累计 totalSubscriptions，取消不回退。",
    repro: reproLifecycle,
    reproPath: "src/demos/lifecycle-events.repro.ts",
    create: (ctx) => createLifecycleDemo(ctx.log),
  },
  {
    id: "field-filter",
    group: "gate",
    title: "filter：只上报关心的字段",
    apiLabel: "telemetry({ filter })",
    summary: "filter 返回 false 的更新照常写入，只是不进遥测。",
    repro: reproFieldFilter,
    reproPath: "src/demos/field-filter.repro.ts",
    create: (ctx) => createFieldFilterDemo(ctx.log),
  },
  {
    id: "pause-resume",
    group: "gate",
    title: "setEnabled：暂停与恢复",
    apiLabel: "setEnabled(false) · isEnabled()",
    summary: "暂停期间状态照常变化，changeCount 仍累计，恢复后立刻续上。",
    repro: reproPauseResume,
    reproPath: "src/demos/pause-resume.repro.ts",
    create: (ctx) => createPauseResumeDemo(ctx.log),
  },
  {
    id: "error-isolation",
    group: "gate",
    title: "onError：回调异常隔离",
    apiLabel: "telemetry({ onError })",
    summary: "上报回调抛错交给 onError 并标注来源，业务更新不受影响。",
    repro: reproErrorIsolation,
    reproPath: "src/demos/error-isolation.repro.ts",
    create: (ctx) => createErrorIsolationDemo(ctx.log),
  },
  {
    id: "rebuild-store",
    group: "gate",
    title: "onDestroy：计数归零",
    apiLabel: "store.destroy()",
    summary: "销毁把 changeCount 清零；同一中间件接入新 Store 后从 1 重新计数。",
    repro: reproRebuildStore,
    reproPath: "src/demos/rebuild-store.repro.ts",
    create: (ctx) => createRebuildStoreDemo(ctx.log),
  },
];

export { groups };
