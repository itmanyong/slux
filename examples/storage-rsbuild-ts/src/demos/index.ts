import type { ExampleDemo } from "@slux/shell-example";
import reproMemoryBackend from "./memory-backend.repro.ts?raw";
import { createMemoryBackendDemo } from "./memory-backend";
import reproPersistBasics from "./persist-basics.repro.ts?raw";
import { createPersistBasicsDemo } from "./persist-basics";
import reproPartializeMerge from "./partialize-merge.repro.ts?raw";
import { createPartializeMergeDemo } from "./partialize-merge";
import reproVersionMigrate from "./version-migrate.repro.ts?raw";
import { createVersionMigrateDemo } from "./version-migrate";
import reproSkipHydration from "./skip-hydration.repro.ts?raw";
import { createSkipHydrationDemo } from "./skip-hydration";
import reproCorruptData from "./corrupt-data.repro.ts?raw";
import { createCorruptDataDemo } from "./corrupt-data";
import reproHydrateCallbacks from "./hydrate-callbacks.repro.ts?raw";
import { createHydrateCallbacksDemo } from "./hydrate-callbacks";

const groups = [
  {
    id: "backends",
    name: "backends",
    title: "存储后端",
    summary: "StorageAdapter 契约统一 memory / web / cookie / IndexedDB 后端。",
  },
  {
    id: "persist",
    name: "persist",
    title: "持久化写入",
    summary: "onSet 末尾自动落盘；partialize 控制哪些字段进 envelope。",
  },
  {
    id: "hydration",
    name: "hydration",
    title: "水合生命周期",
    summary: "skipHydration、onError、onHydrate/hasHydrated 管理读回时机与失败。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "memory-backend",
    group: "backends",
    title: "memoryStorage：内存后端语义",
    apiLabel: "memoryStorage()",
    summary: "Map 语义的 StorageAdapter：set/get/remove/clear 即插即用。",
    repro: reproMemoryBackend,
    reproPath: "src/demos/memory-backend.repro.ts",
    create: ({ log }) => createMemoryBackendDemo(log),
  },
  {
    id: "persist-basics",
    group: "persist",
    title: "persist：写入即落盘",
    apiLabel: "persist({ key, storage })",
    summary: "init 自动水合；每次 setState 后 envelope 同步写入后端。",
    repro: reproPersistBasics,
    reproPath: "src/demos/persist-basics.repro.ts",
    create: ({ log }) => createPersistBasicsDemo(log),
  },
  {
    id: "partialize-merge",
    group: "persist",
    title: "partialize：选择性落盘",
    apiLabel: "persist({ partialize })",
    summary: "只有白名单字段进 envelope，secret 等敏感数据留在内存。",
    repro: reproPartializeMerge,
    reproPath: "src/demos/partialize-merge.repro.ts",
    create: ({ log }) => createPartializeMergeDemo(log),
  },
  {
    id: "version-migrate",
    group: "persist",
    title: "version/migrate：数据升级",
    apiLabel: "persist({ version, migrate })",
    summary: "读到旧版本 envelope 时先迁移再合并，老用户平滑升级。",
    repro: reproVersionMigrate,
    reproPath: "src/demos/version-migrate.repro.ts",
    create: ({ log }) => createVersionMigrateDemo(log),
  },
  {
    id: "skip-hydration",
    group: "hydration",
    title: "skipHydration：手动水合",
    apiLabel: "persist({ skipHydration })",
    summary: "init 不读盘，由调用方在合适时机调用 rehydrate()。",
    repro: reproSkipHydration,
    reproPath: "src/demos/skip-hydration.repro.ts",
    create: ({ log }) => createSkipHydrationDemo(log),
  },
  {
    id: "corrupt-data",
    group: "hydration",
    title: "onError：坏数据处理",
    apiLabel: "persist({ onError })",
    summary: "反序列化失败只上报错误码，状态保持初始值不被污染。",
    repro: reproCorruptData,
    reproPath: "src/demos/corrupt-data.repro.ts",
    create: ({ log }) => createCorruptDataDemo(log),
  },
  {
    id: "hydrate-callbacks",
    group: "hydration",
    title: "onHydrate/hasHydrated：水合回调",
    apiLabel: "persist.onHydrate(cb)",
    summary: "每次水合完成触发回调；clearStorage 后可重新水合。",
    repro: reproHydrateCallbacks,
    reproPath: "src/demos/hydrate-callbacks.repro.ts",
    create: ({ log }) => createHydrateCallbacksDemo(log),
  },
];

export { groups };
