import type { ExampleDemo } from "@slux/shell-example";
import reproUndoRedo from "./undo-redo.repro.ts?raw";
import { createUndoRedoDemo } from "./undo-redo";
import reproTravelNotify from "./travel-notify.repro.ts?raw";
import { createTravelNotifyDemo } from "./travel-notify";
import reproMaxDepth from "./max-depth.repro.ts?raw";
import { createMaxDepthDemo } from "./max-depth";
import reproHistoryClear from "./history-clear.repro.ts?raw";
import { createHistoryClearDemo } from "./history-clear";
import reproCanFlags from "./can-flags.repro.ts?raw";
import { createCanFlagsDemo } from "./can-flags";

const groups = [
  {
    id: "travel",
    name: "travel",
    title: "撤销重做",
    summary: "undo/redo 在 past 与 future 之间移动，且对订阅者完全可见。",
  },
  {
    id: "limit",
    name: "limit",
    title: "历史上限",
    summary: "maxDepth 限制快照数量，最早的快照先被挤出。",
  },
  {
    id: "reset",
    name: "reset",
    title: "清空历史",
    summary: "clear 一次性清空 past 与 future，自身不入栈。",
  },
  {
    id: "flags",
    name: "flags",
    title: "状态信号",
    summary: "canUndo/canRedo 是 signal，标志位变化即推送。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "undo-redo",
    group: "travel",
    title: "undo/redo：文本时间旅行",
    apiLabel: "history() + undo()/redo()",
    summary: "每次写入把旧状态压入 past，undo/redo 在快照间往返。",
    repro: reproUndoRedo,
    reproPath: "src/demos/undo-redo.repro.ts",
    create: ({ log }) => createUndoRedoDemo(log),
  },
  {
    id: "travel-notify",
    group: "travel",
    title: "undo/redo：订阅者同步可见",
    apiLabel: "history + store.subscribe",
    summary: "时间旅行走完整中间件链，listener 收到的通知与普通写入一致。",
    repro: reproTravelNotify,
    reproPath: "src/demos/travel-notify.repro.ts",
    create: ({ log }) => createTravelNotifyDemo(log),
  },
  {
    id: "max-depth",
    group: "limit",
    title: "maxDepth：快照上限",
    apiLabel: "history({ maxDepth: 3 })",
    summary: "写入超过上限后最早的快照被挤出，undo 到边界即失效。",
    repro: reproMaxDepth,
    reproPath: "src/demos/max-depth.repro.ts",
    create: ({ log }) => createMaxDepthDemo(log),
  },
  {
    id: "history-clear",
    group: "reset",
    title: "clear：清空历史",
    apiLabel: "history.clear()",
    summary: "清空 past 与 future 后 canUndo/canRedo 复位，撤销不再可用。",
    repro: reproHistoryClear,
    reproPath: "src/demos/history-clear.repro.ts",
    create: ({ log }) => createHistoryClearDemo(log),
  },
  {
    id: "can-flags",
    group: "flags",
    title: "canUndo/canRedo：信号标志位",
    apiLabel: "history.canUndo / canRedo",
    summary: "两个 ReadonlySignal 实时反映历史栈状态，可直接订阅。",
    repro: reproCanFlags,
    reproPath: "src/demos/can-flags.repro.ts",
    create: ({ log }) => createCanFlagsDemo(log),
  },
];

export { groups };
