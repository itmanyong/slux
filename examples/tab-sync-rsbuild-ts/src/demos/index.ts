import type { ExampleDemo, ExampleGroup } from "@slux/shell-example";
import reproPairSync from "./pair-sync.repro.ts?raw";
import { createPairSyncDemo } from "./pair-sync";
import reproWireInspector from "./wire-inspector.repro.ts?raw";
import { createWireInspectorDemo } from "./wire-inspector";
import reproFieldFilter from "./field-filter.repro.ts?raw";
import { createFieldFilterDemo } from "./field-filter";
import reproConflictResolver from "./conflict-resolver.repro.ts?raw";
import { createConflictResolverDemo } from "./conflict-resolver";
import reproChannelLifecycle from "./channel-lifecycle.repro.ts?raw";
import { createChannelLifecycleDemo } from "./channel-lifecycle";

const groups: ExampleGroup[] = [
  {
    id: "sync",
    name: "sync",
    title: "同步通道",
    summary: "同一通道上的 Store 实例互为对端：本地写入广播出去，远端写入被应用且不再回环。单页内即可模拟两个页签。",
  },
  {
    id: "conflict",
    name: "conflict",
    title: "冲突策略",
    summary: "conflictResolution 决定远端状态如何落地：自定义 resolver 可以实现取较大值等合并策略。",
  },
  {
    id: "lifecycle",
    name: "lifecycle",
    title: "通道生命周期",
    summary: "destroy 关闭 BroadcastChannel，实例掉线后不再收发；重建后从下一笔广播重新跟随。",
  },
];

export const demos: ExampleDemo[] = [
  {
    id: "pair-sync",
    group: "sync",
    title: "broadcast：同页双实例对发",
    apiLabel: "broadcast({ channel })",
    summary: "A 与 B 挂在同一通道上，互相跟随；BroadcastChannel 缺失时各自独立。",
    repro: reproPairSync,
    reproPath: "src/demos/pair-sync.repro.ts",
    create: (ctx) => createPairSyncDemo(ctx.log),
  },
  {
    id: "wire-inspector",
    group: "sync",
    title: "BroadcastMessage：线上的消息长什么样",
    apiLabel: "BroadcastMessage<T>",
    summary: "窃听同一通道，展示 senderId / timestamp / state 三字段的消息结构。",
    repro: reproWireInspector,
    reproPath: "src/demos/wire-inspector.repro.ts",
    create: (ctx) => createWireInspectorDemo(ctx.log),
  },
  {
    id: "field-filter",
    group: "sync",
    title: "filter：只广播部分字段",
    apiLabel: "broadcast({ filter })",
    summary: "editor 的广播经 filter 折叠成 { count }，noise 作为本地草稿不出页。",
    repro: reproFieldFilter,
    reproPath: "src/demos/field-filter.repro.ts",
    create: (ctx) => createFieldFilterDemo(ctx.log),
  },
  {
    id: "conflict-resolver",
    group: "conflict",
    title: "conflictResolution：自定义合并策略",
    apiLabel: "conflictResolution: resolver",
    summary: "holder 用 keepHighest 合并远端值：较小的写入被拒绝，较大的被接受。",
    repro: reproConflictResolver,
    reproPath: "src/demos/conflict-resolver.repro.ts",
    create: (ctx) => createConflictResolverDemo(ctx.log),
  },
  {
    id: "channel-lifecycle",
    group: "lifecycle",
    title: "destroy：掉线与重新加入",
    apiLabel: "store.destroy()",
    summary: "销毁 viewer 即关闭它的通道；重建后从下一笔广播开始重新跟随。",
    repro: reproChannelLifecycle,
    reproPath: "src/demos/channel-lifecycle.repro.ts",
    create: (ctx) => createChannelLifecycleDemo(ctx.log),
  },
];

export { groups };
